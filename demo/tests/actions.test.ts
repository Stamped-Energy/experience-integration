import { test } from "node:test";
import assert from "node:assert/strict";
import * as D from "../src/lib/demo/data";
import { exampleActions } from "../src/lib/demo/actions";

test("example actions are illustrative, on real lines, with valid roles", () => {
  for (const a of exampleActions) {
    assert.equal(a.illustrative, true, a.id);
    assert.ok(D.byId.line(a.lineId), a.id);
    for (const r of a.who.roles) assert.ok(D.roles.some((x) => x.id === r), `${a.id} ${r}`);
    if (a.who.how === "A person decides" || a.who.how === "Recommend only") assert.ok(a.options?.length || a.href, `${a.id} needs options or a link`);
  }
});

test("each area covers the chain and Quality has a floor decision", () => {
  for (const area of ["Process", "Quality"] as const) {
    const xs = exampleActions.filter((a) => a.area === area);
    assert.ok(xs.length >= 4, area);
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
