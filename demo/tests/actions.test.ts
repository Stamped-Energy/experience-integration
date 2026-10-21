import { test } from "node:test";
import assert from "node:assert/strict";
import * as D from "../src/lib/demo/data";
import { exampleActions } from "../src/lib/demo/actions";

test("example actions are illustrative, on real lines, with valid roles", () => {
  for (const a of exampleActions) {
    assert.equal(a.illustrative, true, a.id);
    assert.ok(D.byId.line(a.lineId), a.id);
    for (const r of a.who.roles) assert.ok(D.roles.some((x) => x.id === r), `${a.id} ${r}`);
    if (!a.closed && (a.who.how === "A person decides" || a.who.how === "Recommend only")) assert.ok(a.options?.length || a.href, `${a.id} needs options or a link`);
  }
});

test("each area covers the chain and Quality has a floor decision", () => {
  for (const area of ["Process", "Quality"] as const) {
    const xs = exampleActions.filter((a) => a.area === area);
    assert.equal(xs.length, 6, area);
    assert.equal(new Set(xs.map((a) => a.mechanism)).size, xs.length, `${area} mechanisms repeat`);
    for (const s of ["Detect", "Propose", "Verify"] as const) assert.ok(xs.some((a) => a.steps.includes(s)), `${area} lacks ${s}`);
  }
  const floor = exampleActions.find((a) => a.area === "Quality" && a.steps.includes("Decide") && a.who.roles.includes("operator"));
  assert.ok(floor && floor.options!.length >= 2, "Quality floor decision with options");
});

test("no rupees, no confidence percentages, no WhatsApp", () => {
  for (const a of exampleActions) {
    const all = JSON.stringify(a);
    assert.ok(!/₹|INR|lakh|rupee/i.test(all), a.id);
    if (a.expected) assert.ok(!/confiden/i.test(a.expected.band), a.id);
    assert.ok(!/whatsapp/i.test(all), a.id);
  }
});

test("each area has closed cards with who, when and a Verified or Indicative band", () => {
  for (const area of ["Process", "Quality"] as const) {
    const closed = exampleActions.filter((a) => a.area === area && a.closed);
    assert.ok(closed.length >= 1 && closed.length <= 2, area);
    for (const a of closed) {
      assert.ok(a.closed!.by && Date.parse(a.closed!.at) <= Date.parse(D.DEMO_NOW), a.id);
      assert.ok(["Verified", "Indicative"].includes(a.closed!.result.status) && a.closed!.result.band, a.id);
      assert.ok(!a.options, `${a.id} is closed and offers no actions`);
    }
    const open = exampleActions.filter((a) => a.area === area && !a.closed).map((a) => a.mechanism);
    for (const a of closed) assert.ok(!open.includes(a.mechanism), `${a.id} repeats a mechanism`);
  }
});

test("open examples stay apart from accepted ones, and a live trial is labelled", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("../src/components/cards/ExampleActions.tsx", import.meta.url), "utf8");
  assert.ok(src.includes("Open now") && src.includes("Already accepted"));
  assert.ok(src.includes("Trial running"));
  assert.ok(!exampleActions.some((a) => a.id === "ex-p7" || a.id === "ex-q7"));
  for (const area of ["Process", "Quality"] as const) {
    const xs = exampleActions.filter((a) => a.area === area);
    const accepted = xs.filter((a) => a.closed || a.who.how === "Record only");
    assert.ok(accepted.length >= 1, area);
    assert.ok(accepted.every((a) => !a.options), `${area} accepted card still offers a decision`);
  }
  const lot = exampleActions.find((a) => a.id === "ex-q2")!;
  assert.equal(lot.expected!.label, "Modelled");
  assert.equal(lot.href, "/quality/lots/lot-a-3307");
});

test("the six-step strip is gone", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("../src/components/cards/ExampleActions.tsx", import.meta.url), "utf8");
  assert.ok(!/ex-chain|How Stamped gets the result/.test(src));
});

test("cards fold as an accessible disclosure", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("../src/components/cards/FoldCard.tsx", import.meta.url), "utf8");
  assert.ok(/<button[^>]*aria-expanded=\{open\}[^>]*aria-controls/.test(src));
});
