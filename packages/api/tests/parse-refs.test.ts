import { describe, expect, it } from "vitest";
import { parseEvidenceRefs } from "../src/cases/parse-refs.js";

describe("parseEvidenceRefs", () => {
  it("parses tag window baseline tariff finding", () => {
    const scope = parseEvidenceRefs([
      "tag:feeder_b/active_power_kw?window=2026-08-25T10:00:00Z/2026-08-25T16:00:00Z",
      "baseline:bl-incomer-vinayak",
      "tariff:tariff-jvvnl-ht1-vinayak-2026/demand-line",
      "finding:f-vinayak-md-stagger-001",
    ]);
    expect(scope.assetId).toBe("feeder_b");
    expect(scope.metric).toBe("active_power_kw");
    expect(scope.from).toBe("2026-08-25T10:00:00Z");
    expect(scope.to).toBe("2026-08-25T16:00:00Z");
    expect(scope.baselineId).toBe("bl-incomer-vinayak");
    expect(scope.findingId).toBe("f-vinayak-md-stagger-001");
  });

  it("falls back to finding window then default hours", () => {
    const withFinding = parseEvidenceRefs(["tag:pump_cw_12/active_power_kw"], {
      findingWindow: "2026-08-01T00:00:00Z/2026-08-01T06:00:00Z",
    });
    expect(withFinding.from).toBe("2026-08-01T00:00:00Z");
    expect(withFinding.to).toBe("2026-08-01T06:00:00Z");

    const def = parseEvidenceRefs(["tag:incomer_1/apparent_power_kva"]);
    expect(def.assetId).toBe("incomer_1");
    expect(Date.parse(def.to)).toBeGreaterThan(Date.parse(def.from));
  });
});
