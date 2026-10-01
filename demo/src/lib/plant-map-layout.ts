/**
 * Plant section map layout helpers — pure geometry + types.
 * No fixture plant data (demo datasets stay in fixtures/plant-sections.ts).
 */

export type SectionHealth = "calm" | "watch" | "hot";

export type EquipmentKind =
  | "substation"
  | "transformer"
  | "capacitor"
  | "crusher"
  | "mill"
  | "kiln"
  | "tower"
  | "fan"
  | "cooler"
  | "silo"
  | "filter"
  | "boiler"
  | "turbine"
  | "solar"
  | "compressor"
  | "pump"
  | "packer"
  | "conveyor"
  | "genset"
  | "building";

export type PlantSectionNode = {
  id: string;
  name: string;
  area: string;
  kw: number;
  loadPct: number;
  health: SectionHealth;
  accent: string;
  surface: string;
  x: number;
  y: number;
  children?: PlantSectionNode[];
  flowKw?: number;
  tag?: string;
  kind?: EquipmentKind;
  voltage?: string;
  pf?: number;
  status?: "running" | "standby" | "tripped";
  runHours?: number;
};

export type FlowPoint = { x: number; y: number };

export type PlantEdge = {
  from: string;
  to: string;
  kw: number;
  kind?: "power" | "process" | "heat";
  unit?: string;
  /** Hand-routed waypoints (cable trench / conveyor gallery) between cards. */
  via?: FlowPoint[];
};

export type PlantZone = { x: number; y: number; w: number; h: number; label: string };

export type PlantFeature = {
  kind: "silo" | "stack" | "cooling_tower" | "stockpile" | "pv" | "road" | "rail" | "fence";
  x: number;
  y: number;
  w?: number;
  h?: number;
  label?: string;
};

export type PlantSectionLevel = {
  id: string;
  title: string;
  subtitle: string;
  nodes: PlantSectionNode[];
  edges: PlantEdge[];
  zones?: PlantZone[];
  features?: PlantFeature[];
};

export const PLANT_CARD_W = 248;
export const PLANT_CARD_H = 152;

export function nodeById(
  level: PlantSectionLevel,
  id: string,
): PlantSectionNode | undefined {
  return level.nodes.find((n) => n.id === id);
}

export function findNodeInLevels(
  levels: Record<string, PlantSectionLevel>,
  nodeId: string,
): PlantSectionNode | undefined {
  function walk(nodes: PlantSectionNode[]): PlantSectionNode | undefined {
    for (const n of nodes) {
      if (n.id === nodeId) return n;
      if (n.children) {
        const hit = walk(n.children);
        if (hit) return hit;
      }
    }
    return undefined;
  }
  for (const level of Object.values(levels)) {
    const hit = walk(level.nodes);
    if (hit) return hit;
  }
  return undefined;
}

export function viewBoxMetrics(
  level: PlantSectionLevel,
  pad = 52,
): { viewBox: string; aspectRatio: number } {
  const labelPad = 48;
  const cardW = PLANT_CARD_W;
  const cardH = PLANT_CARD_H;
  if (level.nodes.length === 0) {
    const w = cardW + pad * 2;
    const h = cardH + pad * 2;
    return { viewBox: `0 0 ${w} ${h}`, aspectRatio: w / h };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const grow = (x: number, y: number, w = 0, h = 0) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + w);
    maxY = Math.max(maxY, y + h);
  };
  for (const n of level.nodes) grow(n.x, n.y, cardW, cardH);
  for (const z of level.zones ?? []) grow(z.x, z.y, z.w, z.h);
  for (const f of level.features ?? []) grow(f.x, f.y, f.w ?? 0, f.h ?? 0);
  for (const e of level.edges) for (const p of e.via ?? []) grow(p.x, p.y);
  const totalPad = pad + labelPad;
  const w = maxX - minX + totalPad * 2;
  const h = maxY - minY + totalPad * 2;
  return {
    viewBox: `${minX - totalPad} ${minY - totalPad} ${w} ${h}`,
    aspectRatio: w / h,
  };
}

/** Point on the card edge facing `toward`, slid along that edge to line up with it. */
function anchorToward(node: FlowPoint, toward: FlowPoint): FlowPoint {
  const hw = PLANT_CARD_W / 2;
  const hh = PLANT_CARD_H / 2;
  const cx = node.x + hw;
  const cy = node.y + hh;
  const dx = toward.x - cx;
  const dy = toward.y - cy;
  const inset = 18;
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  if (Math.abs(dx) / hw > Math.abs(dy) / hh) {
    return {
      x: dx > 0 ? node.x + PLANT_CARD_W : node.x,
      y: clamp(toward.y, node.y + inset, node.y + PLANT_CARD_H - inset),
    };
  }
  return {
    x: clamp(toward.x, node.x + inset, node.x + PLANT_CARD_W - inset),
    y: dy > 0 ? node.y + PLANT_CARD_H : node.y,
  };
}

function center(n: FlowPoint): FlowPoint {
  return { x: n.x + PLANT_CARD_W / 2, y: n.y + PLANT_CARD_H / 2 };
}

function routePoints(from: PlantSectionNode, to: PlantSectionNode, via: FlowPoint[]): FlowPoint[] {
  const first = via[0] ?? center(to);
  const last = via[via.length - 1] ?? center(from);
  return [anchorToward(from, first), ...via, anchorToward(to, last)];
}

function roundedPolyline(pts: FlowPoint[], radius = 14): string {
  let d = `M ${pts[0]!.x} ${pts[0]!.y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1]!;
    const p = pts[i]!;
    const b = pts[i + 1]!;
    const la = Math.hypot(p.x - a.x, p.y - a.y) || 1;
    const lb = Math.hypot(b.x - p.x, b.y - p.y) || 1;
    const r = Math.min(radius, la / 2, lb / 2);
    d += ` L ${p.x - ((p.x - a.x) / la) * r} ${p.y - ((p.y - a.y) / la) * r}`;
    d += ` Q ${p.x} ${p.y} ${p.x + ((b.x - p.x) / lb) * r} ${p.y + ((b.y - p.y) / lb) * r}`;
  }
  const end = pts[pts.length - 1]!;
  return `${d} L ${end.x} ${end.y}`;
}

/** Orthogonal S-curve between facing card edges. */
function sCurve(from: PlantSectionNode, to: PlantSectionNode) {
  const p0 = anchorToward(from, center(to));
  const p3 = anchorToward(to, center(from));
  const horizontal = p0.x === from.x || p0.x === from.x + PLANT_CARD_W;
  const mx = (p0.x + p3.x) / 2;
  const my = (p0.y + p3.y) / 2;
  const p1 = horizontal ? { x: mx, y: p0.y } : { x: p0.x, y: my };
  const p2 = horizontal ? { x: mx, y: p3.y } : { x: p3.x, y: my };
  return { p0, p1, p2, p3 };
}

/** Path between two section cards, anchored at card edges. */
export function flowPathBetween(
  from: PlantSectionNode,
  to: PlantSectionNode,
  via?: FlowPoint[],
): string {
  if (via?.length) return roundedPolyline(routePoints(from, to, via));
  const { p0, p1, p2, p3 } = sCurve(from, to);
  return `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;
}

/** Midpoint (by length) on a flow path for value labels. */
export function flowLabelPoint(
  from: PlantSectionNode,
  to: PlantSectionNode,
  via?: FlowPoint[],
): FlowPoint {
  if (!via?.length) {
    const { p0, p1, p2, p3 } = sCurve(from, to);
    return {
      x: (p0.x + 3 * p1.x + 3 * p2.x + p3.x) / 8,
      y: (p0.y + 3 * p1.y + 3 * p2.y + p3.y) / 8,
    };
  }
  const pts = routePoints(from, to, via);
  const lens = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i]!.x, p.y - pts[i]!.y));
  let remaining = lens.reduce((s, l) => s + l, 0) / 2;
  for (let i = 0; i < lens.length; i++) {
    const len = lens[i]!;
    if (remaining <= len) {
      const a = pts[i]!;
      const b = pts[i + 1]!;
      const t = len ? remaining / len : 0;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    remaining -= len;
  }
  return pts[pts.length - 1]!;
}
