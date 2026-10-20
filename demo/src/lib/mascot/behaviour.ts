/**
 * Behaviour layer for the Stamped mascot: decides, moment to moment, which state and expression to show,
 * where the eyes look and when they blink, so the character feels alive without ever repeating itself.
 *
 * Pure and clock free like the engine: every call takes `now` (seconds) and the random source is injected,
 * so a seeded run is exactly repeatable in tests. No timers: the component calls `update` from its frame loop.
 *
 * What it draws on (short version, more in the PR):
 * - Blinks: people blink about 13 to 14 times a minute with very irregular gaps (coefficient of variation near 80%),
 *   so gaps come from a skewed random distribution, not a fixed beat. Blinks cluster after gaze shifts and at
 *   task boundaries, close fast (about 70 ms) and reopen slower. Concentration lowers the rate; drowsiness lengthens it.
 * - Gaze: idle eyes hold a point for a second or two, then jump (a saccade) rather than drift; now and then
 *   they glance away and come back. Targets never repeat back to back.
 * - Action selection: a weighted random pick with per action cooldowns and a global gap, never the same action twice
 *   in a row, as in game idle-fidget systems. Activity modes swap in a different pool of fitting states.
 * - Timing: every hold gets jitter, transitions ease out (slow in, slow out), and nothing interrupts a state before
 *   its minimum readable duration, so it never jitters between states.
 */
import { STATE_INFO, type MascotExpression, type MascotState } from "./engine";

export type MascotMode = "ambient" | "listening" | "thinking" | "answering" | "success" | "warning" | "error" | "asleep";
export const MASCOT_MODES: MascotMode[] = ["ambient", "listening", "thinking", "answering", "success", "warning", "error", "asleep"];

export interface BehaviourFrame {
  state: MascotState;
  expression: MascotExpression;
  /** gaze offset in degrees, already smoothed */
  dYaw: number; dPitch: number; dRoll: number;
  /** 1 open, 0 shut */
  lid: number;
  /** -1..1 breathing phase, small */
  breath: number;
}

type Action = { kind: "state"; state: MascotState; hold?: [number, number] } | { kind: "face"; expression: MascotExpression; hold: [number, number] };
interface Option { id: string; w: number; cooldown: number; action: Action }

const face = (id: MascotExpression, w: number, cooldown = 14, hold: [number, number] = [1.3, 2.8]): Option => ({ id: `f:${id}`, w, cooldown, action: { kind: "face", expression: id, hold } });
const st = (id: MascotState, w: number, cooldown: number, hold?: [number, number]): Option => ({ id: `s:${id}`, w, cooldown, action: { kind: "state", state: id, hold } });

/** Idle fidgets. Faces are common, playful shape changes are rare and on long cooldowns. */
const AMBIENT: Option[] = [
  face("curious", 3), face("attentive", 2.2), face("happy", 2), face("surprised", 0.9, 25), face("shy", 0.9, 30),
  face("proud", 0.8, 30), face("suspicious", 0.6, 40), face("confused", 0.7, 35), face("excited", 0.6, 35), face("laughing", 0.4, 50),
  st("wink", 1.2, 25), st("wide", 0.7, 30), st("swirl", 0.6, 45), st("egg", 0.45, 60), st("hexagon", 0.45, 60),
  st("play", 0.3, 80), st("orbit", 0.25, 90), st("comet", 0.22, 100), st("burst", 0.18, 110), st("notify", 0.15, 120),
];
/** Small mascots (under 40 px) keep to the face: shape changes do not read at 22 px and add noise beside text. */
const AMBIENT_SMALL = AMBIENT.filter((o) => o.action.kind === "face" || o.id === "s:wink");

/** Work pools: the base state holds most of the time, with fitting variations in between. */
const WORK: Partial<Record<MascotMode, { base: MascotState; hold: [number, number]; pool: Option[] }>> = {
  listening: { base: "listening", hold: [3, 6], pool: [face("attentive", 3, 8), face("curious", 2, 10), st("wide", 0.5, 25)] },
  thinking: { base: "thinking", hold: [2.4, 4.2], pool: [st("dots", 3, 7, [2.4, 3.6]), st("orbit", 1.4, 14), st("swirl", 1, 10), st("hexagon", 0.6, 18, [1.6, 2.2])] },
  answering: { base: "answering", hold: [2.6, 4.8], pool: [st("swirl", 1.6, 9), st("play", 1, 14), st("dots", 0.8, 12, [1.8, 2.6]), st("wink", 0.5, 20)] },
  warning: { base: "warning", hold: [4, 7], pool: [st("exclaim", 1, 16, [1.6, 2]), st("alert", 1, 18)] },
  error: { base: "error", hold: [5, 9], pool: [st("exclaim", 0.6, 25, [1.4, 1.8])] },
  asleep: { base: "doze", hold: [8, 14], pool: [st("sleep", 1, 25, [3, 5])] },
};
/** One-shot openings when a mode starts: work begins with intent, and outcomes read before settling. */
const ENTRY: Partial<Record<MascotMode, [MascotState, number][]>> = {
  thinking: [["dots", 2.2]],
  success: [["success", 1.3], ["burst", 2.5]],
  warning: [["alert", 2.1]],
  error: [["exclaim", 1.6]],
};
const ENTRY_SMALL: Partial<Record<MascotMode, [MascotState, number][]>> = { success: [["success", 1.3]], warning: [["warning", 0.1]], error: [["error", 0.1]] };

export interface BehaviourOptions {
  rng?: () => number;
  /** small mascots keep to faces */
  small?: boolean;
  /** seconds of quiet before bored, sleepy and dozing */
  boredAfter?: number; sleepyAfter?: number; dozeAfter?: number;
  /** fix the state (behaviour still blinks, looks and breathes) */
  fixed?: MascotState;
}

export class MascotBehaviour {
  private rng: () => number;
  private o: Required<Omit<BehaviourOptions, "rng" | "fixed">> & { fixed?: MascotState };
  mode: MascotMode = "ambient";
  private modeAt = 0;
  private lastPoke = 0;
  private state: MascotState = "idle";
  private stateUntil = 0;
  private expr: MascotExpression = "neutral";
  private exprUntil = 0;
  private queue: [MascotState, number][] = [];
  private nextAction = 0;
  private lastAction = "";
  private used = new Map<string, number>();
  // gaze
  private gaze = { yaw: 0, pitch: 0 };
  private target = { yaw: 0, pitch: 0 };
  private fixUntil = 0;
  private glanceBack: { yaw: number; pitch: number } | null = null;
  private pointer: { yaw: number; pitch: number; at: number } | null = null;
  // blinks
  private blinkAt = -10;
  private blinkDur = 0.21;
  private nextBlink = 1;
  private pendingDouble = 0;
  private lastT = 0;
  private started = false;
  /** history for tests and the lab page */
  readonly log: { t: number; what: string }[] = [];

  constructor(opts: BehaviourOptions = {}) {
    this.rng = opts.rng ?? Math.random;
    this.o = { small: false, boredAfter: 45, sleepyAfter: 90, dozeAfter: 150, ...opts };
  }

  private r(a: number, b: number) { return a + (b - a) * this.rng(); }
  private note(t: number, what: string) { this.log.push({ t, what }); if (this.log.length > 400) this.log.shift(); }

  /** Skewed gap: never shorter than 1.4 s, mean near 4.4 s, long tail, capped at 10 s. Scaled by mode. */
  private blinkGap() {
    const rate = this.mode === "thinking" ? 1.35 : this.mode === "listening" ? 0.9 : this.isSleepy(this.lastT) ? 1.25 : 1;
    return Math.min(10, 1.4 + -Math.log(1 - this.rng() * 0.98) * 3) * rate;
  }

  blink(now: number, dur = 0.21) {
    if (now - this.blinkAt < 0.45) return; // refractory window
    this.blinkAt = now; this.blinkDur = dur;
    this.nextBlink = now + this.blinkGap();
    if (this.rng() < 0.13) this.pendingDouble = now + dur + this.r(0.06, 0.12); // occasional double blink
  }

  setMode(mode: MascotMode, now: number) {
    if (mode === this.mode && this.started) return;
    this.mode = mode; this.modeAt = now; this.poke(now, false);
    const entry = (this.o.small ? ENTRY_SMALL : ENTRY)[mode];
    this.queue = entry ? entry.map(([s, d]) => [s, d]) : [];
    this.stateUntil = now; // let the new mode take over on the next update
    this.expr = mode === "success" ? "happy" : "neutral"; this.exprUntil = now + (mode === "success" ? 4 : 0);
    this.nextAction = now + this.r(1.5, 3);
    this.blink(now, 0.2); // blinks cluster at task boundaries
    this.note(now, `mode ${mode}`);
  }

  /** Pin (or unpin) one state; blinking, gaze and breathing carry on. */
  setFixed(state: MascotState | undefined) { this.o.fixed = state; }

  /** The user did something (moved the pointer, typed, focused). Resets the quiet timer and wakes it gently. */
  poke(now: number, wake = true) {
    const wasAsleep = this.isDozing(now);
    this.lastPoke = now;
    if (wake && wasAsleep && this.mode === "ambient") {
      this.queue = [["wide", 1.2]]; this.stateUntil = now; this.expr = "surprised"; this.exprUntil = now + 2.2;
      this.blink(now, 0.16); this.nextAction = now + this.r(5, 9); this.note(now, "wake");
    }
  }

  /** Look towards the pointer for a while (degrees of yaw and pitch relative to the face). */
  lookAt(yaw: number, pitch: number, now: number) {
    if (!Number.isFinite(yaw + pitch)) return;
    this.pointer = { yaw: Math.max(-18, Math.min(18, yaw)), pitch: Math.max(-12, Math.min(12, pitch)), at: now };
  }

  private quiet(now: number) { return this.mode === "ambient" ? now - this.lastPoke : 0; }
  private isSleepy(now: number) { return this.quiet(now) > this.o.sleepyAfter; }
  private isDozing(now: number) { return this.mode === "asleep" || this.quiet(now) > this.o.dozeAfter; }

  /** Weighted pick honouring cooldowns, never the last action again. */
  private pick(pool: Option[], now: number): Option | null {
    const ok = pool.filter((o) => o.id !== this.lastAction && now - (this.used.get(o.id) ?? -1e9) > o.cooldown);
    const total = ok.reduce((s, o) => s + o.w, 0);
    if (!total) return null;
    let x = this.rng() * total;
    for (const o of ok) { x -= o.w; if (x <= 0) return o; }
    return ok[ok.length - 1];
  }

  private enter(state: MascotState, now: number, hold: number) {
    if (state !== this.state) {
      this.note(now, `state ${state}`);
      if (STATE_INFO[state].blinkIn) this.blink(now, 0.18); // bloub masks shape changes with a blink
    }
    this.state = state;
    this.stateUntil = now + Math.max(hold, STATE_INFO[state].min ?? 0);
  }

  private schedule(now: number) {
    if (this.o.fixed) { this.state = this.o.fixed; return; }
    if (now < this.stateUntil) return;
    const q = this.queue.shift();
    if (q) { this.enter(q[0], now, q[1]); return; }
    const mode = this.mode === "ambient" && this.isDozing(now) ? "asleep" : this.mode;
    if (mode === "success") { this.setMode("ambient", now); this.expr = "happy"; this.exprUntil = now + this.r(2, 3.5); return; }
    const work = WORK[mode];
    if (!work) {
      // ambient: rest, with fidgets on a jittered timer
      if (now >= this.nextAction && !this.isSleepy(now)) {
        const opt = this.pick(this.o.small ? AMBIENT_SMALL : AMBIENT, now);
        const bored = this.quiet(now) > this.o.boredAfter;
        this.nextAction = now + this.r(5, 11) * (bored ? 1.8 : 1);
        if (opt) {
          this.used.set(opt.id, now); this.lastAction = opt.id;
          if (opt.action.kind === "face") { this.expr = opt.action.expression; this.exprUntil = now + this.r(...opt.action.hold); this.note(now, `face ${this.expr}`); }
          else { this.enter(opt.action.state, now, opt.action.hold ? this.r(...opt.action.hold) : STATE_INFO[opt.action.state].duration); return; }
        }
      }
      this.enter("idle", now, this.r(0.8, 1.6));
      return;
    }
    // work: alternate between the base state and a variation, never two variations in a row
    if (this.state !== work.base) { this.enter(work.base, now, this.r(...work.hold)); return; }
    const opt = this.o.small ? null : this.pick(work.pool, now);
    if (opt && this.rng() < 0.75) {
      this.used.set(opt.id, now); this.lastAction = opt.id;
      if (opt.action.kind === "face") { this.expr = opt.action.expression; this.exprUntil = now + this.r(...opt.action.hold); this.enter(work.base, now, this.r(...work.hold)); this.note(now, `face ${this.expr}`); }
      else this.enter(opt.action.state, now, opt.action.hold ? this.r(...opt.action.hold) : STATE_INFO[opt.action.state].duration);
    } else this.enter(work.base, now, this.r(...work.hold));
  }

  private faceNow(now: number): MascotExpression {
    if (now < this.exprUntil) return this.expr;
    if (this.expr !== "neutral") { this.note(now, "face neutral"); this.expr = "neutral"; }
    const q = this.quiet(now);
    if (q > this.o.sleepyAfter) return "sleepy";
    if (q > this.o.boredAfter) return "bored";
    return "neutral";
  }

  private gazeStep(now: number, dt: number) {
    const ptr = this.pointer && now - this.pointer.at < 1.8 ? this.pointer : null;
    if (ptr) { this.target = { yaw: ptr.yaw, pitch: ptr.pitch }; this.fixUntil = now + this.r(0.4, 1.2); }
    else if (now >= this.fixUntil) {
      const prev = this.target;
      const thinking = this.mode === "thinking";
      if (this.glanceBack) { this.target = this.glanceBack; this.glanceBack = null; this.fixUntil = now + this.r(0.9, 2.6); }
      else if (!thinking && this.rng() < 0.18) {
        // a glance: well off to one side, briefly, then back
        this.glanceBack = { ...prev };
        this.target = { yaw: (this.rng() < 0.5 ? -1 : 1) * this.r(10, 16), pitch: this.r(-6, 6) };
        this.fixUntil = now + this.r(0.35, 0.9);
      } else {
        let t;
        do t = thinking ? { yaw: this.r(-6, 9), pitch: this.r(0, 7) } : { yaw: this.r(-7, 7), pitch: this.r(-4, 4) };
        while (Math.hypot(t.yaw - prev.yaw, t.pitch - prev.pitch) < 2.5);
        this.target = t;
        this.fixUntil = now + this.r(0.8, 3.2) * (this.isSleepy(now) ? 1.6 : 1);
      }
      if (Math.hypot(this.target.yaw - prev.yaw, this.target.pitch - prev.pitch) > 9 && this.rng() < 0.5) this.blink(now, 0.2);
    }
    // saccade: fast critically damped approach (time constant about 50 ms), so a shift lands in about 0.15 s
    const k = 1 - Math.exp(-dt / 0.05);
    this.gaze.yaw += (this.target.yaw - this.gaze.yaw) * k;
    this.gaze.pitch += (this.target.pitch - this.gaze.pitch) * k;
  }

  private lidAt(now: number) {
    if (this.pendingDouble && now >= this.pendingDouble) { this.pendingDouble = 0; this.blinkAt = -10; this.blink(now, 0.18); this.note(now, "double blink"); }
    if (now >= this.nextBlink && !this.isDozing(now)) this.blink(now, this.isSleepy(now) ? 0.34 : this.r(0.18, 0.24));
    const u = (now - this.blinkAt) / this.blinkDur;
    if (u < 0 || u > 1) return this.isSleepy(now) ? 0.82 : 1;
    // close fast, reopen slower: shut at 33% of the blink
    return u < 0.33 ? 1 - u / 0.33 : (u - 0.33) / 0.67;
  }

  update(now: number): BehaviourFrame {
    if (!this.started) { this.started = true; this.lastPoke = now; this.modeAt = now; this.nextBlink = now + this.r(0.8, 2.5); this.nextAction = now + this.r(3, 6); this.lastT = now; }
    const dt = Math.max(0, Math.min(0.1, now - this.lastT));
    this.lastT = now;
    this.schedule(now);
    this.gazeStep(now, dt);
    const sway = Math.sin(now * 0.37) * 0.8 + Math.sin(now * 0.23 + 1.3) * 0.6;
    // breathing about 14 a minute, slower when sleepy
    const breath = Math.sin((now / (this.isSleepy(now) ? 5.5 : 4.3)) * Math.PI * 2);
    return { state: this.state, expression: this.faceNow(now), dYaw: this.gaze.yaw, dPitch: this.gaze.pitch, dRoll: sway, lid: this.lidAt(now), breath: breath * (this.state === "idle" || this.state === "listening" ? 1 : 0.4) };
  }
}

/** Seeded random source for repeatable runs (mulberry32). */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
