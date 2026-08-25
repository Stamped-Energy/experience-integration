import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseEvidenceRefs } from "../src/cases/parse-refs.js";

describe("parseEvidenceRefs", () => {
  it("parses tag window baseline tariff finding", () => {
    const scope = parseEvidenceRefs([
      "tag:feeder_b/active_power_kw?window=2026-08-25T10:00:00Z/2026-08-25T16:00:00Z",
      "baseline:bl-incomer-vinayak",
      "tariff:tariff-jvvnl-ht1-vinayak-2026/demand-line",
      "finding:f-vinayak-md-stagger-001",
    ]);
    assert.equal(scope.assetId, "feeder_b");
    assert.equal(scope.metric, "active_power_kw");
    assert.equal(scope.from, "2026-08-25T10:00:00Z");
    assert.equal(scope.to, "2026-08-25T16:00:00Z");
    assert.equal(scope.baselineId, "bl-incomer-vinayak");
    assert.equal(scope.findingId, "f-vinayak-md-stagger-001");
  });

  it("falls back to finding window then default hours", () => {
    const withFinding = parseEvidenceRefs(["tag:pump_cw_12/active_power_kw"], {
      findingWindow: "2026-08-01T00:00:00Z/2026-08-01T06:00:00Z",
    });
    assert.equal(withFinding.from, "2026-08-01T00:00:00Z");
    assert.equal(withFinding.to, "2026-08-01T06:00:00Z");

    const def = parseEvidenceRefs(["tag:incomer_1/apparent_power_kva"]);
    assert.equal(def.assetId, "incomer_1");
    assert.ok(Date.parse(def.to) > Date.parse(def.from));
  });
});
