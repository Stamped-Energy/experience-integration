import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  claimBadgeLabel,
  LedgerEntrySchema,
  missingDataLabel,
  STAMPED_INTERNAL_WORKFLOW_STATUSES,
  VerificationStatusSchema,
  workflowStatusToLane,
  WorkflowEventSchema,
  WorkflowStatusSchema,
} from "../src/index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const fixtures = join(root, "external/contracts/fixtures");

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(fixtures, name), "utf8"));
}

describe("claim vocabulary", () => {
  it("accepts platform verification_status enum", () => {
    for (const status of [
      "pending",
      "ops_confirmed",
      "verified",
      "disputed",
      "modeled",
    ]) {
      assert.equal(VerificationStatusSchema.parse(status), status);
    }
  });

  it("labels ops_confirmed distinctly from bill verified", () => {
    assert.equal(claimBadgeLabel("ops_confirmed").label, "Ops-confirmed");
    assert.match(claimBadgeLabel("modeled").label, /not bill-verified/i);
    assert.equal(claimBadgeLabel("verified").label, "Bill-verified");
  });

  it("marks missing fields explicitly", () => {
    assert.equal(
      missingDataLabel("scope_1_tco2e"),
      "scope_1_tco2e: not_measured_by_stamped",
    );
  });
});

describe("workflow → UI lane mapping", () => {
  it("covers every customer-visible WorkflowStatus", () => {
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
      if (STAMPED_INTERNAL_WORKFLOW_STATUSES.has(status)) continue;
      assert.equal(workflowStatusToLane(status), expected[status]);
    }
  });

  it("throws for stamped-internal statuses", () => {
    for (const status of STAMPED_INTERNAL_WORKFLOW_STATUSES) {
      assert.throws(() => workflowStatusToLane(status as never));
    }
  });
});

describe("external fixture corpus", () => {
  it("parses workflow_event.valid.json", () => {
    const parsed = WorkflowEventSchema.parse(
      loadFixture("envelope/workflow_event.valid.json"),
    );
    assert.equal(parsed.to_status, "in_progress");
    assert.equal(workflowStatusToLane(parsed.to_status), "active");
  });

  it("parses workflow_event_ops_verified.valid.json", () => {
    const parsed = WorkflowEventSchema.parse(
      loadFixture("envelope/workflow_event_ops_verified.valid.json"),
    );
    assert.equal(parsed.event_type, "ops_verified");
  });

  it("parses ledger_entry.valid.json with ops_confirmed", () => {
    const parsed = LedgerEntrySchema.parse(
      loadFixture("closure/ledger_entry.valid.json"),
    );
    assert.equal(parsed.verification_status, "ops_confirmed");
    assert.equal(claimBadgeLabel(parsed.verification_status).tone, "good");
  });

  it("parses ledger_entry_opportunity_cost.valid.json as modeled", () => {
    const parsed = LedgerEntrySchema.parse(
      loadFixture("closure/ledger_entry_opportunity_cost.valid.json"),
    );
    assert.equal(parsed.verification_status, "modeled");
    assert.equal(parsed.entry_type, "opportunity_cost");
  });
});
