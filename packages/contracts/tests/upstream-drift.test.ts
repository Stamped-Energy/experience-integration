import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { checkUpstreamContracts } from "../src/upstream-check.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("upstream OpenAPI drift check", () => {
  it("passes against pinned snapshots", () => {
    const result = checkUpstreamContracts(root, { write: false });
    assert.equal(result.ok, true, !result.ok ? result.message : "");
    if (result.ok) {
      assert.ok(result.layers.l2);
      assert.ok(result.layers.l4);
      assert.ok(result.layers.l5);
    }
  });
});
