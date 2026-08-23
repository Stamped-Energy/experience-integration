import assert from "node:assert/strict";
import http from "node:http";
import { after, before, describe, it } from "node:test";
import { UpstreamError } from "../src/upstream/http.js";
import {
  L4AnalystClient,
  projectContextEnvelope,
  type AnalystContextEnvelope,
} from "../src/upstream/l4/client.js";

const envelope: AnalystContextEnvelope = {
  orgId: "org_demo",
  plantId: "plant_jaipur_01",
  userId: "user_1",
  role: "supervisor",
  routeId: "alarms",
  screenTitle: "EMS alarm console",
  focusEntity: { type: "alarm", id: "al_1" },
  visibleSummary: ["2 critical"],
  excludeKeys: ["route"],
};

function createMockL4() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    const send = (status: number, body: unknown) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    };
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const body = chunks.length
        ? (JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>)
        : {};

      if (req.method === "POST" && url.pathname === "/v1/chat/sessions") {
        return send(201, {
          id: "sess_live_1",
          org_id: body.org_id,
          plant_id: body.plant_id,
          user_id: body.user_id,
          title: null,
        });
      }

      const msg = url.pathname.match(/^\/v1\/chat\/sessions\/([^/]+)\/messages$/);
      if (req.method === "POST" && msg) {
        const ctx = body.context as { plant_id?: string; visible_chips?: unknown[] };
        return send(200, {
          message_id: "msg_live_1",
          status: "OK",
          content: `Live reply for ${ctx.plant_id}`,
          citations: [{ id: "c1", title: "Source", snippet: "…", path: "G" }],
        });
      }

      const stream = url.pathname.match(
        /^\/v1\/chat\/sessions\/([^/]+)\/messages\/stream$/,
      );
      if (req.method === "POST" && stream) {
        res.writeHead(200, { "content-type": "text/event-stream" });
        res.write(`event: token\ndata: ${JSON.stringify({ text: "Live " })}\n\n`);
        res.write(`event: token\ndata: ${JSON.stringify({ text: "stream" })}\n\n`);
        res.write(
          `event: done\ndata: ${JSON.stringify({
            message_id: "msg_stream_1",
            content: "Live stream",
            status: "OK",
          })}\n\n`,
        );
        return res.end();
      }

      send(404, { code: "NOT_FOUND" });
    });
  });

  return {
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

describe("L4AnalystClient", () => {
  const mock = createMockL4();
  let baseUrl = "";

  before(async () => {
    baseUrl = await mock.listen();
  });

  after(async () => {
    await mock.close();
  });

  it("projects removable chips and strips excluded keys", () => {
    const projected = projectContextEnvelope(envelope);
    assert.equal(projected.org_id, "org_demo");
    assert.equal(
      projected.visible_chips.some((c) => c.key === "route"),
      false,
    );
    assert.ok(projected.visible_chips.some((c) => c.key === "screen"));
  });

  it("serves fixture sessions/messages when L4_LIVE=false", async () => {
    const client = new L4AnalystClient({
      baseUrl,
      timeoutMs: 2_000,
      live: false,
    });
    const session = await client.createSession({
      orgId: envelope.orgId,
      plantId: envelope.plantId,
      userId: envelope.userId,
    });
    const msg = await client.postMessage({
      sessionId: session.session_id,
      content: "Why is demand high?",
      envelope,
    });
    assert.match(session.session_id, /^sess_fixture_/);
    assert.equal(msg.role, "assistant");
    assert.ok(msg.citations.length >= 1);
  });

  it("calls live adapter paths when enabled", async () => {
    const client = new L4AnalystClient({
      baseUrl,
      timeoutMs: 2_000,
      live: true,
    });
    const session = await client.createSession({
      orgId: envelope.orgId,
      plantId: envelope.plantId,
      userId: envelope.userId,
    });
    assert.equal(session.session_id, "sess_live_1");
    const msg = await client.postMessage({
      sessionId: session.session_id,
      content: "Explain",
      envelope,
    });
    assert.match(msg.content, /Live reply/);
  });

  it("opens live SSE stream path", async () => {
    const client = new L4AnalystClient({
      baseUrl,
      timeoutMs: 2_000,
      live: true,
    });
    const session = await client.createSession({
      orgId: envelope.orgId,
      plantId: envelope.plantId,
      userId: envelope.userId,
    });
    const res = await client.openMessageStream({
      sessionId: session.session_id,
      content: "stream please",
      envelope,
    });
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.match(text, /event: done/);
    assert.match(text, /Live stream/);
  });

  it("rejects cross-tenant focus entities", async () => {
    const client = new L4AnalystClient({
      baseUrl,
      timeoutMs: 2_000,
      live: false,
    });
    await assert.rejects(
      () =>
        client.postMessage({
          sessionId: "sess_x",
          content: "hi",
          envelope,
          entityPlantId: "plant_other",
        }),
      (err: unknown) =>
        err instanceof UpstreamError && err.code === "TENANT_MISMATCH",
    );
  });
});
