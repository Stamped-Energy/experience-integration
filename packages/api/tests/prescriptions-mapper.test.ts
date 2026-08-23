import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mapL5PrescriptionToProduct } from "../src/prescriptions/service.js";

describe("mapL5PrescriptionToProduct lifecycle + money", () => {
  it("maps lifecycle timestamps, ledger summary, and MD flags", () => {
    const mapped = mapL5PrescriptionToProduct({
      prescription_id: "rx-md-1",
      plant_id: "plant_vinayak_1",
      what: "Stagger furnace",
      why: "MD",
      category: "md_overlap",
      status: "verified",
      owner_role: "supervisor",
      when: "next_monday_shift_start",
      first_recommended_at: "2026-07-08T07:15:00Z",
      accepted_at: "2026-07-08T07:20:00Z",
      implemented_at: "2026-07-10T06:00:00Z",
      verified_at: "2026-07-10T07:00:00Z",
      ops_label: "ops_confirmed",
      is_md_demand: true,
      md_episode_id: "mde-1",
      md_episode: { peak_kva: 945, cmd_kva: 820, episode_inr_cap: 43750 },
      impact: { inr_monthly: 43750 },
      ledger_summary: {
        potential: {
          entry_type: "potential_savings",
          verification_status: "pending",
          potential_inr: 43750,
          realised_inr: 0,
        },
        realised_ops: {
          entry_type: "realised_savings",
          verification_status: "ops_confirmed",
          potential_inr: 43750,
          realised_inr: 43750,
        },
        opportunity_cost: {
          entry_type: "opportunity_cost",
          verification_status: "modeled",
          delay_days: 2,
          realised_inr: 2916.67,
        },
      },
    });
    assert.equal(mapped.firstRecommendedAt, "2026-07-08T07:15:00Z");
    assert.equal(mapped.implementedAt, "2026-07-10T06:00:00Z");
    assert.equal(mapped.verifiedAt, "2026-07-10T07:00:00Z");
    assert.equal(mapped.verificationStatus, "ops_confirmed");
    assert.equal(mapped.realisedInr, 43750);
    assert.equal(mapped.opportunityCost?.delayDays, 2);
    assert.equal(mapped.isMdDemand, true);
    assert.equal(mapped.mdEpisodeId, "mde-1");
  });
});
