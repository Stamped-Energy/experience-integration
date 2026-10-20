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

test("every state renders a body, eight spokes (unless it hides them) and two eyes", () => {
  for (const s of MASCOT_STATES) {
    const f = render(statePose(s, 0.4, 1));
    assert.ok(f.body.startsWith("M") && f.body.endsWith("Z"), s);
    assert.ok(f.spokes.length === 8 || ["alert", "exclaim"].includes(s), s);
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

import { MASCOT_EXPRESSIONS, faceOf } from "../src/lib/mascot/engine";
import { MascotBehaviour, seeded, type MascotMode } from "../src/lib/mascot/behaviour";

test("every state and expression renders finite geometry over its whole run", () => {
  for (const s of MASCOT_STATES) for (let lt = 0; lt < 4; lt += 0.1) {
    const f = JSON.stringify(render(sample(s, lt, lt + 5, statePose("idle", 1, 1))));
    assert.ok(!/NaN|Infinity/.test(f), `${s} at ${lt.toFixed(1)}`);
  }
  for (const e of MASCOT_EXPRESSIONS) assert.ok(!/NaN/.test(JSON.stringify(render(statePose("idle", 1, 1, false, undefined, faceOf(e))))), e);
  assert.equal(MASCOT_EXPRESSIONS.length, 16);
});

function run(mode: MascotMode, seconds: number, seed = 7, opts = {}) {
  const b = new MascotBehaviour({ rng: seeded(seed), ...opts });
  const t0 = 100;
  b.setMode(mode, t0);
  const frames = [];
  let blinks = 0, shut = false;
  for (let t = t0; t < t0 + seconds; t += 1 / 60) {
    const f = b.update(t);
    frames.push({ t, ...f });
    if (f.lid < 0.2 && !shut) blinks++;
    shut = f.lid < 0.2;
  }
  return { b, frames, blinks };
}

test("blinks at a natural rate with irregular gaps", () => {
  const { blinks, b } = run("ambient", 600, 3, { boredAfter: 1e6, sleepyAfter: 1e6, dozeAfter: 1e6 });
  const perMin = blinks / 10;
  assert.ok(perMin > 10 && perMin < 20, `blinks per minute ${perMin}`);
  assert.ok(b.log.some((l) => l.what === "double blink"), "some double blinks");
});

test("ambient fidgets vary, never repeat back to back, and always return to rest", () => {
  const { b, frames } = run("ambient", 600, 11, { boredAfter: 1e6, sleepyAfter: 1e6, dozeAfter: 1e6 });
  const acts = b.log.filter((l) => /^(state|face) /.test(l.what) && !/idle|neutral/.test(l.what)).map((l) => l.what);
  assert.ok(new Set(acts).size >= 10, `variety ${new Set(acts).size}`);
  for (let i = 1; i < acts.length; i++) assert.notEqual(acts[i], acts[i - 1]);
  let run0 = 0;
  for (let i = 1; i < frames.length; i++) {
    run0 = frames[i].state === "idle" ? 0 : run0 + 1 / 60;
    assert.ok(run0 < 6, `stuck in ${frames[i].state}`);
  }
});

test("quiet time goes bored, sleepy, then dozing, and a poke wakes it", () => {
  const { b, frames } = run("ambient", 200, 5, { boredAfter: 30, sleepyAfter: 60, dozeAfter: 100 });
  assert.ok(frames.some((f) => f.expression === "bored"));
  assert.ok(frames.some((f) => f.expression === "sleepy"));
  assert.equal(frames.at(-1)!.state === "doze" || frames.at(-1)!.state === "sleep", true);
  const t = frames.at(-1)!.t + 0.1;
  b.poke(t);
  assert.equal(b.update(t + 0.02).state, "wide");
});

test("work modes move through fitting states", () => {
  const think = new Set(run("thinking", 60).frames.map((f) => f.state));
  assert.ok(think.has("thinking") && think.has("dots") && think.size >= 3, [...think].join());
  const ans = new Set(run("answering", 60).frames.map((f) => f.state));
  assert.ok(ans.has("answering") && ans.size >= 3, [...ans].join());
  const ok = run("success", 12);
  assert.equal(ok.frames[2].state, "success");
  assert.equal(ok.b.mode, "ambient");
  assert.ok(ok.frames.some((f) => f.expression === "happy"));
  const err = run("error", 60).frames;
  assert.equal(err[2].state, "exclaim");
  assert.ok(err.filter((f) => f.state === "error").length > err.length * 0.7);
});

test("seeded behaviour is repeatable", () => {
  const a = run("ambient", 60, 9).frames.map((f) => f.state + f.expression).join();
  const b = run("ambient", 60, 9).frames.map((f) => f.state + f.expression).join();
  assert.equal(a, b);
});
