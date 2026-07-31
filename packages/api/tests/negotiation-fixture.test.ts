import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { acceptFixture, reviseFixture } from "../src/negotiation/fixture.js";

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
    assert.equal(a.id, b.id);
    assert.deepEqual(a.confirmation, { status: "proposed" });
    assert.ok(a.tradeoff.energy_benefit_inr_monthly > 0);
  });

  it("accept returns accepted status", () => {
    const r = acceptFixture({
      orgId: "org_acme",
      plantId: "plant_vinayak_1",
      threadId: "neg-1",
      idempotencyKey: "idem-accept-1",
    });
    assert.equal(r.status, "accepted");
  });
});
