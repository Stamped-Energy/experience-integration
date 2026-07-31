/** Jaipur Works - animated plant flow topology (2D flowchart twin). */

export type FlowNodeStatus = "SOURCE" | "CRITICAL" | "WARNING" | "GOOD" | "RENEWABLE";

export type PlantFlowNode = {
  id: string;
  name: string;
  x: number;
  y: number;
  kw: number;
  loadPct: number;
  status: FlowNodeStatus;
  area: string;
};

export type PlantFlowEdge = {
  id: string;
  from: string;
  to: string;
  status: Exclude<FlowNodeStatus, "SOURCE">;
  kw: number;
  label?: string;
};

export const FLOW_COLORS: Record<FlowNodeStatus, string> = {
  SOURCE: "#ffb4a8",
  CRITICAL: "#ff5a45",
  WARNING: "#f0a500",
  GOOD: "#19c37d",
  RENEWABLE: "#37c8d6",
};

export const NODE_COLORS: Record<FlowNodeStatus, string> = {
  SOURCE: "#f75440",
  CRITICAL: "#ba1a1a",
  WARNING: "#c97a00",
  GOOD: "#00666b",
  RENEWABLE: "#0d8b94",
};

/** Positions tuned for 900×520 viewBox - left-to-right energy routing. */
export const PLANT_FLOW_NODES: PlantFlowNode[] = [
  { id: "grid", name: "Grid Substation", x: 96, y: 260, kw: 4680, loadPct: 94, status: "SOURCE", area: "Power" },
  { id: "solar", name: "Solar Array", x: 96, y: 88, kw: 280, loadPct: 40, status: "RENEWABLE", area: "Renewables" },
  { id: "kiln", name: "Kiln Line", x: 310, y: 118, kw: 2860, loadPct: 108, status: "CRITICAL", area: "Pyro" },
  { id: "rawmill", name: "Raw Grinding", x: 310, y: 402, kw: 890, loadPct: 97, status: "WARNING", area: "Grinding" },
  { id: "cementmill", name: "Cement Grinding", x: 540, y: 118, kw: 2340, loadPct: 112, status: "CRITICAL", area: "Grinding" },
  { id: "utilities", name: "Utilities Block", x: 540, y: 402, kw: 640, loadPct: 96, status: "WARNING", area: "Utilities" },
  { id: "packing", name: "Packing Plant", x: 780, y: 260, kw: 420, loadPct: 41, status: "GOOD", area: "Dispatch" },
  { id: "control", name: "Control Room", x: 780, y: 88, kw: 45, loadPct: 30, status: "GOOD", area: "Operations" },
];

export const PLANT_FLOW_EDGES: PlantFlowEdge[] = [
  { id: "f1", from: "grid", to: "kiln", status: "CRITICAL", kw: 2860, label: "11 kV feeder A" },
  { id: "f2", from: "grid", to: "cementmill", status: "CRITICAL", kw: 2340, label: "11 kV feeder B" },
  { id: "f3", from: "grid", to: "rawmill", status: "WARNING", kw: 890, label: "LT bus 2" },
  { id: "f4", from: "grid", to: "utilities", status: "WARNING", kw: 640, label: "LT bus 3" },
  { id: "f5", from: "solar", to: "utilities", status: "RENEWABLE", kw: 280, label: "Rooftop tie-in" },
  { id: "f6", from: "utilities", to: "packing", status: "GOOD", kw: 420, label: "Instrument air + conveyors" },
  { id: "f7", from: "kiln", to: "control", status: "GOOD", kw: 45, label: "Telemetry / SCADA" },
  { id: "f8", from: "cementmill", to: "packing", status: "GOOD", kw: 180, label: "Product transfer line" },
];

export const PLANT_FLOW_SUMMARY =
  "2 critical feeds (Kiln, Cement Grinding) · 9% load served by solar · AI shifting 280 kW off-peak";

export const PLANT_FLOW_LEGEND: Array<[string, FlowNodeStatus]> = [
  ["Critical flow", "CRITICAL"],
  ["Warning flow", "WARNING"],
  ["Healthy flow", "GOOD"],
  ["Renewable flow", "RENEWABLE"],
];

export const plantFlowNodeById = Object.fromEntries(
  PLANT_FLOW_NODES.map((n) => [n.id, n]),
) as Record<string, PlantFlowNode>;

/** Quadratic bezier between two node centres - arc rises with distance. */
export function flowBezierPath(from: PlantFlowNode, to: PlantFlowNode): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const cx = from.x + dx * 0.5;
  const cy = from.y + dy * 0.5 - Math.abs(dx) * 0.12 - Math.abs(dy) * 0.08 - 24;
  return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
}

export function flowDurationSec(status: PlantFlowEdge["status"]): number {
  switch (status) {
    case "CRITICAL":
      return 1.6;
    case "WARNING":
      return 2.2;
    case "RENEWABLE":
      return 2.8;
    default:
      return 3.2;
  }
}

export function flowParticleCount(status: PlantFlowEdge["status"]): number {
  return status === "CRITICAL" ? 5 : status === "WARNING" ? 4 : 3;
}
