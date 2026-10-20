import { test } from "node:test";
import assert from "node:assert/strict";
import * as D from "../src/lib/demo/data";
import { can, permissions } from "../src/lib/rbac";

test("cross-links resolve", () => {
  for (const p of D.proposals) assert.ok(D.byId.line(p.lineId) && D.byId.asset(p.assetId), p.id);
  for (const t of D.trials) assert.ok(D.measurementPlans.some((m) => m.id === t.measurementPlanId), t.id);
  for (const c of D.corrections) { assert.ok(D.byId.lot(c.lotId), c.id); if (c.proposalId) assert.ok(D.byId.proposal(c.proposalId), c.id); }
  for (const v of D.valueItems) assert.ok(D.byId.proof(v.proofRecordId), v.id);
  for (const l of D.lotLinks) assert.ok(D.byId.lot(l.lotId) && D.runs.some((r) => r.id === l.runId), l.id);
  for (const i of D.investigations) for (const id of i.lotIds) assert.ok(D.byId.lot(id), `${i.id} ${id}`);
  for (const a of D.auditEvents) assert.ok(D.byId.person(a.personId), a.id);
  for (const i of D.inboxItems) {
    const ok = { proposal: D.byId.proposal, "trial-signature": D.byId.trial, "lot-link": D.byId.link, "data-gap": D.byId.gap, correction: D.byId.correction, "lot-risk": D.byId.lot }[i.kind](i.ref);
    assert.ok(ok, `${i.id} -> ${i.ref}`);
  }
});

test("volumes and rules from data-needs.md", () => {
  assert.equal(D.lines.length, 2);
  assert.deepEqual(D.lines.map((l) => l.type).sort(), ["batch", "discrete"]);
  assert.ok(D.runs.filter((r) => r.lineId === "line-a").length >= 40);
  assert.equal(D.lots.length, 30);
  assert.equal(D.lots.filter((l) => l.riskWord === "At risk").length, 4);
  assert.ok(D.lotLinks.filter((l) => l.link_confidence < 0.8).length >= 3);
  assert.ok(D.auditEvents.length >= 60);
  assert.ok(D.proofRecords.some((p) => p.verdict === "No change") && D.proofRecords.some((p) => p.verdict === "Inconclusive"));
  for (const v of D.valueItems) assert.equal(v.status === "Verified", v.rung === "R3" || v.rung === "R4", v.id);
  assert.ok(!("total" in D), "no total value field");
});

test("RBAC: operators accept, nobody releases holds, Stamped cannot sign", () => {
  assert.ok(can("operator", "decide-proposal", "line-a"));
  assert.ok(!can("owner", "decide-proposal"));
  assert.ok(!can("stamped-engineer", "sign-limits"));
  assert.ok(!permissions.some((p) => (p.action as string).includes("release")));
});

test("copy: no em dashes, no client names", () => {
  const s = JSON.stringify(D);
  assert.ok(!s.includes("\u2014"), "em dash");
  for (const bad of ["Jaipur", "unlock", "superpower", "WhatsApp", "digital twin"]) assert.ok(!s.toLowerCase().includes(bad.toLowerCase()), bad);
});

test("every run has setpoint writes", () => {
  for (const r of D.runs) assert.ok(D.setpointWrites.some((w) => w.runId === r.id), r.id);
});

test("every tag has readings, 12 per run, same shape", () => {
  for (const t of D.tags) {
    const rs = D.tagReadings.filter((r) => r.tagId === t.id);
    assert.ok(rs.length >= 72, `${t.id} has ${rs.length}`);
    for (const r of rs) assert.ok(Number.isFinite(r.value) && D.runs.find((x) => x.id === r.runId)?.lineId === t.lineId, t.id);
  }
});

test("saved answers: refs resolve, label and band confidence, at least one stale", () => {
  const ids = new Set<string>([
    ...D.proposals, ...D.proofRecords, ...D.lots, ...D.runs, ...D.trials, ...D.valueItems, ...D.corrections, ...D.investigations, ...D.driftSignals,
  ].map((x) => x.id).concat(D.modelFits.map((m) => m.modelId)));
  for (const a of D.savedAnswers) {
    assert.ok(D.askThreads.some((t) => t.id === a.threadId), a.id);
    assert.ok(a.confidence && !/%\s*confiden/i.test(JSON.stringify(a)), a.id);
    for (const r of a.refs ?? []) assert.ok(ids.has(r), `${a.id} -> ${r}`);
  }
  assert.ok(D.savedAnswers.length >= 6 && D.notes.length >= 6);
  assert.ok(D.savedAnswers.some((a) => a.stale), "no stale saved answer");
});

test("no rupee amounts outside the owner's Home data", () => {
  assert.ok(!JSON.stringify(D.savedAnswers).includes("₹"), "saved answers");
  assert.ok(!JSON.stringify(D.notes).includes("₹"), "notes");
});

test("settings data varied", () => {
  const now = Date.parse(D.DEMO_NOW);
  const sa = D.standingApprovals;
  assert.ok(sa.some((a) => a.revokedAt) && sa.some((a) => !a.revokedAt && Date.parse(a.until) - now < 3 * 864e5) && sa.some((a) => !a.revokedAt && Date.parse(a.until) - now > 7 * 864e5));
  for (const a of sa) assert.ok(D.byId.line(a.lineId) && a.params.every((p) => D.signedWindows.some((w) => w.lineId === a.lineId && w.param === p)), a.id);
  assert.deepEqual([...new Set(D.webhooks.map((w) => w.status))].sort(), ["failing", "healthy", "paused"]);
});
