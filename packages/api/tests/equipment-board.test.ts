import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  distributionFromAssets,
  healthFromLoad,
  statusFromLoad,
} from "../src/insights/equipment.js";

describe("equipment-board helpers", () => {
  it("statusFromLoad maps load bands without inventing OPTIMIZED", () => {
    assert.equal(statusFromLoad(null, false), "OFFLINE");
    assert.equal(statusFromLoad(0, true), "OFFLINE");
    assert.equal(statusFromLoad(70, true), "GOOD");
    assert.equal(statusFromLoad(95, true), "WARNING");
    assert.equal(statusFromLoad(110, true), "CRITICAL");
  });

  it("healthFromLoad is null when idle and declines under overload", () => {
    assert.equal(healthFromLoad(null), null);
    assert.equal(healthFromLoad(0), null);
    const calm = healthFromLoad(70)!;
    const hot = healthFromLoad(110)!;
    assert.ok(calm > hot);
    assert.ok(calm >= 80);
    assert.ok(hot < 70);
  });

  it("distributionFromAssets buckets only scored assets", () => {
    const dist = distributionFromAssets([
      { health: 90 },
      { health: 70 },
      { health: 50 },
      { health: null },
    ]);
    assert.ok(dist);
    assert.equal(dist![0]!.value, 1);
    assert.equal(dist![1]!.value, 1);
    assert.equal(dist![2]!.value, 1);
    assert.equal(distributionFromAssets([{ health: null }]), null);
  });
});
