import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { prescriptionsFixture } from "../src/fixtures/demo.js";
import {
  applyRxAction,
  filterLane,
  optimisticRxUpdate,
  requiresReason,
  sortPrescriptions,
} from "../src/lib/prescriptions.js";

const root = dirname(fileURLToPath(import.meta.url));
const queueSrc = readFileSync(
  join(root, "../src/components/prescriptions/PrescriptionQueue.tsx"),
  "utf8",
);

describe("prescription triage", () => {
  it("offers Show proof deep-link from expand via rxId query", () => {
    assert.match(queueSrc, /Show proof/);
    assert.match(queueSrc, /\/evidence\?rxId=\$\{rx\.id\}/);
  });

  it("orders by impact×confidence then due date", () => {
    const sorted = sortPrescriptions(prescriptionsFixture);
    assert.ok(
      sorted[0]!.impactInrPerMonth * sorted[0]!.confidence >=
        sorted[1]!.impactInrPerMonth * sorted[1]!.confidence,
    );
  });

  it("requires reasons for defer/reject and supports optimistic rollback", () => {
    assert.equal(requiresReason("defer"), true);
    assert.equal(requiresReason("reject"), true);
    assert.equal(requiresReason("done"), false);
    const target = prescriptionsFixture.find((r) => r.lane === "needs_review")!;
    const { next, rollback } = optimisticRxUpdate(
      prescriptionsFixture,
      target.id,
      "done",
    );
    assert.equal(next.find((r) => r.id === target.id)?.lane, "verifying");
    assert.equal(rollback.find((r) => r.id === target.id)?.lane, target.lane);
    assert.equal(applyRxAction(target, "reject").lane, "closed");
    assert.ok(filterLane(prescriptionsFixture, "needs_review").length >= 1);
  });
});
