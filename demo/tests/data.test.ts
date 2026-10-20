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
