import { test } from "node:test";
import assert from "node:assert/strict";
import { MASCOT_STATES, logoPath, render, sample, statePose } from "../src/lib/mascot/engine";

test("mascot engine is a pure function of time", () => {
  for (const s of MASCOT_STATES) {
    const a = JSON.stringify(render(sample(s, 0.7, 3.2)));
    const b = JSON.stringify(render(sample(s, 0.7, 3.2)));
    assert.equal(a, b, s);
  }
});

test("every state renders a body, eight spokes and two eyes", () => {
  for (const s of MASCOT_STATES) {
    const f = render(statePose(s, 0.4, 1));
    assert.ok(f.body.startsWith("M") && f.body.endsWith("Z"), s);
    assert.equal(f.spokes.length, 8, s);
    assert.equal(f.eyes.length, 2, s);
  }
});

test("success sends eight particles out, then clears them", () => {
  assert.equal(render(statePose("success", 0.3, 0)).particles.length, 8);
  assert.equal(render(statePose("success", 2, 0)).particles.length, 0);
});

test("reduced motion renders a settled pose with no transition", () => {
  const p = sample("thinking", 0, 0, statePose("idle", 1, 1), true);
  assert.deepEqual(p.lids, [0.62, 0.62]);
});

test("logo path has eight wedges", () => {
  assert.equal(logoPath().match(/M/g)?.length, 8);
});
