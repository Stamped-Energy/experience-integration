import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isCustomerVisiblePrescription } from "../src/prescriptions/service.js";

describe("customer prescription filter", () => {
  it("hides blocked, pending_stamped_review, and withheld from product DTOs", () => {
    assert.equal(isCustomerVisiblePrescription({ status: "blocked" }), false);
    assert.equal(
      isCustomerVisiblePrescription({ status: "pending_stamped_review" }),
      false,
    );
    assert.equal(isCustomerVisiblePrescription({ status: "withheld" }), false);
    assert.equal(
      isCustomerVisiblePrescription({ workflow_status: "blocked" }),
      false,
    );
    assert.equal(isCustomerVisiblePrescription({ status: "open" }), true);
    assert.equal(isCustomerVisiblePrescription({ status: "in_progress" }), true);
  });
});
