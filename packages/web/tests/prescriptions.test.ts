import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import type { Prescription } from "../src/lib/types.js";
import {
  applyRxAction,
  classLabel,
  evidenceRowsFromRefs,
  filterInbox,
  filterLane,
  isManagementClass,
  optimisticRxFeedback,
  optimisticRxUpdate,
  pillarBadges,
  requiresReason,
  sortPrescriptions,
} from "../src/lib/prescriptions.js";

const root = dirname(fileURLToPath(import.meta.url));
const queueSrc = readFileSync(
  join(root, "../src/components/prescriptions/PrescriptionQueue.tsx"),
  "utf8",
);
const decisionSrc = readFileSync(
  join(root, "../src/components/prescriptions/PrescriptionDecisionCard.tsx"),
  "utf8",
);

/** Inline samples — product fixtures are empty; logic tests must not depend on them. */
const sampleRx: Prescription[] = [
  {
    id: "rx_mgmt",
    plantId: "plant_lnm_faridabad_1",
    title: "Stagger kiln starts",
    why: "Avoid MD spike",
    impactInrPerMonth: 120_000,
    confidence: 0.9,
    lane: "needs_review",
    ownerRole: "energy_manager",
    dueAt: "2026-08-01T10:00:00+05:30",
    decisionClass: "mgmt_tod",
    valueDomain: "energy_efficiency",
    wasteCategory: 1,
  },
  {
    id: "rx_maint",
    plantId: "plant_lnm_faridabad_1",
    title: "Replace belt",
    why: "Vibration",
    impactInrPerMonth: 40_000,
    confidence: 0.7,
    lane: "active",
    ownerRole: "operator",
    dueAt: "2026-08-02T10:00:00+05:30",
    decisionClass: "maint_mech",
  },
  {
    id: "rx_done",
    plantId: "plant_lnm_faridabad_1",
    title: "Closed item",
    why: "Done",
    impactInrPerMonth: 10_000,
    confidence: 0.5,
    lane: "closed",
    ownerRole: "supervisor",
    dueAt: "2026-07-01T10:00:00+05:30",
  },
];

describe("prescription triage", () => {
  it("offers Evidence deep-link from expand via rxId query", () => {
    assert.match(queueSrc, />\s*Evidence\s*</);
    assert.match(queueSrc, /\/evidence\?rxId=\$\{rx\.id\}/);
    assert.doesNotMatch(queueSrc, /PrescriptionFlipCard|Flip for evidence/);
  });

  it("renders static decision cards with What/Why/Who/Effort/Impact/When", () => {
    assert.doesNotMatch(decisionSrc, /Flip for evidence|is-flipped|rotateY/);
    assert.match(decisionSrc, /<dt>Why</);
    assert.match(decisionSrc, /<dt>Who</);
    assert.match(decisionSrc, /<dt>Effort</);
    assert.match(decisionSrc, /<dt>Impact</);
    assert.match(decisionSrc, /<dt>When</);
  });

  it("builds pillar badges from value domain and waste category", () => {
    const rich = sampleRx[0]!;
    const badges = pillarBadges({
      ...rich,
      valueDomain: "energy_efficiency",
      wasteCategory: 1,
    });
    assert.ok(badges.includes("Load & energy"));
    assert.ok(badges.includes("MD & power quality"));
    const rows = evidenceRowsFromRefs([
      "tag:incomer_1/apparent_power_kva?window=2026-06-15T06:00:00Z/2026-06-15T07:00:00Z",
    ]);
    assert.equal(rows[0]?.tag, "incomer_1/apparent_power_kva");
    assert.equal(rows[0]?.value, "tag");
  });

  it("uses Needs attention / Acknowledged inbox sections", () => {
    assert.match(queueSrc, /Needs attention/);
    assert.match(queueSrc, /Acknowledged/);
    assert.match(queueSrc, /Acknowledge/);
    assert.match(queueSrc, /Add feedback/);
  });

  it("classifies management vs maintenance without fixture catalog", () => {
    assert.equal(isManagementClass(sampleRx[0]!), true);
    assert.equal(classLabel(sampleRx[0]!), "Management");
    assert.equal(isManagementClass(sampleRx[1]!), false);
    assert.equal(classLabel(sampleRx[1]!), "Maintenance");
  });

  it("orders by impact×confidence then due date", () => {
    const sorted = sortPrescriptions(sampleRx);
    assert.ok(
      sorted[0]!.impactInrPerMonth * sorted[0]!.confidence >=
        sorted[1]!.impactInrPerMonth * sorted[1]!.confidence,
    );
  });

  it("filters inbox sections and class facet", () => {
    const needs = filterInbox(sampleRx, "needs_attention", "all");
    assert.ok(needs.every((r) => r.lane === "needs_review"));
    const mgmtNeeds = filterInbox(sampleRx, "needs_attention", "management");
    assert.ok(mgmtNeeds.every((r) => isManagementClass(r)));
    const ack = filterInbox(sampleRx, "acknowledged", "all");
    assert.ok(ack.every((r) => r.lane === "active" || r.lane === "verifying"));
    const withDone = filterInbox(sampleRx, "acknowledged", "all", {
      includeDone: true,
    });
    assert.ok(withDone.some((r) => r.lane === "closed"));
  });

  it("requires reasons for defer/reject and supports optimistic rollback", () => {
    assert.equal(requiresReason("defer"), true);
    assert.equal(requiresReason("reject"), true);
    assert.equal(requiresReason("done"), false);
    const target = sampleRx.find((r) => r.lane === "needs_review")!;
    const { next, rollback } = optimisticRxUpdate(sampleRx, target.id, "done");
    assert.equal(next.find((r) => r.id === target.id)?.lane, "verifying");
    assert.equal(rollback.find((r) => r.id === target.id)?.lane, target.lane);
    assert.equal(applyRxAction(target, "reject").lane, "closed");
    assert.equal(applyRxAction(target, "ack").lane, "active");
    assert.ok(filterLane(sampleRx, "needs_review").length >= 1);
  });

  it("stores feedback on a prescription optimistically", () => {
    const target = sampleRx.find((r) => r.lane === "active")!;
    const { next } = optimisticRxFeedback(sampleRx, target.id, {
      note: "Stage swap completed",
      outcome: "helped",
      at: "2026-07-31T10:00:00+05:30",
    });
    assert.equal(next.find((r) => r.id === target.id)?.feedback?.note, "Stage swap completed");
  });

  it("assigns via BFF notify and toasts real WhatsApp status (not fake queued)", () => {
    assert.match(queueSrc, /notifyAssignee/);
    assert.match(queueSrc, /WhatsApp dry-run logged|whatsappOutcomeToast/);
    assert.doesNotMatch(queueSrc, /WhatsApp notification queued/);
    assert.doesNotMatch(queueSrc, /@\/fixtures\/assignments/);
    assert.doesNotMatch(queueSrc, /assetsFixture/);
  });
});
