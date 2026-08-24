import assert from "node:assert/strict";
import http from "node:http";
import { describe, it } from "node:test";
import { correlationStore } from "../src/upstream/correlation.js";
import {
  UpstreamError,
  httpAgent,
  upstreamFetch,
} from "../src/upstream/http.js";

async function withServer(
  handler: http.RequestListener,
  fn: (baseUrl: string) => Promise<void>,
): Promise<void> {
  const server = http.createServer(handler);
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const addr = server.address();
  assert.ok(addr && typeof addr === "object");
  try {
    await fn(`http://127.0.0.1:${addr.port}/`);
  } finally {
    server.close();
  }
}

describe("upstreamFetch correlation", () => {
  it("forwards x-request-id from AsyncLocalStorage", async () => {
    let seen: string | undefined;
    await withServer((req, res) => {
      seen = req.headers["x-request-id"] as string | undefined;
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    }, async (baseUrl) => {
      await correlationStore.run({ requestId: "corr-from-ingress" }, async () => {
        await upstreamFetch({
          baseUrl,
          path: "v1/ping",
          timeoutMs: 1000,
        });
      });
      assert.equal(seen, "corr-from-ingress");
    });
  });

  it("surfaces upstream errors", async () => {
    await withServer((_req, res) => {
      res.writeHead(403, { "content-type": "application/json" });
      res.end(JSON.stringify({ code: "NOPE", detail: "denied" }));
    }, async (baseUrl) => {
      await assert.rejects(
        () =>
          upstreamFetch({
            baseUrl,
            path: "v1/x",
            timeoutMs: 1000,
          }),
        (err: unknown) => err instanceof UpstreamError && err.status === 403,
      );
    });
  });
});

describe("upstreamFetch keep-alive + retries", () => {
  it("exports a keep-alive http agent", () => {
    assert.equal(httpAgent.keepAlive, true);
  });

  it("retries idempotent GET on 503 then succeeds", async () => {
    let hits = 0;
    await withServer((req, res) => {
      hits += 1;
      if (hits < 2) {
        res.writeHead(503, { "content-type": "application/json" });
        res.end(JSON.stringify({ code: "BUSY", detail: "try later" }));
        return;
      }
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    }, async (baseUrl) => {
      const body = await upstreamFetch<{ ok: boolean }>({
        baseUrl,
        path: "v1/ping",
        timeoutMs: 2000,
        maxRetries: 2,
      });
      assert.equal(body.ok, true);
      assert.equal(hits, 2);
    });
  });

  it("does not retry POST mutations", async () => {
    let hits = 0;
    await withServer((_req, res) => {
      hits += 1;
      res.writeHead(503, { "content-type": "application/json" });
      res.end(JSON.stringify({ detail: "busy" }));
    }, async (baseUrl) => {
      await assert.rejects(
        () =>
          upstreamFetch({
            baseUrl,
            path: "v1/mutate",
            method: "POST",
            body: { x: 1 },
            timeoutMs: 2000,
            maxRetries: 5,
          }),
        (err: unknown) => err instanceof UpstreamError && err.status === 503,
      );
      assert.equal(hits, 1);
    });
  });
});
