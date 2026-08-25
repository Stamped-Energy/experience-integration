import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createLiveTelemetryBaseline, tickLiveTelemetry } from "../src/lib/live-telemetry.js";

describe("live telemetry tick", () => {
  it("starts empty with no invented dials", () => {
    const base = createLiveTelemetryBaseline();
    assert.equal(base.tick, 0);
    assert.deepEqual(base.dials, []);
    assert.deepEqual(base.alerts, []);
  });

  it("ages sync without inventing fixture dial jitter", () => {
    const base = createLiveTelemetryBaseline();
    const next = tickLiveTelemetry(base);
    assert.equal(next.tick, 1);
    assert.equal(next.syncAgeSec, 1);
    assert.deepEqual(next.dials, []);
  });

  it("resets sync age after 15 seconds like stamped topbar", () => {
    let snap = createLiveTelemetryBaseline();
    for (let i = 0; i < 16; i += 1) snap = tickLiveTelemetry(snap);
    assert.equal(snap.syncAgeSec, 0);
  });
});
