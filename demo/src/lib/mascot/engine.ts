/**
 * Stamped mascot engine. Pure function of time, no React and no clock, in the same spirit as bloub's engine
 * (see ./bloub, MIT). The body is the Stamped octagon; the white pinwheel spokes are holes in a mask, as are the eyes.
 * Units: octagon circumradius = 1. Screen y points down.
 */
import { clamp, easings, lerp } from "./bloub/math";
import { EYE_H, EYE_W, eyePoses, liveliness, blinkScale, type HeadGaze } from "./bloub/face";
import { capsulePath, closedPath, regularPolygonProfile, toPoints, type Point } from "./bloub/shape";

export type MascotState = "arrival" | "idle" | "listening" | "thinking" | "answering" | "success" | "warning" | "error";
export const MASCOT_STATES: MascotState[] = ["arrival", "idle", "listening", "thinking", "answering", "success", "warning", "error"];

/** One logo wedge, hand-traced off the official PNG and fitted by overlay (IoU 0.94 against all eight wedges). */
export const WEDGE: Point[] = [
  { x: -0.2971, y: -0.9578 }, { x: -0.2898, y: -0.8391 }, { x: -0.1187, y: -0.6895 },
  { x: -0.0003, y: -0.3204 }, { x: 0.3054, y: -0.8473 }, { x: 0.3052, y: -0.9503 },
];
const STEP = Math.PI / 4;
const rotP = (p: Point, a: number): Point => ({ x: p.x * Math.cos(a) - p.y * Math.sin(a), y: p.x * Math.sin(a) + p.y * Math.cos(a) });
const pathOf = (pts: Point[], s: number) => pts.map((p, i) => `${i ? "L" : "M"}${(p.x * s).toFixed(2)} ${(p.y * s).toFixed(2)}`).join("") + "Z";

/** The exact logo as one path, eight wedges, at scale s. */
export function logoPath(s = 100): string {
  let d = "";
  for (let k = 0; k < 8; k++) d += pathOf(WEDGE.map((p) => rotP(p, k * STEP)), s);
  return d;
}

/** Spoke k: the gap between wedge k and wedge k+1. `open` widens (+) or narrows (-) the gap by turning its two edges. */
export function spokePath(k: number, open: number, rot: number, s: number): string {
  const d = open * (Math.PI / 180) * 5;
  const a = WEDGE.slice(3).map((p) => rotP(p, k * STEP + rot - d));
  const b = WEDGE.slice(0, 4).map((p) => rotP(p, (k + 1) * STEP + rot + d));
  const far = (p: Point) => ({ x: p.x * 1.5, y: p.y * 1.5 });
  return pathOf([{ x: 0, y: 0 }, ...a, far(a[a.length - 1]), far(b[0]), ...b], s);
}

/**
 * Rim notch k: a short V cut at octagon corner k, from the round body out through the rim, following Vinayak's sketch.
 * `twist` slants it like the logo's pinwheel; `open` widens (+) or narrows (-) it.
 */
export function notchPath(k: number, open: number, rot: number, s: number, bodyR: number, twist: number, width = 1): string {
  const c = -Math.PI / 2 + STEP / 2 + k * STEP + rot;
  const deg = Math.PI / 180;
  const ai = Math.max(0.5, (5 + open * 3) * width) * deg;
  const ao = Math.max(1, (17 + open * 7) * width) * deg;
  const tw = twist * deg;
  const at = (r: number, a: number): Point => ({ x: Math.cos(a) * r, y: Math.sin(a) * r });
  const r0 = bodyR - 0.01;
  return pathOf([at(r0, c - ai), at(r0, c + ai), at(1.5, c + tw + ao), at(1.5, c + tw - ao)], s);
}

const BODY = regularPolygonProfile(8, 1.035, 0.05, 22.5);

export interface Pose {
  scale: number; sx: number; sy: number; dy: number;
  rot: number; open: number; hub: number;
  gaze: HeadGaze; eyeW: number; eyeH: number; lids: [number, number]; tilt: [number, number]; eyeAlpha: number;
  desat: number; badge: number; particles: number;
}

const REST: HeadGaze = { yaw: 3, pitch: 7, roll: -12 };
const base = (): Pose => ({
  scale: 1, sx: 1, sy: 1, dy: 0, rot: 0, open: 0, hub: 1,
  gaze: { ...REST }, eyeW: EYE_W * 0.86, eyeH: EYE_H * 0.64, lids: [1, 1], tilt: [0, 0], eyeAlpha: 1,
  desat: 0, badge: 0, particles: -1,
});
const backOut = (x: number) => { const c = 1.6; const t = clamp(x) - 1; return 1 + (c + 1) * t ** 3 + c * t ** 2; };

/** Target pose of a state, `lt` seconds after entering it, at absolute time `t`. */
export function statePose(state: MascotState, lt: number, t: number, still = false): Pose {
  const p = base();
  const L = still ? { dYaw: 0, dPitch: 0, dRoll: 0, lid: 1 } : liveliness(t, { float: false });
  p.gaze = { yaw: REST.yaw + L.dYaw, pitch: REST.pitch + L.dPitch, roll: REST.roll + L.dRoll };
  p.lids = [L.lid, L.lid];
  switch (state) {
    case "arrival": {
      p.scale = backOut(lt / 0.5);
      p.rot = -STEP * (1 - easings.easeOutCubic(clamp(lt / 0.9)));
      const f = easings.easeOutCubic(clamp((lt - 0.55) / 0.4));
      p.hub = f; p.eyeAlpha = f; p.eyeH *= 0.3 + 0.7 * f;
      break;
    }
    case "listening":
      p.gaze = { yaw: L.dYaw * 0.3, pitch: -4, roll: REST.roll * 0.6 };
      p.eyeH *= 1.12; p.open = 0.15; p.sy = 1.015; p.sx = 0.995;
      break;
    case "thinking": {
      p.rot = lt * 0.9;
      p.gaze = { yaw: 12 + Math.sin(lt * 1.3) * 6, pitch: 22 + Math.sin(lt * 0.9) * 3, roll: -6 };
      p.lids = [0.62 * L.lid, 0.62 * L.lid];
      p.sy = 1 + Math.sin(lt * 2.4) * 0.008;
      break;
    }
    case "answering": {
      const ph = lt * 1.6 * Math.PI * 2;
      p.open = 0.45; p.sy = 1 + Math.sin(ph) * 0.022; p.sx = 1 - Math.sin(ph) * 0.013; p.dy = -Math.max(0, Math.sin(ph)) * 0.015;
      const n = Math.floor(lt / 1.2); p.rot = (n + easings.easeOutCubic(clamp((lt - n * 1.2) / 0.3))) * STEP;
      p.gaze = { ...p.gaze, pitch: 6 + L.dPitch * 0.5 };
      p.lids = [0.86 * L.lid, 0.86 * L.lid];
      break;
    }
    case "success": {
      const sq = lt < 0.12 ? lt / 0.12 : lt < 0.3 ? 1 - ((lt - 0.12) / 0.18) * 1.6 : -0.6 * (1 - easings.easeOutCubic(clamp((lt - 0.3) / 0.35)));
      p.sx = 1 + 0.12 * sq; p.sy = 1 - 0.12 * sq; p.dy = 0.12 * Math.max(0, sq) * 0.5;
      p.particles = lt < 1 ? lt : -1;
      p.open = 0.5 * (1 - easings.easeOutCubic(clamp(lt / 1.2)));
      if (lt > 0.2 && lt < 0.65) p.lids = [L.lid, 0.06];
      p.gaze = { ...p.gaze, pitch: 14 };
      break;
    }
    case "warning":
      p.badge = backOut(lt / 0.35); p.eyeH *= 0.78; p.gaze = { yaw: -2, pitch: 4, roll: -18 };
      break;
    case "error":
      p.open = -0.7; p.eyeH *= 0.75; p.eyeW *= 1.1; p.tilt = [14, -14]; p.gaze = { yaw: 0, pitch: -12, roll: -4 };
      p.lids = [0.8 * L.lid, 0.8 * L.lid]; p.desat = 0.45; p.sy = 0.97; p.dy = 0.02;
      break;
    default:
      break;
  }
  return p;
}

export function blendPose(a: Pose, b: Pose, k: number): Pose {
  const l = (x: number, y: number) => lerp(x, y, k);
  return {
    scale: l(a.scale, b.scale), sx: l(a.sx, b.sx), sy: l(a.sy, b.sy), dy: l(a.dy, b.dy),
    rot: l(a.rot, b.rot), open: l(a.open, b.open), hub: l(a.hub, b.hub),
    gaze: { yaw: l(a.gaze.yaw, b.gaze.yaw), pitch: l(a.gaze.pitch, b.gaze.pitch), roll: l(a.gaze.roll, b.gaze.roll) },
    eyeW: l(a.eyeW, b.eyeW), eyeH: l(a.eyeH, b.eyeH), lids: [l(a.lids[0], b.lids[0]), l(a.lids[1], b.lids[1])],
    tilt: [l(a.tilt[0], b.tilt[0]), l(a.tilt[1], b.tilt[1])], eyeAlpha: l(a.eyeAlpha, b.eyeAlpha),
    desat: l(a.desat, b.desat), badge: l(a.badge, b.badge), particles: b.particles,
  };
}

export const FADE = 0.35;
/** Pose on screen: the new state's pose, blended from the frozen pose `from` that was on screen at the change. */
export function sample(state: MascotState, lt: number, t: number, from?: Pose, still = false): Pose {
  const to = statePose(state, still ? 30 : lt, still ? 0 : t, still);
  if (from) to.rot += Math.round(from.rot / STEP) * STEP;
  if (!from || still) return to;
  return blendPose(from, to, easings.easeOutCubic(clamp(lt / FADE)));
}

/** Body radius (octagon circumradius = 1). Measured off the sketch: the body fills about 70% of the octagon width. */
export const BODY_R = 0.67;
export const NOTCH = { notch: "logo" as "v" | "logo", twist: 8, width: 1 };
export interface RenderOpts { bodyR?: number; eyeBoost?: number; notch?: "v" | "logo"; twist?: number; width?: number }

export interface Frame {
  transform: string; body: string; spokes: string[]; hub: number;
  eyes: { d: string; transform: string }[]; eyeAlpha: number; desat: number;
  particles: { x: number; y: number; r: number; o: number }[]; badge: number;
}

/** SVG geometry for a pose, in a viewBox of -160..160 with circumradius 100. */
export function render(p: Pose, o: RenderOpts = {}): Frame {
  const R = 100;
  const bodyR = o.bodyR ?? BODY_R;
  const k = bodyR / 0.42;
  const eb = o.eyeBoost ?? 1;
  const body = closedPath(toPoints({ radii: BODY, rot: p.rot, cx: 0, cy: 0, sx: 1, sy: 1 }, R), 0.08);
  const spokes = Array.from({ length: 8 }, (_, n) => (o.notch ?? NOTCH.notch) === "logo" ? spokePath(n, p.open, p.rot, R) : notchPath(n, p.open, p.rot, R, bodyR, o.twist ?? NOTCH.twist, o.width ?? NOTCH.width));
  const poses = eyePoses(p.gaze, R * bodyR * 1.15);
  const eyes = poses.map((e, i) => {
    const bs = blinkScale(p.lids[i]);
    return {
      d: capsulePath(p.eyeW * R * k * eb, p.eyeH * R * k * eb),
      transform: `translate(${e.x.toFixed(2)} ${e.y.toFixed(2)}) scale(1 ${bs.toFixed(3)}) matrix(${e.a.toFixed(3)} ${e.b.toFixed(3)} ${e.c.toFixed(3)} ${e.d.toFixed(3)} 0 0) rotate(${p.tilt[i].toFixed(1)})`,
    };
  });
  const particles = p.particles < 0 ? [] : Array.from({ length: 8 }, (_, k) => {
    const a = -Math.PI / 2 + STEP / 2 + k * STEP + p.rot;
    const f = easings.easeOutCubic(clamp(p.particles / 0.8));
    const r = (0.95 + 0.55 * f) * R;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r, r: 9 * (1 - 0.6 * f), o: 1 - clamp((p.particles - 0.5) / 0.5) };
  });
  return {
    transform: `translate(0 ${(p.dy * R).toFixed(2)}) scale(${(p.scale * p.sx).toFixed(4)} ${(p.scale * p.sy).toFixed(4)})`,
    body, spokes, hub: p.hub * bodyR * R, eyes, eyeAlpha: p.eyeAlpha, desat: p.desat, particles, badge: p.badge,
  };
}
