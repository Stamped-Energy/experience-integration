import { test } from "node:test";
import assert from "node:assert/strict";
import * as D from "../src/lib/demo/data";
import { exampleActions } from "../src/lib/demo/actions";
import { actionIsApplied, detailFor } from "../src/lib/demo/actionDetail";
import { actionOutcomesForDisplay } from "../src/lib/demo/actionOutcomes";
import type { ExampleAction } from "../src/lib/demo/types";

function groupOf(a: ExampleAction) {
  if (a.closed || a.who.how === "Record only") return "closed";
  if (a.steps.includes("Trial")) return "trial";
  if (a.who.how === "On its own, inside the signed band") return "running";
  return "decision";
}

test("every action names an outcome with before, after and MODELLED label", () => {
  for (const a of exampleActions) {
    assert.ok(a.outcome.metric && a.outcome.before && a.outcome.after, a.id);
    assert.equal(a.outcome.label, "Modelled", a.id);
  }
});

test("example actions are illustrative, on real lines, with valid roles", () => {
  for (const a of exampleActions) {
    assert.equal(a.illustrative, true, a.id);
    assert.ok(D.byId.line(a.lineId), a.id);
    for (const r of a.who.roles) assert.ok(D.roles.some((x) => x.id === r), `${a.id} ${r}`);
    if (!a.closed && (a.who.how === "A person decides" || a.who.how === "Recommend only")) assert.ok(a.options?.length || a.href, `${a.id} needs options or a link`);
  }
});

test("Process and Quality cover the approved demo set with unique mechanisms", () => {
  const process = exampleActions.filter((a) => a.area === "Process");
  const quality = exampleActions.filter((a) => a.area === "Quality");
  assert.equal(process.length, 6, "Process");
  assert.equal(quality.length, 4, "Quality");
  assert.equal(new Set(process.map((a) => a.mechanism)).size, process.length);
  assert.equal(new Set(quality.map((a) => a.mechanism)).size, quality.length);
  assert.ok(process.some((a) => a.steps.includes("Detect")));
  assert.ok(process.some((a) => a.steps.includes("Propose")));
  assert.ok(process.some((a) => a.steps.includes("Trial")));
  assert.ok(quality.some((a) => a.steps.includes("Detect")));
  assert.ok(quality.some((a) => a.steps.includes("Decide")));
  assert.ok(quality.some((a) => a.steps.includes("Verify")));
  const floor = quality.find((a) => a.steps.includes("Decide") && a.who.roles.includes("operator"));
  assert.ok(floor && floor.options!.length >= 2, "Quality floor decision with options");
});

test("groups spread across decision, trial, running and closed", () => {
  const groups = new Set(exampleActions.map((a) => groupOf(a)));
  assert.ok(groups.has("decision"));
  assert.ok(groups.has("trial"));
  assert.ok(groups.has("running"));
  assert.ok(groups.has("closed"));
  assert.equal(groupOf(exampleActions.find((a) => a.id === "ex-p2")!), "running");
  assert.equal(groupOf(exampleActions.find((a) => a.id === "ex-p1")!), "trial");
  assert.equal(groupOf(exampleActions.find((a) => a.id === "ex-q4")!), "closed");
});

test("cards show two or three outcome chips", () => {
  for (const a of exampleActions) {
    const chips = actionOutcomesForDisplay(a);
    assert.ok(chips.length >= 1 && chips.length <= 3, `${a.id} chips ${chips.length}`);
    for (const c of chips) assert.equal(c.label, "Modelled", `${a.id} ${c.metric}`);
  }
});

test("applied cards carry closed-loop status and measured-after on chips", () => {
  for (const a of exampleActions.filter(actionIsApplied)) {
    const detail = detailFor(a);
    assert.ok(detail.loop?.statusLine, a.id);
    assert.ok(/^Measured on the line:/.test(detail.loop!.statusLine), a.id);
    const chips = actionOutcomesForDisplay(a);
    assert.ok(chips.some((c) => c.measuredAfter), `${a.id} needs measuredAfter on a chip`);
  }
});

test("no rupees, no confidence percentages, no WhatsApp, no bare ML, no em dashes", () => {
  for (const a of exampleActions) {
    const all = JSON.stringify(a);
    assert.ok(!/₹|INR|lakh|rupee/i.test(all), a.id);
    if (a.expected) assert.ok(!/confiden/i.test(a.expected.band), a.id);
    assert.ok(!/whatsapp/i.test(all), a.id);
    assert.ok(!/\bML\b/.test(all), a.id);
    assert.ok(!/\u2014/.test(all), a.id);
  }
  for (const a of exampleActions) {
    const detail = JSON.stringify(detailFor(a));
    assert.ok(!/\bML\b/.test(detail), a.id);
    assert.ok(!/\u2014/.test(detail), a.id);
    assert.ok(!/Closed loop that saves/i.test(detail), a.id);
  }
});

test("closed Quality card has who, when and a Verified band; Process has running applied loop", () => {
  const closedQ = exampleActions.filter((a) => a.area === "Quality" && a.closed);
  assert.equal(closedQ.length, 1);
  for (const a of closedQ) {
    assert.ok(a.closed!.by && Date.parse(a.closed!.at) <= Date.parse(D.DEMO_NOW), a.id);
    assert.ok(["Verified", "Indicative"].includes(a.closed!.result.status) && a.closed!.result.band, a.id);
    assert.ok(!a.options, `${a.id} is closed and offers no actions`);
  }
  const running = exampleActions.filter((a) => a.area === "Process" && groupOf(a) === "running");
  assert.equal(running.length, 1);
  assert.ok(detailFor(running[0]).loop);
});

test("open examples stay apart from accepted ones, and a live trial is labelled", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("../src/components/cards/ExampleActions.tsx", import.meta.url), "utf8");
  assert.ok(src.includes("Needs a decision") && src.includes("Accepted and closed"));
  assert.ok(src.includes("ActionOutcomeStrip") && src.includes("Open action"));
  assert.ok(src.includes("Trial running"));
  assert.ok(!exampleActions.some((a) => a.id === "ex-p7" || a.id === "ex-q5" || a.id === "ex-q6" || a.id === "ex-q7"));
  const accepted = exampleActions.filter((a) => a.closed || a.who.how === "Record only");
  assert.ok(accepted.length >= 1);
  assert.ok(accepted.every((a) => !a.options), "accepted card still offers a decision");
  const batch = exampleActions.find((a) => a.id === "ex-q1")!; // quench basket card
  assert.equal(batch.expected!.label, "Modelled");
  assert.equal(batch.href, "/process/runs/run-c-5119");
});

test("detail view shows closed loop and never the recommend footer", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("../src/components/cards/ActionDetailView.tsx", import.meta.url), "utf8");
  assert.ok(src.includes("Every action is tried on the model first"));
  assert.ok(src.includes("Recommend") && src.includes("Apply") && src.includes("Measure") && src.includes("Learn"));
  assert.ok(src.includes("RunChart"));
  assert.ok(!/Stamped recommends and your team decides/.test(src));
  assert.ok(!/Closed loop that saves and improves plants/.test(src));
  assert.ok(!/Making industrial plants smarter/.test(src), "one-liner stays off the detail page");
});

test("the six-step strip is gone", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("../src/components/cards/ExampleActions.tsx", import.meta.url), "utf8");
  assert.ok(!/ex-chain|How Stamped gets the result/.test(src));
});

test("cards fold as an accessible disclosure", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("../src/components/cards/FoldCard.tsx", import.meta.url), "utf8");
  assert.ok(/aria-expanded=\{open\}/.test(src) && /aria-controls/.test(src));
});

test("the ten cards are the metal-works set, on the right lines, with the right who", () => {
  const byId = Object.fromEntries(exampleActions.map((a) => [a.id, a]));
  assert.deepEqual(exampleActions.map((a) => a.id), ["ex-p1", "ex-p2", "ex-p3", "ex-p4", "ex-p5", "ex-p6", "ex-q1", "ex-q2", "ex-q3", "ex-q4"]);
  assert.deepEqual(["ex-p1", "ex-p2", "ex-p3", "ex-p4", "ex-p5", "ex-p6", "ex-q1", "ex-q2", "ex-q3", "ex-q4"].map((id) => byId[id].lineId), ["line-a", "line-a", "line-a", "line-d", "line-e", "line-b", "line-c", "line-a", "line-d", "line-d"]);
  assert.equal(byId["ex-p2"].who.how, "On its own, inside the signed band");
  assert.equal(byId["ex-p3"].who.how, "A person decides");
  assert.equal(byId["ex-p4"].who.how, "A person decides");
  assert.equal(byId["ex-p5"].who.how, "Recommend only");
  assert.equal(byId["ex-q4"].who.how, "Record only");
  for (const id of ["ex-q1", "ex-q3"]) assert.ok(byId[id].options!.some((o) => o.id === "hold"), id + " offers a hold");
  assert.ok(byId["ex-q3"].who.roles.includes("quality-head"), "quality releases the hold");
  assert.ok(!byId["ex-q4"].options && byId["ex-q4"].closed, "bore scrap card is closed and checked");
  const text = JSON.stringify([exampleActions, exampleActions.map(detailFor), exampleActions.map(actionOutcomesForDisplay)]);
  assert.ok(!/viscosity|mixer|agitator|jacket|nylon|Press 7|Press 4|Tool 12/i.test(text), "mixing or old moulding wording on a card");
});

test("src has no deck figures and no incumbent product names", async () => {
  const { readFileSync, readdirSync, statSync } = await import("node:fs");
  const { join } = await import("node:path");
  const root = new URL("../src", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
  const files: string[] = [];
  const walk = (d: string) => { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : /\.(tsx?|css|json|mjs)$/.test(f) && files.push(p); } };
  walk(root);
  assert.ok(files.length > 100, `scanned ${files.length} files`);
  const arrow = "\\s*(?:to|→|->|vs\\.?|against)\\s*";
  const banned: [string, RegExp][] = [
    ["₹340", /₹\s?340\b/], ["₹440", /₹\s?440\b/],
    ["2.8 to 1.3%", new RegExp("2\\.8%?" + arrow + "1\\.3%")],
    ["2.9% and 436 kg", /2\.9%\s*(?:and|\/)\s*436\s*kg/],
    ["142 against 120 heats", new RegExp("142" + arrow + "120\\s*heats")],
    ["11 to 2 billets", new RegExp("\\b11" + arrow + "2\\s*billets")],
    ["30 to 10–23 billets an hour", new RegExp("\\b30" + arrow + "10\\s*[–-]\\s*23\\s*billets")],
    ["840 parts and 14.2%", /840\s*parts\s*(?:and|\/)\s*14\.2%/],
    ["+8 to 20 °C", /\+\s?8\s*(?:to|–|-)\s*20\s*°C/],
    ["10 to 12% energy", /10\s*(?:to|–|-)\s*12%\s*energy/],
    ["Melt Manager", /Melt Manager/i], ["Foundry AI", /Foundry AI/i], ["MPAS", /\bMPAS\b/],
    ["Stamped recommends, the plant decides", /Stamped recommends,? the plant decides/i],
  ];
  for (const f of files) {
    const s = readFileSync(f, "utf8");
    for (const [name, re] of banned) assert.ok(!re.test(s), `${name} in ${f}`);
  }
});
