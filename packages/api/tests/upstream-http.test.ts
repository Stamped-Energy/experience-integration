import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { correlationStore } from "../src/upstream/correlation.js";
import { UpstreamError, upstreamFetch } from "../src/upstream/http.js";

describe("upstreamFetch correlation", () => {
  it("forwards x-request-id from AsyncLocalStorage", async () => {
    const originalFetch = globalThis.fetch;
    let seen: Record<string, string> | undefined;
    globalThis.fetch = (async (_url, init) => {
      const h = init?.headers;
      if (h && typeof h === "object" && !(h instanceof Headers) && !Array.isArray(h)) {
        seen = h as Record<string, string>;
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;

    try {
      await correlationStore.run({ requestId: "corr-from-ingress" }, async () => {
        await upstreamFetch({
          baseUrl: "http://upstream.test/",
          path: "/v1/ping",
          timeoutMs: 1000,
        });
      });
      assert.equal(seen?.["x-request-id"], "corr-from-ingress");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("surfaces upstream errors", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ code: "NOPE", detail: "denied" }), {
        status: 403,
      })) as typeof fetch;
    try {
      await assert.rejects(
        () =>
          upstreamFetch({
            baseUrl: "http://upstream.test/",
            path: "/v1/x",
            timeoutMs: 1000,
          }),
        (err: unknown) => err instanceof UpstreamError && err.status === 403,
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
