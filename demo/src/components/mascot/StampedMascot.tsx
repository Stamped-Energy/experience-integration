"use client";
/**
 * The Stamped mascot: the logo octagon with two eyes, animated by a pure engine (lib/mascot, built on bloub, MIT)
 * and kept alive by a behaviour layer (lib/mascot/behaviour) that blinks, looks round, fidgets and moves through
 * fitting states while work is happening.
 *
 * <StampedMascot mode="thinking" />   live behaviour for an activity (the usual way)
 * <StampedMascot state="wink" />      one fixed state, still blinking and looking round
 */
import { useEffect, useId, useRef, useState } from "react";
import { NEUTRAL_FACE, STATE_INFO, blendFace, faceOf, render, sample, type Face, type MascotExpression, type MascotState, type Pose } from "@/lib/mascot/engine";
import { MascotBehaviour, seeded, type BehaviourFrame, type MascotMode } from "@/lib/mascot/behaviour";

export type { MascotState, MascotMode, MascotExpression };

function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const f = () => setR(m.matches);
    f();
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return r;
}

const RESTING: Record<MascotMode, MascotState> = { ambient: "idle", listening: "listening", thinking: "thinking", answering: "answering", success: "idle", warning: "warning", error: "error", asleep: "doze" };

export interface StampedMascotProps {
  /** activity the mascot reflects; drives the behaviour layer */
  mode?: MascotMode;
  /** pin one state instead (it still blinks and looks round); wins over `mode` */
  state?: MascotState;
  /** pin a resting expression (lab and stills) */
  expression?: MascotExpression;
  size?: number;
  arrive?: boolean;
  label?: string;
  className?: string;
  /** false = no random behaviour, only the state's own motion */
  live?: boolean;
  /** repeatable behaviour for tests and the lab page */
  seed?: number;
  /** quiet seconds before bored, sleepy and dozing (ambient only) */
  idleTimes?: { bored?: number; sleepy?: number; doze?: number };
  /** called about four times a second with what the behaviour layer chose */
  onBehaviour?: (f: BehaviourFrame) => void;
  /** replay a pinned one-shot state on a loop (lab page) */
  replay?: boolean;
}

export function StampedMascot({ mode = "ambient", state, expression, size = 64, arrive = false, label, className, live = true, seed, idleTimes, onBehaviour, replay }: StampedMascotProps) {
  const id = useId().replace(/:/g, "");
  const still = useReducedMotion();
  const svg = useRef<SVGSVGElement>(null);
  const small = size < 40;
  const [visible, setVisible] = useState(true);
  const [, tick] = useState(0);
  const [ready, setReady] = useState(false);
  const beh = useRef<MascotBehaviour | null>(null);
  if (!beh.current) beh.current = new MascotBehaviour({ rng: seed === undefined ? Math.random : seeded(seed), small, fixed: state, boredAfter: idleTimes?.bored, sleepyAfter: idleTimes?.sleepy, dozeAfter: idleTimes?.doze });
  const c = useRef({ t0: 0, shown: (arrive ? "arrival" : state ?? RESTING[mode]) as MascotState, since: 0, from: undefined as Pose | undefined, last: undefined as Pose | undefined, face: NEUTRAL_FACE as Face, faceFrom: NEUTRAL_FACE as Face, faceId: "neutral" as MascotExpression, faceAt: 0, reported: 0, frame: undefined as BehaviourFrame | undefined }).current;
  const cb = useRef(onBehaviour);
  cb.current = onBehaviour;

  useEffect(() => { setReady(true); }, []);
  useEffect(() => { beh.current?.setMode(mode, performance.now() / 1000); }, [mode]);
  useEffect(() => { beh.current?.setFixed(state); }, [state]);

  // pause when off screen: dozens of small mascots beside answers should not all animate
  useEffect(() => {
    const el = svg.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // the user's pointer and keys count as company: eyes follow the pointer nearby, and a dozing mascot wakes
  useEffect(() => {
    if (small || still || !live) return;
    const move = (e: PointerEvent) => {
      const el = svg.current;
      const b = beh.current;
      if (!el || !b) return;
      const now = performance.now() / 1000;
      b.poke(now);
      const r = el.getBoundingClientRect();
      if (!r.width) return;
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      if (Math.hypot(dx, dy) < r.width * 4) b.lookAt((dx / r.width) * 9, (-dy / r.height) * 7, now);
    };
    const key = () => beh.current?.poke(performance.now() / 1000);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("keydown", key); };
  }, [small, still, live]);

  useEffect(() => {
    if (still || !visible) { tick((n) => n + 1); return; }
    let raf = 0;
    let n = 0;
    const loop = () => {
      // small sizes run at half rate; the motion is too small to need 60 fps
      if (!small || ++n % 2) tick((v) => (v + 1) % 1e6);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [still, visible, small]);

  const now = ready && typeof performance !== "undefined" ? performance.now() / 1000 : 0;
  if (ready && !c.t0) { c.t0 = now || 0.0001; c.since = c.t0; }
  const t = c.t0 ? now - c.t0 : 0;

  let target: MascotState;
  let life: { dYaw: number; dPitch: number; dRoll: number; lid: number; breath: number } | undefined;
  let faceId: MascotExpression = expression ?? "neutral";
  if (still) target = state ?? RESTING[mode];
  else if (c.shown === "arrival" && t < 1.3) target = "arrival";
  else if (!live || !ready) target = state ?? RESTING[mode];
  else {
    const f = beh.current.update(now);
    c.frame = f;
    target = state ?? f.state;
    if (!expression) faceId = f.expression;
    life = { dYaw: f.dYaw, dPitch: f.dPitch, dRoll: f.dRoll, lid: f.lid, breath: f.breath };
    if (cb.current && now - c.reported > 0.25) { c.reported = now; cb.current(f); }
  }
  if (replay && state && target === c.shown && !STATE_INFO[state].loops && now - c.since > STATE_INFO[state].duration + 1.2) { c.since = now; c.from = c.last; }
  if (target !== c.shown) { c.from = c.last; c.since = now; c.shown = target; }
  if (faceId !== c.faceId) { c.faceFrom = c.face; c.faceId = faceId; c.faceAt = now; }
  const fk = Math.min(1, (now - c.faceAt) / 0.4);
  c.face = still ? faceOf(faceId) : blendFace(c.faceFrom, faceOf(faceId), 1 - (1 - fk) ** 3);

  const pose = sample(c.shown, now - c.since, t, c.from, still, life, c.face);
  c.last = pose;
  // Small sizes get larger eyes so the face still reads at 22 to 28 px.
  const f = render(pose, { eyeBoost: small ? 1.45 : 1 });
  const fill = f.desat > 0.01 ? `color-mix(in srgb, var(--mascot-body, #F75440) ${Math.round((1 - f.desat) * 100)}%, #8C8A86)` : "var(--mascot-body, #F75440)";
  const body = "var(--mascot-body, #F75440)";

  return (
    <svg ref={svg} className={`mascot${className ? ` ${className}` : ""}`} width={size} height={size} viewBox={small ? "-112 -112 224 224" : "-160 -160 320 320"} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} data-state={c.shown} data-expression={faceId} data-mode={mode}>
      <defs>
        <mask id={`m${id}`} maskUnits="userSpaceOnUse" x="-160" y="-160" width="320" height="320">
          <path d={f.body} fill="#fff" />
          <g opacity={f.spoke}>{f.spokes.map((d, i) => <path key={i} d={d} fill="#000" />)}</g>
          {f.hub > 0.5 ? <circle r={f.hub} fill="#fff" /> : null}
          <g opacity={f.eyeAlpha}>{f.eyes.map((e, i) => <path key={i} d={e.d} transform={e.transform} fill="#000" />)}</g>
          {f.notif ? <circle cx={f.notif.x} cy={f.notif.y} r={f.notif.notch} fill="#000" /> : null}
        </mask>
        {f.arcs.map((a) => <linearGradient key={a.id} id={`g${id}${a.id}`} gradientUnits="userSpaceOnUse" x1={a.grad.x1} y1={a.grad.y1} x2={a.grad.x2} y2={a.grad.y2}>{a.grad.stops.map((s, i) => <stop key={i} offset={i / (a.grad.stops.length - 1)} stopColor={s} />)}</linearGradient>)}
      </defs>
      {f.arcs.map((a) => <path key={`b${a.id}`} d={a.back} fill="none" stroke={`url(#g${id}${a.id})`} strokeWidth={a.width} strokeLinecap="round" opacity={a.o * 0.9} />)}
      <g transform={f.transform}>
        <rect x="-160" y="-160" width="320" height="320" fill={fill} mask={`url(#m${id})`} />
      </g>
      {f.arcs.map((a) => <path key={`f${a.id}`} d={a.front} fill="none" stroke={`url(#g${id}${a.id})`} strokeWidth={a.width} strokeLinecap="round" opacity={a.o} />)}
      {f.dots.map((d, i) => d.d ? <path key={i} d={d.d} transform={d.transform} opacity={d.o} fill={body} /> : <circle key={i} cx={d.x} cy={d.y} r={d.r} opacity={d.o} fill={body} />)}
      {f.notif ? <circle cx={f.notif.x} cy={f.notif.y} r={f.notif.r} fill="var(--mascot-notify, #2496E8)" /> : null}
      {f.particles.map((p, i) => <circle key={`p${i}`} cx={p.x} cy={p.y} r={p.r} opacity={p.o} fill={body} />)}
      {f.badge > 0.01 ? (
        <g transform={`translate(${small ? 72 : 98} ${small ? -72 : -98}) scale(${(f.badge * (small ? 1.2 : 1)).toFixed(3)})`}>
          <circle r="34" fill="var(--mascot-warn, #D98E04)" />
          <rect x="-5" y="-20" width="10" height="24" rx="5" fill="#fff" />
          <circle cy="15" r="5.5" fill="#fff" />
        </g>
      ) : null}
    </svg>
  );
}

/** Mascot that runs a short sequence of activity modes on mount, then settles: used beside each answer. */
export function SequenceMascot({ steps, size = 28, label }: { steps: [MascotMode, number][]; size?: number; label?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (i >= steps.length - 1) return;
    const h = setTimeout(() => setI(i + 1), steps[i][1] * 1000);
    return () => clearTimeout(h);
  }, [i, steps]);
  return <StampedMascot mode={steps[i][0]} size={size} label={label} />;
}
