import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AlarmStateSchema,
  STAMPED_INTERNAL_WORKFLOW_STATUSES,
  VerificationStatusSchema,
  WorkflowStatusSchema,
} from "@stamped/l6-contracts";
import {
  alarmStateToUi,
  dualClaimLabels,
  missingDataPolicy,
  projectPrescriptionLane,
} from "../src/upstream/mappings.js";

describe("canonical workflow and claim mappings", () => {
  it("maps every workflow status to a UI lane (golden)", () => {
    const expected: Record<string, string> = {
      open: "needs_review",
      blocked: "needs_review",
      in_progress: "active",
      deferred: "active",
      done: "verifying",
      verified: "closed",
      rejected: "closed",
      disputed: "closed",
    };
    for (const status of WorkflowStatusSchema.options) {
      if (STAMPED_INTERNAL_WORKFLOW_STATUSES.has(status)) {
        assert.throws(() => projectPrescriptionLane(status));
        continue;
      }
      assert.equal(projectPrescriptionLane(status), expected[status]);
    }
  });

  it("keeps ops_confirmed dual labels distinct from bill verified", () => {
    const ops = dualClaimLabels("ops_confirmed");
    const bill = dualClaimLabels("verified");
    const modeled = dualClaimLabels("modeled");
    assert.match(ops.long, /not bill-verified/i);
    assert.match(bill.long, /Bill-verified/);
    assert.match(modeled.long, /not ops-confirmed/i);
    assert.notEqual(ops.short.label, bill.short.label);
  });

  it("covers every alarm state with non-empty actions except clear-only evidence", () => {
    for (const state of AlarmStateSchema.options) {
      const ui = alarmStateToUi(state);
      assert.ok(ui.label.length > 0);
      assert.ok(ui.allowedActions.includes("evidence"));
      if (state === "raised") {
        assert.ok(ui.allowedActions.includes("ack"));
      }
      if (state === "silenced") {
        assert.ok(ui.allowedActions.includes("unsilence"));
        assert.equal(ui.allowedActions.includes("ack"), false);
      }
    }
  });

  it("missing-data policy never invents values", () => {
    const policy = missingDataPolicy(["baseline", "ledger"]);
    assert.deepEqual(
      policy.map((p) => p.inventValue),
      [false, false],
    );
    assert.match(policy[0]!.display, /not_measured_by_stamped/);
    for (const status of VerificationStatusSchema.options) {
      assert.ok(dualClaimLabels(status).short.label.length > 0);
    }
  });
});
