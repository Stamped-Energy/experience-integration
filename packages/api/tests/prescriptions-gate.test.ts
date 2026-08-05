import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isCustomerVisiblePrescription } from "../src/prescriptions/service.js";

describe("customer prescription filter", () => {
  it("hides pending_stamped_review and withheld", () => {
    assert.equal(
      isCustomerVisiblePrescription({ status: "pending_stamped_review" }),
      false,
    );
    assert.equal(isCustomerVisiblePrescription({ status: "withheld" }), false);
    assert.equal(isCustomerVisiblePrescription({ status: "open" }), true);
  });
});
