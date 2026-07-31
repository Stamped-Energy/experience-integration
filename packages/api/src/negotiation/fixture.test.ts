import { describe, expect, it } from "vitest";
import { acceptFixture, reviseFixture } from "./fixture.js";

describe("negotiation fixtures", () => {
  it("revise is idempotent on Idempotency-Key", () => {
    const a = reviseFixture({
      orgId: "org_acme",
      plantId: "plant_vinayak_1",
      prescriptionId: "rx_9001",
      constraints: { exclude_line_ids: ["line_2"] },
      idempotencyKey: "idem-revise-1",
    });
    const b = reviseFixture({
      orgId: "org_acme",
      plantId: "plant_vinayak_1",
      prescriptionId: "rx_9001",
      constraints: { exclude_line_ids: ["line_2"] },
      idempotencyKey: "idem-revise-1",
    });
    expect(a.id).toBe(b.id);
    expect(a.confirmation).toEqual({ status: "proposed" });
    expect(a.tradeoff.energy_benefit_inr_monthly).toBeGreaterThan(0);
  });

  it("accept returns accepted status", () => {
    const r = acceptFixture({
      orgId: "org_acme",
      plantId: "plant_vinayak_1",
      threadId: "neg-1",
      idempotencyKey: "idem-accept-1",
    });
    expect(r.status).toBe("accepted");
  });
});
