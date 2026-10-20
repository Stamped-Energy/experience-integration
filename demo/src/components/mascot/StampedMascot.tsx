"use client";
/** The Stamped mascot: the logo octagon with two eyes, animated by a pure engine (lib/mascot, built on bloub, MIT). */
import { useEffect, useId, useRef, useState } from "react";
import { render, sample, type MascotState, type Pose } from "@/lib/mascot/engine";

export type { MascotState };

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

export function StampedMascot({ state = "idle", size = 64, arrive = false, label, className }: { state?: MascotState; size?: number; arrive?: boolean; label?: string; className?: string }) {
  const id = useId().replace(/:/g, "");
  const still = useReducedMotion();
  const [shown, setShown] = useState<MascotState>(arrive ? "arrival" : state);
  const clock = useRef({ t0: 0, since: 0, from: undefined as Pose | undefined, last: undefined as Pose | undefined });
  const [, tick] = useState(0);

  useEffect(() => {
    if (shown === "arrival") { const h = setTimeout(() => setShown(state), 1300); return () => clearTimeout(h); }
    setShown(state);
  }, [state, shown]);

  useEffect(() => {
    const c = clock.current;
    const now = performance.now() / 1000;
    if (!c.t0) c.t0 = now;
    c.from = c.last;
    c.since = now;
  }, [shown]);

  useEffect(() => {
    if (still) { tick((n) => n + 1); return; }
    let raf = 0;
    const loop = () => { tick((n) => (n + 1) % 1e6); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [still]);

  const c = clock.current;
  const now = typeof performance === "undefined" ? 0 : performance.now() / 1000;
  const t = c.t0 ? now - c.t0 : 0;
  const lt = c.since ? now - c.since : 0;
  const pose = sample(shown, lt, t, c.from, still);
  c.last = pose;
  const f = render(pose);
  const fill = f.desat > 0.01 ? `color-mix(in srgb, var(--mascot-body, #F75440) ${Math.round((1 - f.desat) * 100)}%, #8C8A86)` : "var(--mascot-body, #F75440)";

  return (
    <svg className={`mascot${className ? ` ${className}` : ""}`} width={size} height={size} viewBox="-160 -160 320 320" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} data-state={shown}>
      <defs>
        <mask id={`m${id}`} maskUnits="userSpaceOnUse" x="-160" y="-160" width="320" height="320">
          <path d={f.body} fill="#fff" />
          {f.spokes.map((d, i) => <path key={i} d={d} fill="#000" />)}
          {f.hub > 0.5 ? <circle r={f.hub} fill="#fff" /> : null}
          <g opacity={f.eyeAlpha}>{f.eyes.map((e, i) => <path key={i} d={e.d} transform={e.transform} fill="#000" />)}</g>
        </mask>
      </defs>
      <g transform={f.transform}>
        <rect x="-160" y="-160" width="320" height="320" fill={fill} mask={`url(#m${id})`} />
      </g>
      {f.particles.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} opacity={p.o} fill="var(--mascot-body, #F75440)" />)}
      {f.badge > 0.01 ? (
        <g transform={`translate(98 -98) scale(${f.badge.toFixed(3)})`}>
          <circle r="34" fill="var(--mascot-warn, #D98E04)" />
          <rect x="-5" y="-20" width="10" height="24" rx="5" fill="#fff" />
          <circle cy="15" r="5.5" fill="#fff" />
        </g>
      ) : null}
    </svg>
  );
}

/** Mascot that plays a short sequence on mount, then settles: used beside each answer. */
export function SequenceMascot({ steps, size = 28, label }: { steps: [MascotState, number][]; size?: number; label?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (i >= steps.length - 1) return;
    const h = setTimeout(() => setI(i + 1), steps[i][1] * 1000);
    return () => clearTimeout(h);
  }, [i, steps]);
  return <StampedMascot state={steps[i][0]} size={size} label={label} />;
}
