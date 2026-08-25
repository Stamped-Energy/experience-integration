/**
 * Plant section map layout helpers — pure geometry + types.
 * No fixture plant data (demo datasets stay in fixtures/plant-sections.ts).
 */

export type SectionHealth = "calm" | "watch" | "hot";

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
};

export type PlantSectionLevel = {
  id: string;
  title: string;
  subtitle: string;
  nodes: PlantSectionNode[];
  edges: Array<{ from: string; to: string; kw: number }>;
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
  for (const n of level.nodes) {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + cardW);
    maxY = Math.max(maxY, n.y + cardH);
  }
  const totalPad = pad + labelPad;
  const w = maxX - minX + totalPad * 2;
  const h = maxY - minY + totalPad * 2;
  return {
    viewBox: `${minX - totalPad} ${minY - totalPad} ${w} ${h}`,
    aspectRatio: w / h,
  };
}

export function cardAnchor(
  node: { x: number; y: number },
  toward: { x: number; y: number },
  cardW = PLANT_CARD_W,
  cardH = PLANT_CARD_H,
): { x: number; y: number } {
  const cx = node.x + cardW / 2;
  const cy = node.y + cardH / 2;
  const tx = toward.x + cardW / 2;
  const ty = toward.y + cardH / 2;
  const dx = tx - cx;
  const dy = ty - cy;
  const hw = cardW / 2 - 2;
  const hh = cardH / 2 - 2;
  if (Math.abs(dx) * hh > Math.abs(dy) * hw) {
    const sx = dx > 0 ? hw : -hw;
    const sy = dx !== 0 ? (dy / dx) * sx : 0;
    return { x: cx + sx, y: cy + sy };
  }
  const sy = dy > 0 ? hh : -hh;
  const sx = dy !== 0 ? (dx / dy) * sy : 0;
  return { x: cx + sx, y: cy + sy };
}

type FlowPoint = { x: number; y: number };

type FlowCurve =
  | {
      kind: "cubic";
      p0: FlowPoint;
      p1: FlowPoint;
      p2: FlowPoint;
      p3: FlowPoint;
      nudge?: FlowPoint;
    }
  | {
      kind: "quadratic";
      p0: FlowPoint;
      p1: FlowPoint;
      p2: FlowPoint;
      nudge?: FlowPoint;
    };

function cubicPoint(
  p0: FlowPoint,
  p1: FlowPoint,
  p2: FlowPoint,
  p3: FlowPoint,
  t: number,
): FlowPoint {
  const u = 1 - t;
  return {
    x: u ** 3 * p0.x + 3 * u ** 2 * t * p1.x + 3 * u * t ** 2 * p2.x + t ** 3 * p3.x,
    y: u ** 3 * p0.y + 3 * u ** 2 * t * p1.y + 3 * u * t ** 2 * p2.y + t ** 3 * p3.y,
  };
}

function quadraticPoint(p0: FlowPoint, p1: FlowPoint, p2: FlowPoint, t: number): FlowPoint {
  const u = 1 - t;
  return {
    x: u ** 2 * p0.x + 2 * u * t * p1.x + t ** 2 * p2.x,
    y: u ** 2 * p0.y + 2 * u * t * p1.y + t ** 2 * p2.y,
  };
}

function flowCurveBetween(from: PlantSectionNode, to: PlantSectionNode): FlowCurve {
  const start = cardAnchor(from, to);
  const end = cardAnchor(to, from);
  const mx = (start.x + end.x) / 2;
  const my = (start.y + end.y) / 2 - Math.abs(end.x - start.x) * 0.1 - 28;
  return {
    kind: "quadratic",
    p0: start,
    p1: { x: mx, y: my },
    p2: end,
  };
}

/** Curved path between two section cards, anchored at card edges. */
export function flowPathBetween(from: PlantSectionNode, to: PlantSectionNode): string {
  const curve = flowCurveBetween(from, to);
  if (curve.kind === "cubic") {
    const { p0, p1, p2, p3 } = curve;
    return `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;
  }
  const { p0, p1, p2 } = curve;
  return `M ${p0.x} ${p0.y} Q ${p1.x} ${p1.y} ${p2.x} ${p2.y}`;
}

/** Midpoint on a flow path for kW labels. */
export function flowLabelPoint(from: PlantSectionNode, to: PlantSectionNode): FlowPoint {
  const curve = flowCurveBetween(from, to);
  const point =
    curve.kind === "cubic"
      ? cubicPoint(curve.p0, curve.p1, curve.p2, curve.p3, 0.5)
      : quadraticPoint(curve.p0, curve.p1, curve.p2, 0.5);
  if (curve.nudge) {
    return { x: point.x + curve.nudge.x, y: point.y + curve.nudge.y };
  }
  return point;
}
