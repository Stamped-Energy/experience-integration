import { test } from "node:test";
import assert from "node:assert/strict";
import * as D from "../src/lib/demo/data";
import { SUGGESTED, convsFor, suggestedAnswer, type RichTurn } from "../src/lib/demo/askRich";
import { getAction } from "../src/lib/demo/actions";
import { agentShowcase, AGENT_SHOWCASE_CAPS } from "../src/lib/demo/agentShowcase";
import { deskToday } from "../src/lib/demo/desk";
import { DEMO_LOOP_HEALTH, DEMO_PV_TRENDS } from "../src/lib/demo/dashboards";
import * as A from "../src/lib/demo/agent";
import type { RoleId } from "../src/lib/demo/types";

const ROLES: RoleId[] = ["operator", "shift-lead", "process-engineer", "quality-head", "plant-head", "owner"];
const LEGACY = /mixer|viscos|agitator|jacket|grade a-1|mpa·s|hold temperature trial|batch 24/i;

function turnsFor(role: RoleId): RichTurn[] {
  const suggested = SUGGESTED.map((q) => suggestedAnswer(q, role)!);
  return [...suggested, ...convsFor(role).flatMap((c) => c.turns)];
}

function hrefsOf(t: RichTurn): string[] {
  const out: string[] = t.ev.map((e) => e.href);
  if (t.next) out.push(t.next.href);
  for (const b of [...t.visual, ...t.cause]) {
    if (b.k === "flow") for (const n of b.nodes) if (n.href) out.push(n.href);
    if (b.k === "table") for (const row of b.rows) for (const c of row) if (typeof c !== "string") out.push(c.href);
  }
  return out;
}

function resolves(href: string): boolean {
  const path = href.split("?")[0];
  let m: RegExpMatchArray | null;
  if ((m = path.match(/^\/inbox\/(in-\d+)$/))) return !!D.byId.inbox(m[1]);
  if ((m = path.match(/^\/quality\/lots\/(.+)$/))) return !!D.byId.lot(m[1]);
  if ((m = path.match(/^\/process\/runs\/(.+)$/))) return D.runs.some((r) => r.id === m![1]);
  if ((m = path.match(/^\/(?:process|quality)\/actions\/(ex-[pq]\d)$/))) return !!getAction(m[1]);
  if ((m = path.match(/^\/process\/trials\/(.+)$/))) return !!D.byId.trial(m[1]);
  if ((m = path.match(/^\/process\/proposals\/(.+)$/))) return !!D.byId.proposal(m[1]);
  if ((m = path.match(/^\/process\/lines\/(.+)$/))) return !!D.byId.line(m[1]);
  return path.startsWith("/");
}

test("Ask chips are forge, heat treatment and foundry stories, and each has an answer", () => {
  assert.equal(SUGGESTED[0], "Why are cold billets rising after stops?");
  assert.ok(/billet/i.test(SUGGESTED[0]) && /quench|hardness/i.test(SUGGESTED[1]) && /heat 8836|mould/i.test(SUGGESTED[2]));
  for (const q of D.suggestedQuestions) assert.ok(SUGGESTED.includes(q as (typeof SUGGESTED)[number]), `data.ts chip not in SUGGESTED: ${q}`);
  for (const q of SUGGESTED) assert.ok(suggestedAnswer(q, "operator"), q);
});

test("Ask answers carry no mixing wording and every follow-up resolves to an answer", () => {
  for (const role of ROLES) {
    const convTitles = convsFor(role).map((c) => c.title.toLowerCase());
    const known = new Set<string>([...SUGGESTED.map((q) => q.toLowerCase()), ...convTitles, ...convsFor(role).flatMap((c) => c.turns.map((t) => t.q.toLowerCase()))]);
    for (const t of turnsFor(role)) {
      assert.doesNotMatch(JSON.stringify(t), LEGACY, `${role}: ${t.q}`);
      for (const f of t.follow) assert.ok(known.has(f.toLowerCase()), `${role}: dead follow-up "${f}" on "${t.q}"`);
    }
  }
});

test("Ask cross-links resolve to real actions, inbox cards, lots, runs and trials", () => {
  for (const role of ROLES) for (const t of turnsFor(role)) for (const h of hrefsOf(t)) assert.ok(resolves(h), `${role}: ${t.q} -> ${h}`);
});

test("agent, desk and dashboard copy has no mixing wording and links resolve", () => {
  const copy = JSON.stringify([A.questions, A.workingOn, A.controlStacks, A.learned, A.qualityLearned, A.qualityWork, A.idleProposals, A.summaries, deskToday, DEMO_LOOP_HEALTH, DEMO_PV_TRENDS.map((x) => [x.title, x.caption])]);
  assert.doesNotMatch(copy, LEGACY);
  for (const line of D.lines) assert.ok((A.controlStacks[line.id] ?? []).length > 0, `control stack for ${line.id}`);
  for (const d of deskToday) assert.ok(resolves(d.href), d.href);
  for (const w of [...A.workingOn, ...A.qualityWork]) assert.ok(resolves(w.href), w.href);
  for (const k of Object.keys(A.assigned)) {
    if (k.startsWith("ex-")) assert.ok(getAction(k), k);
    if (k.startsWith("in-")) assert.ok(D.byId.inbox(k), k);
  }
});

test("agent showcase respects its caps and its links resolve", () => {
  for (const area of ["process", "quality"] as const) {
    const s = agentShowcase(area);
    assert.ok(s.now.length <= AGENT_SHOWCASE_CAPS.now && s.waiting.length <= AGENT_SHOWCASE_CAPS.waiting && s.tried.length <= AGENT_SHOWCASE_CAPS.tried && s.learned.length <= AGENT_SHOWCASE_CAPS.learned, area);
    assert.ok(s.now.length > 0 && s.waiting.length > 0 && s.tried.length > 0 && s.learned.length > 0, `${area} has an empty section`);
    const links = [...s.now.map((x) => x.href), ...s.waiting.map((x) => x.href), ...s.tried.flatMap((x) => [x.openHref, x.engineeringHref ?? "/"]), s.seeAllActionsHref, s.seeAllProposalsHref];
    for (const h of links) assert.ok(resolves(h), `${area}: ${h}`);
    assert.doesNotMatch(JSON.stringify(s), /camp-|loop-|prop-|\bD\d{2,3}\b|mixer|viscos|jacket/i, area);
    for (const w of s.waiting) assert.match(w.ageLabel, /^(Earlier today|Open now|\d+ (min|h|d) ago)$/, w.ageLabel);
  }
});
