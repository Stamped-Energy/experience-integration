import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveLivePageSource } from "../src/lib/l2-live";

describe("resolveLivePageSource", () => {
  it("claims Live from L2 only when assets are from L2", () => {
    assert.equal(resolveLivePageSource("l2", "l2"), "l2");
    assert.equal(resolveLivePageSource("l2", "fixture"), "l2");
  });

  it("does not claim full live when only measurements are from L2", () => {
    assert.equal(resolveLivePageSource("fixture", "l2"), "preview");
  });

  it("stays fixture when both are fixture", () => {
    assert.equal(resolveLivePageSource("fixture", "fixture"), "fixture");
  });
});
