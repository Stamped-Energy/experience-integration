/**
 * Diagram canvas model (subset ported from PlantCraft DiagramCanvas/model, Apache-2.0).
 * See demo/third-party/plantcraft/ATTRIBUTION.md.
 */
export type State = "ok" | "warning" | "alarm" | "unknown";
export type Dir = "n" | "s" | "e" | "w";
export type Point = [number, number];

export interface Port { id: string; x: number; y: number; dir: Dir; kind?: string }
export interface SymbolDef {
  id: string;
  title: string;
  category: string;
  w: number;
  h: number;
  svg: string;
  ports: Port[];
  stretch?: boolean;
}

export type LabelPosition = "below" | "above" | "left" | "right" | "inside" | "none";

interface Base { id: string }
export interface SymbolElement extends Base {
  type: "symbol";
  symbol: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotate: 0 | 90 | 180 | 270;
  flip: boolean;
  label: string;
  label_position: LabelPosition;
  asset_id?: string | null;
}
export interface ValueElement extends Base {
  type: "value";
  x: number;
  y: number;
  label: string;
  show_label: boolean;
  show_unit: boolean;
  decimals?: number | null;
  size: number;
}
export interface LineElement extends Base {
  type: "line";
  kind: "process" | "signal" | "utility";
  medium: string;
  points: Point[];
  arrow: "none" | "end" | "start" | "both";
  label: string;
}
export interface TextElement extends Base {
  type: "text";
  x: number;
  y: number;
  text: string;
  size: number;
  align: "start" | "middle" | "end";
  bold: boolean;
}
export type Element = SymbolElement | ValueElement | LineElement | TextElement;

export interface DiagramPart {
  id: string;
  name: string;
  /** Canvas rectangle as x,y,w,h in diagram coordinates. */
  area: string;
}

export interface DiagramDraft {
  name: string;
  description: string;
  width: number;
  height: number;
  grid: number;
  elements: Element[];
  parts?: DiagramPart[];
}

export function areaOf(area: string): Box | null {
  const bits = area.split(",").map((n) => Number(n.trim()));
  if (bits.length !== 4 || bits.some((n) => !Number.isFinite(n))) return null;
  return { x: bits[0], y: bits[1], w: bits[2], h: bits[3] };
}

export type Slot = "state" | "level" | "running" | "value" | "flow";
export interface Shown {
  label?: string;
  value?: number | string | null;
  unit?: string;
  state?: State;
  error?: string | null;
  fraction?: number | null;
  on?: boolean | null;
}
export type Shows = Map<string, Partial<Record<Slot, Shown>>>;

export function formatValue(value: number | string | null | undefined, decimals?: number | null): string {
  if (value === null || value === undefined) return "n/a";
  if (typeof value === "string") return value;
  if (!Number.isFinite(value)) return "n/a";
  if (decimals !== null && decimals !== undefined) return value.toFixed(decimals);
  const size = Math.abs(value);
  return value.toFixed(size >= 1000 ? 0 : size >= 100 ? 1 : size >= 1 ? 2 : 3);
}

export interface Box { x: number; y: number; w: number; h: number }

const TURN: Record<Dir, Dir> = { n: "e", e: "s", s: "w", w: "n" };
const MIRROR: Record<Dir, Dir> = { n: "n", s: "s", e: "w", w: "e" };

export function fitted(element: { w: number; h: number }, def: { w: number; h: number; stretch?: boolean }): Box & { sx: number; sy: number } {
  if (def.stretch) return { x: 0, y: 0, w: element.w, h: element.h, sx: element.w / def.w, sy: element.h / def.h };
  const scale = Math.min(element.w / def.w, element.h / def.h);
  const w = def.w * scale;
  const h = def.h * scale;
  return { x: (element.w - w) / 2, y: (element.h - h) / 2, w, h, sx: scale, sy: scale };
}

function place(element: SymbolElement, px: number, py: number): Point {
  if (element.flip) px = element.w - px;
  const cx = element.w / 2;
  const cy = element.h / 2;
  const turns = (element.rotate / 90) % 4;
  for (let i = 0; i < turns; i += 1) [px, py] = [cx - (py - cy), cy + (px - cx)];
  return [element.x + px, element.y + py];
}

export function symbolBox(element: SymbolElement, def?: { w: number; h: number; stretch?: boolean } | null): Box {
  const local = def ? fitted(element, def) : { x: 0, y: 0, w: element.w, h: element.h };
  const a = place(element, local.x, local.y);
  const b = place(element, local.x + local.w, local.y + local.h);
  return { x: Math.min(a[0], b[0]), y: Math.min(a[1], b[1]), w: Math.abs(b[0] - a[0]), h: Math.abs(b[1] - a[1]) };
}

export function linePath(line: LineElement): Point[] {
  return line.points.map((point) => [point[0], point[1]] as Point);
}

export const ARROWS: Record<LineElement["kind"], [number, number]> = { process: [13, 5], signal: [10, 4], utility: [11, 4.5] };
export const FLOW_RUN = 220;

export interface LineDrawing { stroke: Point[]; heads: Point[][]; flows: Array<{ at: Point; angle: number }> }

export function lineDrawing(path: Point[], kind: LineElement["kind"], arrow: LineElement["arrow"]): LineDrawing {
  const [length, half] = ARROWS[kind] ?? ARROWS.process;
  const stroke = path.map((point) => [point[0], point[1]] as Point);
  const heads: Point[][] = [];
  const head = (tip: Point, from: Point, end: "start" | "end") => {
    const dx = tip[0] - from[0];
    const dy = tip[1] - from[1];
    const run = Math.hypot(dx, dy);
    if (run < 1) return;
    const ux = dx / run;
    const uy = dy / run;
    const base: Point = [tip[0] - ux * length, tip[1] - uy * length];
    heads.push([tip, [base[0] - uy * half, base[1] + ux * half], [base[0] + uy * half, base[1] - ux * half]]);
    const back = Math.min(length - 2, run);
    const cut: Point = [tip[0] - ux * back, tip[1] - uy * back];
    if (end === "end") stroke[stroke.length - 1] = cut;
    else stroke[0] = cut;
  };
  if (path.length >= 2) {
    if (arrow === "end" || arrow === "both") head(path[path.length - 1], path[path.length - 2], "end");
    if (arrow === "start" || arrow === "both") head(path[0], path[1], "start");
  }
  const flows: LineDrawing["flows"] = [];
  if (kind === "process" && (arrow === "end" || arrow === "start")) {
    for (let index = 1; index < path.length; index += 1) {
      const [a, b] = arrow === "end" ? [path[index - 1], path[index]] : [path[index], path[index - 1]];
      if (Math.hypot(b[0] - a[0], b[1] - a[1]) < FLOW_RUN) continue;
      flows.push({ at: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], angle: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI });
    }
  }
  return { stroke, heads, flows };
}

export function labelSpot(path: Point[]): { at: Point; anchor: "middle" | "start" } | null {
  let best: [Point, Point] | null = null;
  let upright: [Point, Point] | null = null;
  const run = (pair: [Point, Point] | null) => (pair ? Math.hypot(pair[1][0] - pair[0][0], pair[1][1] - pair[0][1]) : -1);
  for (let index = 1; index < path.length; index += 1) {
    const pair: [Point, Point] = [path[index - 1], path[index]];
    if (Math.abs(pair[0][0] - pair[1][0]) < Math.abs(pair[0][1] - pair[1][1])) {
      if (run(pair) > run(upright)) upright = pair;
    } else if (run(pair) > run(best)) best = pair;
  }
  if (best) return { at: [(best[0][0] + best[1][0]) / 2, (best[0][1] + best[1][1]) / 2 - 7], anchor: "middle" };
  if (upright) return { at: [Math.max(upright[0][0], upright[1][0]) + 7, (upright[0][1] + upright[1][1]) / 2], anchor: "start" };
  return null;
}

export function mediumColor(medium: string): string | undefined {
  const key = medium.trim().toLowerCase();
  const map: Record<string, string> = {
    process: "var(--text-secondary)",
    product: "var(--accent)",
    oil: "var(--warning)",
    air: "var(--info)",
    water: "var(--info)",
  };
  return map[key];
}
