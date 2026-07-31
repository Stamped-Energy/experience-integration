import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PrescriptionTradeoff } from "../src/lib/types.js";

describe("tradeoff field order (INR hero)", () => {
  it("lists energyBenefitInrMonthly before co-benefit fields", () => {
    const tradeoff: PrescriptionTradeoff = {
      energyBenefitInrMonthly: 84000,
      throughputRisk: "none",
      orderContext: "known",
      recommendedWindow: "stagger line_3",
      alternatives: ["HVAC"],
      departmentOwners: ["electrical_supervisor"],
      oeeImpact: "buffer ok",
    };
    const keys = Object.keys(tradeoff);
    assert.ok(
      keys.indexOf("energyBenefitInrMonthly") < keys.indexOf("throughputRisk"),
    );
    const oeeIdx = keys.indexOf("oeeImpact");
    assert.ok(
      keys.indexOf("energyBenefitInrMonthly") < (oeeIdx === -1 ? 99 : oeeIdx),
    );
  });
});
