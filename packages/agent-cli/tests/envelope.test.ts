import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  failureEnvelope,
  successEnvelope,
} from "../src/envelope.js";

describe("agent CLI envelope", () => {
  it("success shape matches contract", () => {
    const env = successEnvelope("health", { status: "ok" }, 3);
    assert.equal(env.ok, true);
    assert.deepEqual(env.citations, []);
    assert.equal(env.meta.layer, "l6");
    assert.equal(env.meta.verb, "health");
    assert.equal(env.meta.duration_ms, 3);
    assert.equal(env.meta.binary, "stamped-l6");
  });

  it("failure shape omits data and citations", () => {
    const env = failureEnvelope("tool.call", "denied", "nope", 1);
    assert.equal(env.ok, false);
    assert.equal(env.error.code, "denied");
    assert.equal("data" in env, false);
    assert.equal("citations" in env, false);
  });
});
