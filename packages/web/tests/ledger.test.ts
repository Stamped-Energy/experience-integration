import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ledgerFixture } from "../src/fixtures/demo.js";
import {
  claimDisclosure,
  displayClaim,
  emissionFactorLabel,
  sanitizeClaimStatus,
  sumOpsConfirmedInr,
  sumPotentialInr,
} from "../src/lib/ledger.js";
import type { LedgerEntry } from "../src/lib/types.js";

describe("claim-safe savings ledger", () => {
  it("never promotes ops_confirmed to bill-verified without bill refs", () => {
    const forged: LedgerEntry = {
      ...ledgerFixture[0]!,
      verificationStatus: "verified",
      billLineRefs: undefined,
    };
    assert.equal(sanitizeClaimStatus(forged), "ops_confirmed");
    assert.match(claimDisclosure(forged), /pending utility bill verification/i);
    assert.equal(displayClaim(forged).showBillVerified, false);
  });

  it("allows bill-verified only with bill line refs", () => {
    const billed: LedgerEntry = {
      ...ledgerFixture[0]!,
      verificationStatus: "verified",
      billLineRefs: ["bill_2026_07_line_12"],
    };
    assert.equal(sanitizeClaimStatus(billed), "verified");
    assert.equal(displayClaim(billed).showBillVerified, true);
  });

  it("sums ops-confirmed realised separately from potential", () => {
    const ops = sumOpsConfirmedInr(ledgerFixture);
    const potential = sumPotentialInr(ledgerFixture);
    assert.equal(ops, 41_600);
    assert.ok(potential >= 84_000);
    assert.notEqual(ops, potential);
  });

  it("discloses missing emission factors explicitly", () => {
    const modeled = ledgerFixture.find((e) => e.verificationStatus === "modeled")!;
    assert.equal(emissionFactorLabel(modeled), "not_measured_by_stamped");
    assert.match(claimDisclosure(modeled), /Estimated/i);
  });
});
