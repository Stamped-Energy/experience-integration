/** Plant section hierarchy for drill-down flow map - Jaipur Works. */

export type SectionHealth = "calm" | "watch" | "hot";

export type PlantSectionNode = {
  id: string;
  name: string;
  area: string;
  kw: number;
  loadPct: number;
  health: SectionHealth;
  /** Card accent (border + flow line). */
  accent: string;
  /** Card fill - soft pastel. */
  surface: string;
  x: number;
  y: number;
  children?: PlantSectionNode[];
  /** Parent → child energy transfer kW (shown on connectors). */
  flowKw?: number;
};

export type PlantSectionLevel = {
  id: string;
  title: string;
  subtitle: string;
  nodes: PlantSectionNode[];
  /** directed edges as [fromId, toId] within this level */
  edges: Array<{ from: string; to: string; kw: number }>;
};

export const PLANT_CARD_W = 248;
export const PLANT_CARD_H = 152;

const PYRO_CHILDREN: PlantSectionNode[] = [
  {
    id: "kiln_1",
    name: "Kiln 1",
    area: "Rotary kiln",
    kw: 286,
    loadPct: 108,
    health: "hot",
    accent: "#e85a4a",
    surface: "#fff0ed",
    x: 372,
    y: 28,
    flowKw: 290,
  },
  {
    id: "preheater",
    name: "Preheater fan",
    area: "Pyro preheat",
    kw: 74,
    loadPct: 96,
    health: "watch",
    accent: "#d4a017",
    surface: "#fff8e8",
    x: 48,
    y: 360,
    flowKw: 76,
  },
  {
    id: "cooler",
    name: "Grate cooler",
    area: "Clinker cooling",
    kw: 52,
    loadPct: 82,
    health: "calm",
    accent: "#3d9a8a",
    surface: "#ecf8f5",
    x: 688,
    y: 360,
    flowKw: 52,
  },
];

const GRIND_CHILDREN: PlantSectionNode[] = [
  {
    id: "cm_1",
    name: "Cement Mill 1",
    area: "Finish grinding",
    kw: 58.2,
    loadPct: 112,
    health: "hot",
    accent: "#e85a4a",
    surface: "#fff0ed",
    x: 48,
    y: 28,
    flowKw: 60,
  },
  {
    id: "mill_2",
    name: "Raw Mill 2",
    area: "Raw grinding",
    kw: 40.2,
    loadPct: 72,
    health: "calm",
    accent: "#3d9a8a",
    surface: "#ecf8f5",
    x: 688,
    y: 28,
    flowKw: 42,
  },
  {
    id: "raw_mill_a",
    name: "Raw Mill A",
    area: "Raw grinding",
    kw: 38,
    loadPct: 97,
    health: "watch",
    accent: "#d4a017",
    surface: "#fff8e8",
    x: 372,
    y: 360,
    flowKw: 40,
  },
];

const UTIL_CHILDREN: PlantSectionNode[] = [
  {
    id: "comp_2",
    name: "Compressor 2",
    area: "Instrument air",
    kw: 14.67,
    loadPct: 54,
    health: "calm",
    accent: "#3d9a8a",
    surface: "#ecf8f5",
    x: 48,
    y: 360,
    flowKw: 15,
  },
  {
    id: "pack_1",
    name: "Packing line 1",
    area: "Dispatch",
    kw: 9.1,
    loadPct: 41,
    health: "calm",
    accent: "#7a9eb8",
    surface: "#eef4f8",
    x: 372,
    y: 28,
    flowKw: 9.2,
  },
  {
    id: "hvac_admin",
    name: "Admin HVAC",
    area: "Buildings",
    kw: 6.63,
    loadPct: 38,
    health: "calm",
    accent: "#9a8bb8",
    surface: "#f3f0f8",
    x: 688,
    y: 360,
    flowKw: 6.8,
  },
];

const POWER_CHILDREN: PlantSectionNode[] = [
  {
    id: "eb_incomer",
    name: "EB Incomer",
    area: "11 kV incomer",
    kw: 863,
    loadPct: 94,
    health: "watch",
    accent: "#f75440",
    surface: "#fff3f0",
    x: 372,
    y: 28,
    flowKw: 863,
  },
  {
    id: "utility_incomer",
    name: "Utility Incomer",
    area: "LT bus",
    kw: 322,
    loadPct: 88,
    health: "calm",
    accent: "#3d9a8a",
    surface: "#ecf8f5",
    x: 48,
    y: 360,
    flowKw: 324,
  },
  {
    id: "solar_array",
    name: "Solar Array",
    area: "Rooftop PV",
    kw: 280,
    loadPct: 40,
    health: "calm",
    accent: "#4db8c4",
    surface: "#e8f7f9",
    x: 688,
    y: 360,
    flowKw: 280,
  },
];

/** Top-level factory sections - click any to drill in. */
export const PLANT_ROOT_LEVEL: PlantSectionLevel = {
  id: "root",
  title: "Jaipur Works",
  subtitle: "Factory floor map · 5 production zones · click a zone to explore equipment",
  nodes: [
    {
      id: "section_power",
      name: "Electrical Yard",
      area: "Substation & solar tie-in",
      kw: 863,
      loadPct: 94,
      health: "watch",
      accent: "#f75440",
      surface: "#fff3f0",
      x: 20,
      y: 340,
      children: POWER_CHILDREN,
    },
    {
      id: "section_pyro",
      name: "Kiln Line",
      area: "Clinker production hall",
      kw: 412,
      loadPct: 108,
      health: "hot",
      accent: "#e85a4a",
      surface: "#fff0ed",
      x: 400,
      y: 24,
      children: PYRO_CHILDREN,
    },
    {
      id: "section_grind",
      name: "Grinding Hall",
      area: "Raw & finish mills",
      kw: 98.4,
      loadPct: 112,
      health: "hot",
      accent: "#c97a00",
      surface: "#fff8ee",
      x: 820,
      y: 24,
      children: GRIND_CHILDREN,
    },
    {
      id: "section_util",
      name: "Utilities & Packing",
      area: "Instrument air · HVAC · bagging",
      kw: 30.4,
      loadPct: 54,
      health: "calm",
      accent: "#3d9a8a",
      surface: "#ecf8f5",
      x: 400,
      y: 560,
      children: UTIL_CHILDREN,
    },
    {
      id: "section_dispatch",
      name: "Dispatch & Stores",
      area: "Outbound logistics bay",
      kw: 18,
      loadPct: 41,
      health: "calm",
      accent: "#7a9eb8",
      surface: "#eef4f8",
      x: 1140,
      y: 340,
    },
  ],
  edges: [
    { from: "section_power", to: "section_pyro", kw: 418 },
    { from: "section_pyro", to: "section_grind", kw: 102 },
    { from: "section_power", to: "section_util", kw: 31 },
    { from: "section_grind", to: "section_dispatch", kw: 18 },
    { from: "section_util", to: "section_dispatch", kw: 9 },
  ],
};

export const PLANT_LEVELS: Record<string, PlantSectionLevel> = {
  root: PLANT_ROOT_LEVEL,
  section_power: {
    id: "section_power",
    title: "Electrical Yard",
    subtitle: "11 kV incomer · LT buses · rooftop solar",
    nodes: POWER_CHILDREN,
    edges: [
      { from: "solar_array", to: "eb_incomer", kw: 280 },
      { from: "eb_incomer", to: "utility_incomer", kw: 324 },
    ],
  },
  section_pyro: {
    id: "section_pyro",
    title: "Kiln Line",
    subtitle: "Rotary kiln · preheater · cooler · 412 kW zone load",
    nodes: PYRO_CHILDREN,
    edges: [
      { from: "kiln_1", to: "preheater", kw: 76 },
      { from: "kiln_1", to: "cooler", kw: 52 },
    ],
  },
  section_grind: {
    id: "section_grind",
    title: "Grinding Hall",
    subtitle: "Cement & raw mills · PF watch on CM1",
    nodes: GRIND_CHILDREN,
    edges: [
      { from: "cm_1", to: "raw_mill_a", kw: 40 },
      { from: "mill_2", to: "raw_mill_a", kw: 20 },
    ],
  },
  section_util: {
    id: "section_util",
    title: "Utilities & Packing",
    subtitle: "Compressors · HVAC · packing line",
    nodes: UTIL_CHILDREN,
    edges: [
      { from: "comp_2", to: "pack_1", kw: 9 },
      { from: "comp_2", to: "hvac_admin", kw: 7 },
    ],
  },
};

export function levelForNode(nodeId: string): PlantSectionLevel | undefined {
  if (nodeId === "root") return PLANT_ROOT_LEVEL;
  return PLANT_LEVELS[nodeId];
}

export function findSectionNode(nodeId: string): PlantSectionNode | undefined {
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
  return walk(PLANT_ROOT_LEVEL.nodes);
}

export function nodeById(level: PlantSectionLevel, id: string): PlantSectionNode | undefined {
  return level.nodes.find((n) => n.id === id);
}

const CARD_W = PLANT_CARD_W;
const CARD_H = PLANT_CARD_H;

/** Fit SVG viewBox to all nodes in a level with padding for labels and pulse rings. */
export function viewBoxForLevel(level: PlantSectionLevel, pad = 52): string {
  return viewBoxMetrics(level, pad).viewBox;
}

export function viewBoxMetrics(level: PlantSectionLevel, pad = 52): { viewBox: string; aspectRatio: number } {
  const labelPad = 48;
  if (level.nodes.length === 0) {
    const w = CARD_W + pad * 2;
    const h = CARD_H + pad * 2;
    return { viewBox: `0 0 ${w} ${h}`, aspectRatio: w / h };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of level.nodes) {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + CARD_W);
    maxY = Math.max(maxY, n.y + CARD_H);
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
  | { kind: "cubic"; p0: FlowPoint; p1: FlowPoint; p2: FlowPoint; p3: FlowPoint; nudge?: FlowPoint }
  | { kind: "quadratic"; p0: FlowPoint; p1: FlowPoint; p2: FlowPoint; nudge?: FlowPoint };

function cubicPoint(p0: FlowPoint, p1: FlowPoint, p2: FlowPoint, p3: FlowPoint, t: number): FlowPoint {
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
  const rootRoute = `${from.id}-${to.id}`;

  // The overview is a fixed composition, so routes are intentionally designed
  // rather than allowing a generic diagonal to cut through another section.
  if (rootRoute === "section_power-section_pyro") {
    return {
      kind: "cubic",
      p0: start,
      p1: { x: start.x + 80, y: start.y - 44 },
      p2: { x: end.x - 92, y: end.y + 58 },
      p3: end,
      nudge: { x: -18, y: -12 },
    };
  }
  if (rootRoute === "section_pyro-section_grind") {
    const y = Math.round((start.y + end.y) / 2);
    return {
      kind: "cubic",
      p0: start,
      p1: { x: start.x + 68, y },
      p2: { x: end.x - 68, y },
      p3: end,
      nudge: { x: 0, y: -20 },
    };
  }
  if (rootRoute === "section_power-section_util") {
    return {
      kind: "cubic",
      p0: start,
      p1: { x: start.x + 90, y: start.y + 48 },
      p2: { x: end.x - 98, y: end.y - 58 },
      p3: end,
      nudge: { x: 22, y: 10 },
    };
  }
  if (rootRoute === "section_grind-section_dispatch") {
    return {
      kind: "cubic",
      p0: start,
      p1: { x: start.x + 92, y: start.y + 58 },
      p2: { x: end.x - 80, y: end.y - 44 },
      p3: end,
      nudge: { x: 10, y: 14 },
    };
  }
  if (rootRoute === "section_util-section_dispatch") {
    return {
      kind: "cubic",
      p0: start,
      p1: { x: start.x + 168, y: start.y + 30 },
      p2: { x: end.x - 182, y: end.y + 72 },
      p3: end,
      nudge: { x: 0, y: 16 },
    };
  }

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

/** Midpoint on a flow path for kW labels - nudged into open corridors. */
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

export function bezierPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  cardW = PLANT_CARD_W,
  cardH = PLANT_CARD_H,
): string {
  const sx = x1 + cardW / 2;
  const sy = y1 + cardH / 2;
  const ex = x2 + cardW / 2;
  const ey = y2 + cardH / 2;
  const mx = (sx + ex) / 2;
  const my = (sy + ey) / 2 - Math.abs(ex - sx) * 0.08 - 20;
  return `M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`;
}
