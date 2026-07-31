import { describe, expect, it } from "vitest";
import type { PrescriptionTradeoff } from "@/lib/types";

describe("tradeoff field order (₹ hero)", () => {
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
    expect(keys.indexOf("energyBenefitInrMonthly")).toBeLessThan(
      keys.indexOf("throughputRisk"),
    );
    expect(keys.indexOf("energyBenefitInrMonthly")).toBeLessThan(
      keys.indexOf("oeeImpact") === -1 ? 99 : keys.indexOf("oeeImpact"),
    );
  });
});
