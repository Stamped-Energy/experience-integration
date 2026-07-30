import assert from "node:assert/strict";
import http from "node:http";
import { after, before, describe, it } from "node:test";
import { UpstreamError } from "../src/upstream/http.js";
import {
  L5WorkflowClient,
  toProductAlarm,
} from "../src/upstream/l5/client.js";

type Alarm = {
  id: string;
  org_id: string;
  plant_id: string;
  asset_id: string;
  asset_label: string;
  severity: "critical" | "warning" | "info";
  state: "raised" | "acked" | "escalated" | "silenced" | "cleared";
  summary: string;
  raised_at: string;
};

function createMockL5() {
  const alarms = new Map<string, Alarm>([
    [
      "al_1",
      {
        id: "al_1",
        org_id: "org_demo",
        plant_id: "plant_jaipur_01",
        asset_id: "kiln_1",
        asset_label: "Kiln 1",
        severity: "critical",
        state: "raised",
        summary: "Demand spike",
        raised_at: "2026-07-21T10:00:00+05:30",
      },
    ],
  ]);
  const idempotency = new Map<string, { body: string; alarm: Alarm }>();

  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    const send = (status: number, body: unknown) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    };

    if (req.method === "GET" && url.pathname.startsWith("/v1/plants/")) {
      const plantMatch = url.pathname.match(/^\/v1\/plants\/([^/]+)\/alarms$/);
      if (plantMatch) {
        const plant = decodeURIComponent(plantMatch[1]!);
        const org = url.searchParams.get("org_id");
        const items = [...alarms.values()].filter(
          (a) => a.org_id === org && a.plant_id === plant,
        );
        return send(200, { items, next_cursor: null });
      }
    }

    if (req.method === "GET" && url.pathname === "/v1/alarms") {
      const org = url.searchParams.get("org_id");
      const plant = url.searchParams.get("plant_id");
      const items = [...alarms.values()].filter(
        (a) => a.org_id === org && a.plant_id === plant,
      );
      return send(200, { items, next_cursor: null });
    }

    const silenceMatch = url.pathname.match(/^\/v1\/alarms\/([^/]+)\/silence$/);
    if (req.method === "POST" && silenceMatch) {
      const id = silenceMatch[1]!;
      const key = req.headers["idempotency-key"];
      if (typeof key !== "string" || !key) {
        return send(400, { code: "IDEMPOTENCY_KEY_REQUIRED", detail: "missing key" });
      }
      const chunks: Buffer[] = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () => {
        const raw = Buffer.concat(chunks).toString("utf8");
        const prev = idempotency.get(key);
        if (prev) {
          if (prev.body !== raw) {
            return send(409, { code: "IDEMPOTENCY_CONFLICT", detail: "body mismatch" });
          }
          return send(200, prev.alarm);
        }
        const alarm = alarms.get(id);
        if (!alarm) return send(404, { code: "NOT_FOUND", detail: "alarm" });
        const next = { ...alarm, state: "silenced" as const };
        alarms.set(id, next);
        idempotency.set(key, { body: raw, alarm: next });
        return send(200, next);
      });
      return;
    }

    send(404, { code: "NOT_FOUND", detail: url.pathname });
  });

  return {
    server,
    async listen(): Promise<string> {
      await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
      const addr = server.address();
      if (!addr || typeof addr === "string") throw new Error("no port");
      return `http://127.0.0.1:${addr.port}`;
    },
    close(): Promise<void> {
      return new Promise((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
    },
  };
}

describe("L5WorkflowClient", () => {
  const mock = createMockL5();
  let baseUrl = "";

  before(async () => {
    baseUrl = await mock.listen();
  });

  after(async () => {
    await mock.close();
  });

  it("lists alarms for org/plant", async () => {
    const client = new L5WorkflowClient({
      baseUrl,
      timeoutMs: 2_000,
      features: { alarmAck: false, alarmEscalate: false, alarmUnsilence: false },
    });
    const { items } = await client.listAlarms({
      orgId: "org_demo",
      plantId: "plant_jaipur_01",
    });
    assert.equal(items.length, 1);
    assert.equal(toProductAlarm(items[0]!).assetLabel, "Kiln 1");
  });

  it("silences with idempotent replay", async () => {
    const client = new L5WorkflowClient({
      baseUrl,
      timeoutMs: 2_000,
      features: { alarmAck: true, alarmEscalate: true, alarmUnsilence: true },
    });
    const body = { orgId: "org_demo", plantId: "plant_jaipur_01", actorId: "u1" };
    const first = await client.silenceAlarm("al_1", body, "idem-1");
    const second = await client.silenceAlarm("al_1", body, "idem-1");
    assert.equal(first.state, "silenced");
    assert.deepEqual(first, second);
  });

  it("feature-gates missing ack/escalate/unsilence", async () => {
    const client = new L5WorkflowClient({
      baseUrl,
      timeoutMs: 2_000,
      features: { alarmAck: false, alarmEscalate: false, alarmUnsilence: false },
    });
    await assert.rejects(
      () =>
        client.ackAlarm(
          "al_1",
          { orgId: "org_demo", plantId: "plant_jaipur_01" },
          "idem-ack",
        ),
      (err: unknown) =>
        err instanceof UpstreamError &&
        err.code === "UPSTREAM_FEATURE_UNAVAILABLE" &&
        err.status === 501,
    );
  });

  it("times out slow upstream calls", async () => {
    const slow = http.createServer((_req, res) => {
      // never respond before client timeout
      setTimeout(() => {
        res.writeHead(200);
        res.end("{}");
      }, 5_000);
    });
    await new Promise<void>((resolve) => slow.listen(0, "127.0.0.1", resolve));
    const addr = slow.address();
    if (!addr || typeof addr === "string") throw new Error("no port");
    const client = new L5WorkflowClient({
      baseUrl: `http://127.0.0.1:${addr.port}`,
      timeoutMs: 50,
      features: { alarmAck: false, alarmEscalate: false, alarmUnsilence: false },
    });
    await assert.rejects(
      () => client.listAlarms({ orgId: "o", plantId: "p" }),
      (err: unknown) =>
        err instanceof UpstreamError && err.code === "UPSTREAM_TIMEOUT",
    );
    await new Promise<void>((resolve, reject) =>
      slow.close((e) => (e ? reject(e) : resolve())),
    );
  });
});
