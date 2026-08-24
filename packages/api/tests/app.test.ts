import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildApp } from "../src/app.js";
import { loadEnv } from "../src/config.js";

describe("config", () => {
  it("loads defaults", () => {
    const env = loadEnv({
      NODE_ENV: "test",
      BETTER_AUTH_SECRET: "test-secret-stamped-l6-auth-32chars!",
    });
    assert.equal(env.PORT, 3001);
    assert.equal(env.REQUIRE_DATABASE, false);
  });

  it("rejects invalid PORT", () => {
    assert.throws(() =>
      loadEnv({
        NODE_ENV: "test",
        BETTER_AUTH_SECRET: "test-secret-stamped-l6-auth-32chars!",
        PORT: "nope",
      }),
    );
  });

  it("requires BETTER_AUTH_SECRET", () => {
    assert.throws(() => loadEnv({ NODE_ENV: "test" }));
  });
});

describe("Fastify BFF inject", () => {
  const testEnv = {
    NODE_ENV: "test" as const,
    LOG_LEVEL: "silent" as const,
    BETTER_AUTH_SECRET: "test-secret-stamped-l6-auth-32chars!",
  };

  it("serves /health", async () => {
    const app = await buildApp({
      env: loadEnv(testEnv),
    });
    const res = await app.inject({ method: "GET", url: "/health" });
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().status, "ok");
    await app.close();
  });

  it("echoes x-request-id", async () => {
    const app = await buildApp({
      env: loadEnv(testEnv),
    });
    const res = await app.inject({
      method: "GET",
      url: "/health",
      headers: { "x-request-id": "req_test_1" },
    });
    assert.equal(res.headers["x-request-id"], "req_test_1");
    await app.close();
  });

  it("returns RFC 9457 problem+json for unknown routes", async () => {
    const app = await buildApp({
      env: loadEnv(testEnv),
    });
    const res = await app.inject({ method: "GET", url: "/missing" });
    assert.equal(res.statusCode, 404);
    assert.match(String(res.headers["content-type"]), /problem\+json/);
    const body = res.json();
    assert.equal(body.status, 404);
    assert.ok(body.request_id);
    await app.close();
  });

  it("readiness stays green when DB is down (local serving only)", async () => {
    const app = await buildApp({
      env: loadEnv({
        ...testEnv,
        REQUIRE_DATABASE: "true",
      }),
      checkReady: () => false,
    });
    const ready = await app.inject({ method: "GET", url: "/ready" });
    assert.equal(ready.statusCode, 200);
    assert.equal(ready.json().status, "ready");
    const deep = await app.inject({ method: "GET", url: "/health/deep" });
    assert.equal(deep.statusCode, 503);
    await app.close();
  });

  it("sets security headers via helmet", async () => {
    const app = await buildApp({
      env: loadEnv(testEnv),
    });
    const res = await app.inject({ method: "GET", url: "/health" });
    assert.ok(res.headers["x-content-type-options"]);
    await app.close();
  });

  it("rejects unauthenticated telemetry when auth is wired", async () => {
    const auth = {
      api: {
        getSession: async () => null,
      },
    };
    const app = await buildApp({
      env: loadEnv(testEnv),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      auth: auth as any,
    });
    const res = await app.inject({
      method: "POST",
      url: "/api/telemetry",
      payload: { event_name: "alarm_ack", properties: { route: "alarms" } },
    });
    assert.equal(res.statusCode, 401);
    await app.close();
  });

  it("exposes product meta, not public API", async () => {
    const app = await buildApp({
      env: loadEnv(testEnv),
    });
    const res = await app.inject({ method: "GET", url: "/api/meta" });
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().public_api, false);
    await app.close();
  });
});
