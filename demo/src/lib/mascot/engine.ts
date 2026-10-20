/**
 * Stamped mascot engine. Pure function of time, no React and no clock, in the same spirit as bloub's engine
 * (see ./bloub, MIT). The body is the Stamped octagon; the white pinwheel spokes are holes in a mask, as are the eyes.
 * Units: octagon circumradius = 1. Screen y points down.
 */
import { TAU, clamp, easings, lerp } from "./bloub/math";
import { EYE_H, EYE_SPLIT, EYE_W, REST_GAZE as BLOUB_REST, eyePoses, liveliness, blinkScale, type HeadGaze } from "./bloub/face";
import { capsulePath, closedPath, hullOfCircles, polyPath, profileFromPolygon, regularPolygonProfile, toPoints, type Point } from "./bloub/shape";
import { PROFILES } from "./bloub/profiles";
import { COMET_DOT, COMET_RIBBONS, DOT_PEAK, DOT_R, DOT_X, NOTIF_ANGLE, NOTIF_DIST, NOTIF_MARGIN, NOTIF_POP, NOTIF_R, RINGS, SWOOSH, arcRender, particles as burstParticles, type ArcRender, type ArcSeed } from "./bloub/decor";
import { EXPRESSION_BY_ID, type BotExpression, type ExpressionId } from "./bloub/expressions";

export type MascotState =
  | "arrival" | "idle" | "listening" | "thinking" | "answering" | "success" | "warning" | "error" | "doze"
  | "dots" | "wink" | "wide" | "alert" | "notify" | "exclaim" | "sleep" | "egg" | "hexagon" | "play" | "orbit" | "swirl" | "burst" | "comet";
export const MASCOT_STATES: MascotState[] = [
  "arrival", "idle", "listening", "thinking", "answering", "success", "warning", "error", "doze",
  "dots", "wink", "wide", "alert", "notify", "exclaim", "sleep", "egg", "hexagon", "play", "orbit", "swirl", "burst", "comet",
];

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

/** Body shapes the octagon can morph into. All share bloub's 64 radial samples, so a morph is a blend of radii. */
const BAR_UPRIGHT_CY = -0.1875;
const SHAPES = {
  octagon: BODY,
  egg: [...PROFILES.egg].map((r) => r * 1.02),
  hexagon: [...PROFILES.hexagon].map((r) => r * 1.02),
  triangle: [...PROFILES.triangle],
  barUpright: profileFromPolygon(hullOfCircles(0, -0.505, 0.132, 0, 0.13, 0.075), 0, BAR_UPRIGHT_CY),
  barItalic: profileFromPolygon(hullOfCircles(0, -0.2535, 0.1345, 0, 0.2535, 0.1345), 0, 0),
};
export type BodyShape = keyof typeof SHAPES;
/** The "!" dot of `alert` is a teardrop, as in bloub. */
const TEAR = polyPath(hullOfCircles(0, 0, 0.118, 0, 0.172, 0.012));

export interface Dot { x: number; y: number; r: number; o: number; d?: string; rot?: number }
export interface Arc { id: string; seed: ArcSeed; t: number; o: number }

export interface Pose {
  scale: number; sx: number; sy: number; dx: number; dy: number;
  rot: number; open: number; hub: number;
  /** body outline as 64 radii; morphs between shapes by blending */
  shape: number[]; srot: number; spoke: number;
  gaze: HeadGaze; split: number; eyeW: number; eyeH: number;
  ew: [number, number]; eh: [number, number]; lids: [number, number]; tilt: [number, number]; eyeAlpha: number;
  desat: number; badge: number; particles: number;
  dots: Dot[]; arcs: Arc[]; notif: { x: number; y: number; r: number } | null;
}

/** Per-frame life supplied by the behaviour layer: gaze offsets, lids, breathing. Absent = bloub's deterministic liveliness. */
export interface Life { dYaw: number; dPitch: number; dRoll: number; lid: number; breath?: number }

const REST: HeadGaze = { yaw: 3, pitch: 7, roll: -12 };
const base = (): Pose => ({
  scale: 1, sx: 1, sy: 1, dx: 0, dy: 0, rot: 0, open: 0, hub: 1,
  shape: BODY, srot: 0, spoke: 1,
  gaze: { ...REST }, split: EYE_SPLIT, eyeW: EYE_W * 0.86, eyeH: EYE_H * 0.64,
  ew: [1, 1], eh: [1, 1], lids: [1, 1], tilt: [0, 0], eyeAlpha: 1,
  desat: 0, badge: 0, particles: -1, dots: [], arcs: [], notif: null,
});
const backOut = (x: number) => { const c = 1.6; const t = clamp(x) - 1; return 1 + (c + 1) * t ** 3 + c * t ** 2; };

/** Our rings, ribbons and swoosh use bloub's measured orbits, recoloured to warm Stamped hues. */
const warm = (s: ArcSeed, i: number): ArcSeed => ({ ...s, hue: 2 + ((i * 11) % 40), hueSpan: 28 });
const RINGS_W = RINGS.map(warm);
const SWOOSH_W = SWOOSH.map(warm);
const COMET_W = COMET_RIBBONS.map(warm);

/** Bloub's three-dot pulse, left to right. */
function dotPulse(t: number, index: number): number {
  const p = ((((t - index * 0.5) / 1.5) % 1) + 1) % 1;
  const k = p < 0.5 ? 0.5 - 0.5 * Math.cos(p * TAU) : 0;
  return clamp(k * 2);
}

/** States whose body is the octagon (rotation snaps to the 45 degree symmetry), and which carry the resting face. */
export const BASE_FACE: ReadonlySet<MascotState> = new Set(["idle", "swirl", "listening"]);
const OCTAGONAL: ReadonlySet<MascotState> = new Set(["arrival", "idle", "listening", "thinking", "answering", "success", "warning", "error", "doze", "wink", "wide", "notify", "swirl", "burst", "comet", "sleep", "dots"]);

/** Timing per state, in seconds: how long one pass reads well, the shortest cut that still completes, and the morph in. */
export const STATE_INFO: Record<MascotState, { duration: number; min?: number; morph: number; blinkIn: boolean; loops: boolean }> = {
  arrival: { duration: 1.3, min: 1.3, morph: 0.3, blinkIn: false, loops: false },
  idle: { duration: 2.4, morph: 0.45, blinkIn: false, loops: true },
  listening: { duration: 2.4, morph: 0.4, blinkIn: false, loops: true },
  thinking: { duration: 3, morph: 0.4, blinkIn: false, loops: true },
  answering: { duration: 3, morph: 0.35, blinkIn: false, loops: true },
  success: { duration: 1.4, min: 1.2, morph: 0.3, blinkIn: false, loops: false },
  warning: { duration: 2.4, morph: 0.4, blinkIn: false, loops: true },
  error: { duration: 2.4, morph: 0.45, blinkIn: false, loops: true },
  doze: { duration: 4, morph: 0.9, blinkIn: false, loops: true },
  dots: { duration: 2.6, morph: 0.4, blinkIn: true, loops: true },
  wink: { duration: 1.6, morph: 0.3, blinkIn: true, loops: false },
  wide: { duration: 1.8, morph: 0.55, blinkIn: true, loops: false },
  alert: { duration: 2.4, min: 2, morph: 0.45, blinkIn: false, loops: false },
  notify: { duration: 2.2, morph: 0.5, blinkIn: true, loops: false },
  exclaim: { duration: 2, morph: 0.45, blinkIn: false, loops: false },
  sleep: { duration: 2.4, morph: 0.5, blinkIn: false, loops: true },
  egg: { duration: 1.8, morph: 0.4, blinkIn: true, loops: false },
  hexagon: { duration: 1.6, morph: 0.4, blinkIn: true, loops: false },
  play: { duration: 2, morph: 0.5, blinkIn: true, loops: false },
  orbit: { duration: 3.4, min: 2.5, morph: 0.6, blinkIn: false, loops: false },
  swirl: { duration: 1.3, min: 1.3, morph: 0.3, blinkIn: true, loops: false },
  burst: { duration: 2.6, min: 2.4, morph: 0.4, blinkIn: false, loops: false },
  comet: { duration: 2.4, min: 2.4, morph: 0.45, blinkIn: false, loops: false },
};

/** Bloub's 16 resting expressions, adapted to our front-facing head: gaze as a softened offset, eye sizes as ratios. */
export type MascotExpression = "neutral" | "attentive" | "surprised" | "excited" | "happy" | "laughing" | "angry" | "sad" | "scared" | "suspicious" | "confused" | "curious" | "proud" | "shy" | "bored" | "sleepy";
export const EXPRESSION_IDS: Record<MascotExpression, ExpressionId> = {
  neutral: "neutre", attentive: "attentif", surprised: "surpris", excited: "excite", happy: "heureux", laughing: "hilare",
  angry: "colere", sad: "triste", scared: "effraye", suspicious: "mefiant", confused: "confus", curious: "curieux",
  proud: "fier", shy: "timide", bored: "blase", sleepy: "somnolent",
};
export const MASCOT_EXPRESSIONS = Object.keys(EXPRESSION_IDS) as MascotExpression[];
export interface Face { dYaw: number; dPitch: number; dRoll: number; split: number; ew: [number, number]; eh: [number, number]; tilt: [number, number]; open: [number, number] }
export const NEUTRAL_FACE: Face = { dYaw: 0, dPitch: 0, dRoll: 0, split: EYE_SPLIT, ew: [1, 1], eh: [1, 1], tilt: [0, 0], open: [1, 1] };
/** Our eyes are larger relative to the body than bloub's, so size ratios are eased towards 1 to keep the eyes apart. */
const soft = (r: number) => 1 + (r - 1) * (r > 1 ? 0.5 : 0.8);
export function faceOf(id: MascotExpression): Face {
  const e = EXPRESSION_BY_ID.get(EXPRESSION_IDS[id]) as BotExpression;
  return {
    dYaw: (e.gaze.yaw - BLOUB_REST.yaw) * 0.55, dPitch: (e.gaze.pitch - BLOUB_REST.pitch) * 0.55, dRoll: (e.gaze.roll - BLOUB_REST.roll) * 0.55,
    split: e.split,
    ew: [soft(e.eyes[0].w / EYE_W), soft(e.eyes[1].w / EYE_W)], eh: [soft(e.eyes[0].h / EYE_H), soft(e.eyes[1].h / EYE_H)],
    tilt: [e.eyes[0].tilt ?? 0, e.eyes[1].tilt ?? 0], open: [e.eyes[0].open, e.eyes[1].open],
  };
}
export function blendFace(a: Face, b: Face, k: number): Face {
  const l = (x: number, y: number) => lerp(x, y, k);
  const p = (x: [number, number], y: [number, number]): [number, number] => [l(x[0], y[0]), l(x[1], y[1])];
  return { dYaw: l(a.dYaw, b.dYaw), dPitch: l(a.dPitch, b.dPitch), dRoll: l(a.dRoll, b.dRoll), split: l(a.split, b.split), ew: p(a.ew, b.ew), eh: p(a.eh, b.eh), tilt: p(a.tilt, b.tilt), open: p(a.open, b.open) };
}

const arcs = (seeds: ArcSeed[], id: string, t: number, o: (i: number) => number, shift?: (s: ArcSeed) => ArcSeed): Arc[] =>
  seeds.map((s, i) => ({ id: `${id}${i}`, seed: shift ? shift(s) : s, t, o: o(i) }));

/** Target pose of a state, `lt` seconds after entering it, at absolute time `t`. */
export function statePose(state: MascotState, lt: number, t: number, still = false, life?: Life, face: Face = NEUTRAL_FACE): Pose {
  const p = base();
  const L = still ? { dYaw: 0, dPitch: 0, dRoll: 0, lid: 1, breath: 0 } : life ?? { ...liveliness(t, { float: false }), breath: 0 };
  p.gaze = { yaw: REST.yaw + L.dYaw, pitch: REST.pitch + L.dPitch, roll: REST.roll + L.dRoll };
  p.lids = [L.lid, L.lid];
  if (BASE_FACE.has(state)) {
    p.gaze = { yaw: p.gaze.yaw + face.dYaw, pitch: p.gaze.pitch + face.dPitch, roll: p.gaze.roll + face.dRoll };
    p.split = face.split; p.ew = [...face.ew]; p.eh = [...face.eh]; p.tilt = [...face.tilt];
    p.lids = [L.lid * face.open[0], L.lid * face.open[1]];
  }
  const br = L.breath ?? 0;
  p.sy = 1 + br * 0.012; p.sx = 1 - br * 0.004;
  switch (state) {
    case "arrival": {
      p.scale = backOut(lt / 0.5);
      p.rot = -STEP * (1 - easings.easeOutCubic(clamp(lt / 0.9)));
      const f = easings.easeOutCubic(clamp((lt - 0.55) / 0.4));
      p.hub = f; p.eyeAlpha = f; p.eyeH *= 0.3 + 0.7 * f;
      break;
    }
    case "listening":
      p.gaze = { yaw: p.gaze.yaw * 0.6, pitch: p.gaze.pitch - 11, roll: p.gaze.roll * 0.6 };
      p.eyeH *= 1.12; p.open = 0.15; p.sy *= 1.015; p.sx *= 0.995;
      break;
    case "thinking": {
      p.rot = lt * 0.9;
      p.gaze = { yaw: 12 + Math.sin(lt * 1.3) * 6 + L.dYaw * 0.4, pitch: 22 + Math.sin(lt * 0.9) * 3, roll: -6 };
      p.lids = [0.62 * L.lid, 0.62 * L.lid];
      p.sy *= 1 + Math.sin(lt * 2.4) * 0.008;
      break;
    }
    case "answering": {
      const ph = lt * 1.6 * Math.PI * 2;
      p.open = 0.45; p.sy *= 1 + Math.sin(ph) * 0.022; p.sx *= 1 - Math.sin(ph) * 0.013; p.dy = -Math.max(0, Math.sin(ph)) * 0.015;
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
      p.badge = backOut(lt / 0.35); p.eyeH *= 0.78; p.gaze = { yaw: -2 + L.dYaw * 0.5, pitch: 4, roll: -18 };
      break;
    case "error":
      p.open = -0.7; p.eyeH *= 0.75; p.eyeW *= 1.1; p.tilt = [14, -14]; p.gaze = { yaw: L.dYaw * 0.5, pitch: -12, roll: -4 };
      p.lids = [0.8 * L.lid, 0.8 * L.lid]; p.desat = 0.45; p.sy *= 0.97; p.dy = 0.02;
      break;
    case "doze": {
      // Our own: eyes shut, slow deep breaths, the shutter drifting a little. Used after a long quiet spell.
      const b = Math.sin((lt / 4.2) * TAU);
      p.lids = [0.07, 0.07]; p.eh = [0.8, 0.8]; p.ew = [1.15, 1.15];
      p.gaze = { yaw: 2, pitch: -10, roll: -16 + b * 2 };
      p.sy = 1 + b * 0.02; p.sx = 1 - b * 0.008; p.dy = 0.02 - b * 0.01; p.rot = Math.sin(lt * 0.25) * 0.05; p.open = -0.2;
      break;
    }
    case "dots": {
      // bloub `thinking`: the body becomes the middle of three pulsing dots (here a tiny octagon), the others emerge from its sides.
      const mid = dotPulse(lt, 1);
      const emerge = 0.3 + 0.7 * easings.easeOutCubic(clamp(lt / 0.3));
      p.scale = DOT_R * 1.1 * (1 + (DOT_PEAK - 1) * mid); p.dx = DOT_X[1]; p.eyeAlpha = 0; p.hub = 1;
      p.rot = lt * 0.6;
      p.dots = [0, 2].map((i) => { const k = dotPulse(lt, i); return { x: DOT_X[i] * emerge, y: 0, r: DOT_R * (1 + (DOT_PEAK - 1) * k), o: 0.55 + 0.45 * k }; });
      break;
    }
    case "wink":
      p.gaze = { yaw: p.gaze.yaw - 6, pitch: p.gaze.pitch - 2, roll: p.gaze.roll + 10 };
      // the shut eye is a wide flat dash, not a squashed open eye (bloub measurement)
      p.ew = [1, 2.1]; p.eh = [1, 0.2]; p.lids = [L.lid, 1]; p.open = 0.25;
      break;
    case "wide":
      p.gaze = { yaw: p.gaze.yaw + 3, pitch: p.gaze.pitch - 14, roll: p.gaze.roll + 8 };
      p.split = 18.4; p.ew = [1.55, 1.55]; p.eh = [1.65, 1.65]; p.open = 0.3; p.sy *= 1.02;
      break;
    case "alert": {
      // The octagon becomes an italic "!" that slides across and back, with bloub's measured travel and 2.5 Hz buzz.
      const q = clamp(lt / 1.5);
      const travel = easings.easeInOutCubic(q) * 0.82 - 0.087;
      const back = lt > 1.6 ? clamp((lt - 1.6) / 0.4) : 0;
      const x = travel * (1 - back) + 0.1 * back;
      const buzz = Math.sin(lt * 2.5 * TAU) * 0.005;
      const tilt = (17.7 * Math.PI) / 180;
      p.shape = SHAPES.barItalic; p.srot = tilt; p.dx = x * 0.8; p.dy = -0.26 - buzz; p.spoke = 0; p.hub = 0; p.eyeAlpha = 0; p.sx = 1; p.sy = 1;
      p.dots = [{ x: x * 0.8 - Math.sin(tilt) * 0.58, y: -0.26 + Math.cos(tilt) * 0.58 + buzz * 2.8, r: 0.118, d: TEAR, rot: (tilt * 180) / Math.PI, o: 1 }];
      break;
    }
    case "notify": {
      const q = clamp(lt / 0.45);
      const pop = 1 + (NOTIF_POP - 1) * Math.sin(q * Math.PI) * (1 - q * 0.35);
      const r = NOTIF_R * (q < 1 ? pop : 1) * backOut(lt / 0.3);
      const a = (NOTIF_ANGLE * Math.PI) / 180;
      // the gaze turns towards the badge
      p.gaze = { yaw: p.gaze.yaw + 10, pitch: p.gaze.pitch - 8, roll: p.gaze.roll + 4 };
      p.ew = [1.6, 1.6]; p.eh = [0.95, 0.95]; p.split = 18.9;
      p.notif = { x: Math.cos(a) * NOTIF_DIST, y: Math.sin(a) * NOTIF_DIST, r };
      break;
    }
    case "exclaim":
      p.shape = SHAPES.barUpright; p.dy = BAR_UPRIGHT_CY; p.spoke = 0; p.hub = 0; p.eyeAlpha = 0; p.sx = 1; p.sy = 1;
      p.dots = [{ x: -0.012, y: 0.526, r: 0.113, o: 1 }];
      break;
    case "sleep":
      // bloub: the body shrinks to a small dot bouncing on a 0.6 s period
      p.scale = 0.17; p.dy = 0.11 + Math.sin(lt * (TAU / 0.6)) * 0.19; p.eyeAlpha = 0;
      break;
    case "egg":
      p.shape = SHAPES.egg; p.spoke = 0.35; p.hub = 0.92;
      p.gaze = { yaw: p.gaze.yaw - 5, pitch: p.gaze.pitch - 2, roll: p.gaze.roll - 3 }; p.split = 11.5; p.ew = [0.9, 0.9]; p.eh = [0.95, 0.95];
      break;
    case "hexagon":
      p.shape = SHAPES.hexagon; p.spoke = 0.6;
      p.gaze = { yaw: p.gaze.yaw - 3, pitch: p.gaze.pitch - 3, roll: p.gaze.roll }; p.split = 13.4; p.ew = [0.95, 0.95];
      break;
    case "play": {
      const fade = clamp(lt / 0.35) * clamp((2.2 - lt) / 0.5);
      p.shape = SHAPES.triangle; p.spoke = 0.3; p.hub = 0.85; p.dy = 0.05;
      p.gaze = { yaw: 10, pitch: -2, roll: -6 }; p.split = 15; p.ew = [0.95, 0.95]; p.eh = [0.85, 0.85];
      p.arcs = arcs(SWOOSH_W, "sw", lt, () => fade, (s) => ({ ...s, cx: 0.45 - lt * 0.42 }));
      break;
    }
    case "orbit": {
      const ramp = easings.easeInOutCubic(clamp(lt / 0.35));
      const back = easings.easeInOutCubic(clamp((lt - 1.6) / 0.9));
      p.srot = -TAU * 1.25 * lt * ramp;
      p.shape = SHAPES.triangle.map((r, i) => lerp(r, BODY[i], back)); p.spoke = 0.3 + 0.7 * back; p.hub = 0.85 + 0.15 * back;
      p.dx = 0.213 * Math.sin(p.srot) * (1 - back); p.dy = -0.213 * Math.cos(p.srot) * (1 - back) * -1;
      const fade = clamp(lt / 0.8) * clamp((3.6 - lt) / 0.9);
      p.gaze = { yaw: REST.yaw + Math.sin(lt * 6.5) * 40 * (1 - back), pitch: REST.pitch - 6 + back * 6, roll: REST.roll };
      p.arcs = arcs(RINGS_W, "rg", lt, (i) => fade * clamp((lt - i * 0.13) / 0.3));
      break;
    }
    case "swirl":
      // bloub's settings transition: half the orbit rings, short, with the eyes taking a quick look round
      p.gaze = { ...p.gaze, yaw: p.gaze.yaw + Math.sin(clamp(lt / 1.1) * TAU) * 22 };
      p.rot = easings.easeInOutCubic(clamp(lt / 1.1)) * STEP;
      p.arcs = arcs(RINGS_W.slice(0, 3), "sr", lt, (i) => clamp((lt - i * 0.06) / 0.14) * clamp((1.22 - lt) / 0.34));
      break;
    case "burst": {
      const collapse = 1 - 0.834 * easings.easeOutQuint(clamp(lt / 0.7));
      const regrow = easings.easeOutQuint(clamp((lt - 1.7) / 0.7));
      p.scale = collapse + (1 - collapse) * regrow; p.rot = lt * 1.2 * (1 - regrow);
      p.eyeAlpha = clamp((lt - 1.85) / 0.4);
      p.dots = burstParticles(lt, 1).map((d) => ({ x: d.x, y: d.y, r: d.r, o: d.opacity }));
      break;
    }
    case "comet": {
      const collapse = 1 - (1 - COMET_DOT) * easings.easeOutQuint(clamp(lt / 0.55));
      const regrow = easings.easeOutQuint(clamp((lt - 1.85) / 0.6));
      const fade = clamp((lt - 0.15) / 0.25) * clamp((1.95 - lt) / 0.3);
      p.scale = collapse + (1 - collapse) * regrow; p.dy = Math.sin(clamp(lt / 1.7) * Math.PI) * 0.035;
      p.eyeAlpha = clamp((lt - 2) / 0.35);
      p.arcs = arcs(COMET_W, "cm", lt, () => fade);
      break;
    }
    default:
      break;
  }
  return p;
}

export function blendPose(a: Pose, b: Pose, k: number): Pose {
  const l = (x: number, y: number) => lerp(x, y, k);
  const out = 1 - k;
  return {
    scale: l(a.scale, b.scale), sx: l(a.sx, b.sx), sy: l(a.sy, b.sy), dx: l(a.dx, b.dx), dy: l(a.dy, b.dy),
    rot: l(a.rot, b.rot), open: l(a.open, b.open), hub: l(a.hub, b.hub),
    shape: a.shape === b.shape ? b.shape : b.shape.map((r, i) => l(a.shape[i] ?? r, r)), srot: l(a.srot, b.srot), spoke: l(a.spoke, b.spoke),
    gaze: { yaw: l(a.gaze.yaw, b.gaze.yaw), pitch: l(a.gaze.pitch, b.gaze.pitch), roll: l(a.gaze.roll, b.gaze.roll) },
    split: l(a.split, b.split), eyeW: l(a.eyeW, b.eyeW), eyeH: l(a.eyeH, b.eyeH),
    ew: [l(a.ew[0], b.ew[0]), l(a.ew[1], b.ew[1])], eh: [l(a.eh[0], b.eh[0]), l(a.eh[1], b.eh[1])],
    lids: [l(a.lids[0], b.lids[0]), l(a.lids[1], b.lids[1])],
    tilt: [l(a.tilt[0], b.tilt[0]), l(a.tilt[1], b.tilt[1])], eyeAlpha: l(a.eyeAlpha, b.eyeAlpha),
    desat: l(a.desat, b.desat), badge: l(a.badge, b.badge), particles: b.particles,
    // decoration cross-fades in opacity, not geometry, as in bloub
    dots: [...a.dots.map((d) => ({ ...d, o: d.o * out })), ...b.dots.map((d) => ({ ...d, o: d.o * k }))],
    arcs: [...a.arcs.map((r) => ({ ...r, id: `a${r.id}`, o: r.o * out })), ...b.arcs.map((r) => ({ ...r, id: `b${r.id}`, o: r.o * k }))],
    notif: k < 0.5 ? a.notif : b.notif,
  };
}

export const FADE = 0.35;
/** Pose on screen: the new state's pose, blended from the frozen pose `from` that was on screen at the change. */
export function sample(state: MascotState, lt: number, t: number, from?: Pose, still = false, life?: Life, face?: Face): Pose {
  const to = statePose(state, still ? 30 : lt, still ? 0 : t, still, life, face);
  if (from && OCTAGONAL.has(state)) to.rot += Math.round(from.rot / STEP) * STEP;
  if (!from || still) return to;
  const morph = Math.max(FADE, STATE_INFO[state].morph);
  // a fresh copy of `from` without decoration that has already faded keeps blends from piling up
  const src = { ...from, dots: from.dots.filter((d) => d.o > 0.02), arcs: from.arcs.filter((r) => r.o > 0.02) };
  return blendPose(src, to, easings.easeOutQuint(clamp(lt / morph)));
}

/** Body radius (octagon circumradius = 1). Measured off the sketch: the body fills about 70% of the octagon width. */
export const BODY_R = 0.67;
export const NOTCH = { notch: "logo" as "v" | "logo", twist: 8, width: 1 };
export interface RenderOpts { bodyR?: number; eyeBoost?: number; notch?: "v" | "logo"; twist?: number; width?: number }

export interface Frame {
  transform: string; body: string; spokes: string[]; spoke: number; hub: number;
  eyes: { d: string; transform: string }[]; eyeAlpha: number; desat: number;
  particles: { x: number; y: number; r: number; o: number }[]; badge: number;
  dots: { x: number; y: number; r: number; o: number; d?: string; transform?: string }[];
  arcs: (ArcRender & { o: number })[];
  notif: { x: number; y: number; r: number; notch: number } | null;
}

/** SVG geometry for a pose, in a viewBox of -160..160 with circumradius 100. */
export function render(p: Pose, o: RenderOpts = {}): Frame {
  const R = 100;
  const bodyR = o.bodyR ?? BODY_R;
  const k = bodyR / 0.42;
  const eb = o.eyeBoost ?? 1;
  const body = closedPath(toPoints({ radii: p.shape, rot: p.rot + p.srot, cx: 0, cy: 0, sx: 1, sy: 1 }, R), 0.08);
  const spokes = p.spoke < 0.02 ? [] : Array.from({ length: 8 }, (_, n) => (o.notch ?? NOTCH.notch) === "logo" ? spokePath(n, p.open, p.rot, R) : notchPath(n, p.open, p.rot, R, bodyR, o.twist ?? NOTCH.twist, o.width ?? NOTCH.width));
  const poses = eyePoses(p.gaze, R * bodyR * 1.15, p.split);
  const eyes = poses.map((e, i) => {
    const bs = blinkScale(p.lids[i]);
    return {
      d: capsulePath(p.eyeW * p.ew[i] * R * k * eb, p.eyeH * p.eh[i] * R * k * eb),
      transform: `translate(${e.x.toFixed(2)} ${e.y.toFixed(2)}) scale(1 ${bs.toFixed(3)}) matrix(${e.a.toFixed(3)} ${e.b.toFixed(3)} ${e.c.toFixed(3)} ${e.d.toFixed(3)} 0 0) rotate(${p.tilt[i].toFixed(1)})`,
    };
  });
  const particles = p.particles < 0 ? [] : Array.from({ length: 8 }, (_, k) => {
    const a = -Math.PI / 2 + STEP / 2 + k * STEP + p.rot;
    const f = easings.easeOutCubic(clamp(p.particles / 0.8));
    const r = (0.95 + 0.55 * f) * R;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r, r: 9 * (1 - 0.6 * f), o: 1 - clamp((p.particles - 0.5) / 0.5) };
  });
  const dots = p.dots.filter((d) => d.o > 0.01).map((d) => ({
    x: d.x * R, y: d.y * R, r: d.r * R, o: d.o, d: d.d,
    transform: d.d ? `translate(${(d.x * R).toFixed(2)} ${(d.y * R).toFixed(2)}) rotate(${(d.rot ?? 0).toFixed(1)}) scale(${R})` : undefined,
  }));
  const arcsOut = p.arcs.filter((a) => a.o > 0.01).map((a) => ({ ...arcRender(a.seed, a.t, R, a.id, a.o), o: a.o }));
  return {
    transform: `translate(${(p.dx * R).toFixed(2)} ${(p.dy * R).toFixed(2)}) scale(${(p.scale * p.sx).toFixed(4)} ${(p.scale * p.sy).toFixed(4)})`,
    body, spokes, spoke: clamp(p.spoke), hub: p.hub * bodyR * R, eyes, eyeAlpha: p.eyeAlpha, desat: p.desat, particles, badge: p.badge,
    dots, arcs: arcsOut,
    notif: p.notif ? { x: p.notif.x * R, y: p.notif.y * R, r: p.notif.r * R, notch: (p.notif.r + NOTIF_MARGIN) * R } : null,
  };
}
