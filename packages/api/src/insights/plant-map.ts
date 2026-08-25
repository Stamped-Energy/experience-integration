/**
 * Plant map DTO — PlantSectionMap-compatible tree with hierarchical auto-layout.
 * Positions are derived (no L2 geometry); kw/load/health from live power when present.
 */
import type { L2QueryClient } from "../upstream/l2/client.js";

export type SectionHealth = "calm" | "watch" | "hot";

export type PlantMapNode = {
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
  children?: PlantMapNode[];
  flowKw?: number;
  assetId?: string;
};

export type PlantMapLevel = {
  id: string;
  title: string;
  subtitle: string;
  nodes: PlantMapNode[];
  edges: Array<{ from: string; to: string; kw: number }>;
};

export type PlantMapDto = {
  plantId: string;
  source: "l2" | "unavailable";
  generatedAt: string;
  detail: string | null;
  derivedNotes: string[];
  rootLevelId: string;
  levels: Record<string, PlantMapLevel>;
};

const CARD_W = 248;
const CARD_H = 152;
const GAP_X = 80;
const GAP_Y = 100;

const HEALTH_STYLE: Record<
  SectionHealth,
  { accent: string; surface: string }
> = {
  calm: { accent: "#3d9a8a", surface: "#ecf8f5" },
  watch: { accent: "#d4a017", surface: "#fff8e8" },
  hot: { accent: "#e85a4a", surface: "#fff0ed" },
};

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) {
    return Number(v);
  }
  return null;
}

function healthFromLoad(loadPct: number): SectionHealth {
  if (loadPct >= 95) return "hot";
  if (loadPct >= 80) return "watch";
  return "calm";
}

/** Grid layout for siblings — exported for unit tests. */
export function layoutNodes(
  items: Array<Omit<PlantMapNode, "x" | "y" | "accent" | "surface" | "health"> & {
    loadPct: number;
    health?: SectionHealth;
  }>,
): PlantMapNode[] {
  const cols = Math.min(3, Math.max(1, items.length));
  return items.map((item, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const health = item.health ?? healthFromLoad(item.loadPct);
    const style = HEALTH_STYLE[health];
    return {
      ...item,
      health,
      accent: style.accent,
      surface: style.surface,
      x: 48 + col * (CARD_W + GAP_X),
      y: 28 + row * (CARD_H + GAP_Y),
    };
  });
}

type RawNode = {
  id: string;
  name: string;
  children: RawNode[];
  assetId?: string;
};

function walkGraph(node: unknown, fallbackId: string): RawNode | null {
  if (!node || typeof node !== "object") return null;
  const n = node as Record<string, unknown>;
  const id = String(n.id ?? n.asset_id ?? n.node_id ?? fallbackId);
  const name = String(n.name ?? n.label ?? id);
  const assetId =
    n.asset_id != null
      ? String(n.asset_id)
      : n.assetId != null
        ? String(n.assetId)
        : undefined;
  const childRaw =
    (n.children as unknown[] | undefined) ??
    (n.nodes as unknown[] | undefined) ??
    (n.sections as unknown[] | undefined) ??
    [];
  const children: RawNode[] = [];
  childRaw.forEach((c, i) => {
    const parsed = walkGraph(c, `${id}_c${i}`);
    if (parsed) children.push(parsed);
  });
  return { id, name, children, assetId };
}

function assetsAsTree(
  assets: Array<{ asset_id: string; name: string; level?: string }>,
): RawNode {
  // Flat list → synthetic root with all assets as children (no parent_id on L2 AssetSchema).
  return {
    id: "plant_root",
    name: "Plant",
    children: assets.map((a) => ({
      id: a.asset_id,
      name: a.name,
      assetId: a.asset_id,
      children: [],
    })),
  };
}

export async function buildPlantMap(input: {
  plantId: string;
  l2: L2QueryClient | null;
}): Promise<PlantMapDto> {
  const generatedAt = new Date().toISOString();
  if (!input.l2) {
    return {
      plantId: input.plantId,
      source: "unavailable",
      generatedAt,
      detail: "L2 client not configured",
      derivedNotes: [],
      rootLevelId: "root",
      levels: {},
    };
  }

  const derivedNotes = [
    "Card positions are auto-laid out (L2 has hierarchy, not CAD geometry).",
  ];
  let root: RawNode | null = null;

  try {
    const graph = await input.l2.getDepartmentGraph(input.plantId);
    const candidate =
      graph.root ??
      graph.plant ??
      graph.tree ??
      graph.departments ??
      graph;
    root = walkGraph(candidate, "plant_root");
    if (root && root.children.length === 0 && !Array.isArray(graph.children)) {
      // Sometimes the payload is { departments: [...] } already walked poorly
      const deps = graph.departments ?? graph.sections;
      if (Array.isArray(deps) && deps.length) {
        root = {
          id: "plant_root",
          name: String(graph.name ?? "Plant"),
          children: deps
            .map((d, i) => walkGraph(d, `dept_${i}`))
            .filter((x): x is RawNode => Boolean(x)),
        };
      }
    }
  } catch {
    /* fall through to assets */
  }

  if (!root || (root.children.length === 0 && !root.assetId)) {
    try {
      const assets = await input.l2.listAssets(input.plantId);
      root = assetsAsTree(
        assets.items.map((a) => ({
          asset_id: a.asset_id,
          name: a.name,
          level: a.level,
        })),
      );
      derivedNotes.push("Map built from flat L2 asset list (department-graph empty).");
    } catch (err) {
      return {
        plantId: input.plantId,
        source: "unavailable",
        generatedAt,
        detail: err instanceof Error ? err.message : "assets unavailable",
        derivedNotes,
        rootLevelId: "root",
        levels: {},
      };
    }
  }

  const to = new Date();
  const from = new Date(to.getTime() - 2 * 3600_000);
  const powerByAsset = new Map<string, number>();

  async function fetchKw(assetId: string): Promise<number> {
    if (powerByAsset.has(assetId)) return powerByAsset.get(assetId)!;
    try {
      const meas = await input.l2!.listMeasurements({
        plantId: input.plantId,
        assetId,
        metric: "active_power_kw",
        from: from.toISOString(),
        to: to.toISOString(),
        granularity: "raw",
      });
      const last = meas.points[meas.points.length - 1];
      const kw = last ? Math.max(0, last.value) : 0;
      powerByAsset.set(assetId, kw);
      return kw;
    } catch {
      powerByAsset.set(assetId, 0);
      return 0;
    }
  }

  // Prefetch common Vinayak assets
  for (const id of [
    "incomer_1",
    "feeder_a",
    "feeder_b",
    "compressor_1",
    "furnace_1",
    "hvac_1",
    "line_1",
    "pump_cw_12",
    "plant_root",
  ]) {
    await fetchKw(id);
  }

  const levels: Record<string, PlantMapLevel> = {};

  async function materialize(
    raw: RawNode,
    levelId: string,
    title: string,
    subtitle: string,
  ): Promise<PlantMapNode[]> {
    const drafts = [];
    for (const child of raw.children.length ? raw.children : [raw]) {
      const assetKey = child.assetId ?? child.id;
      const kw = await fetchKw(assetKey);
      // Nominal capacity guess for load % — Vinayak feeders ~2–3 MW class; use max(kw, 50) floor
      const capacity = Math.max(kw * 1.15, 80);
      const loadPct = Math.min(120, Math.round((kw / capacity) * 100));
      drafts.push({
        id: child.id,
        name: child.name,
        area: child.assetId ? `Asset ${child.assetId}` : "Section",
        kw: Math.round(kw * 10) / 10,
        loadPct,
        flowKw: Math.round(kw),
        assetId: child.assetId ?? child.id,
        children: child.children.length
          ? undefined // children live in drill-down levels
          : undefined,
      });
      if (child.children.length > 0) {
        const childLevelId = child.id;
        const childNodes = await materialize(
          child,
          childLevelId,
          child.name,
          `${child.children.length} children · live power`,
        );
        levels[childLevelId] = {
          id: childLevelId,
          title: child.name,
          subtitle: `${child.children.length} nodes · auto-layout`,
          nodes: childNodes,
          edges: childNodes.slice(1).map((n) => ({
            from: childNodes[0]!.id,
            to: n.id,
            kw: n.flowKw ?? n.kw,
          })),
        };
      }
    }
    const nodes = layoutNodes(drafts);
    levels[levelId] = {
      id: levelId,
      title,
      subtitle,
      nodes,
      edges:
        nodes.length > 1
          ? nodes.slice(1).map((n) => ({
              from: nodes[0]!.id,
              to: n.id,
              kw: n.flowKw ?? n.kw,
            }))
          : [],
    };
    return nodes;
  }

  await materialize(root, "root", root.name || "Plant", "Live hierarchy · auto-layout");

  // Attach drill targets: nodes that have a levels[id] get children stub for UI
  for (const level of Object.values(levels)) {
    for (const node of level.nodes) {
      if (levels[node.id] && node.id !== level.id) {
        node.children = levels[node.id]!.nodes;
      }
    }
  }

  const hasNodes = Object.values(levels).some((l) => l.nodes.length > 0);
  return {
    plantId: input.plantId,
    source: hasNodes ? "l2" : "unavailable",
    generatedAt,
    detail: hasNodes ? null : "No department graph or assets",
    derivedNotes,
    rootLevelId: "root",
    levels,
  };
}
