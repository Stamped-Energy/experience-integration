/** Forging line PFD fixture (demonstration data only). */
import type { DiagramDraft, Element, Shows, Shown, State } from "./model";

export interface EquipmentDetail {
  id: string;
  title: string;
  assetHref: string;
  loops: { id: string; label: string; href: string }[];
  summary: string;
  tags: { label: string; value: string; unit?: string; state: State }[];
}

export const FORGING_EQUIPMENT: Record<string, EquipmentDetail> = {
  "eq-induction": {
    id: "eq-induction",
    title: "Induction billet heater",
    assetHref: "/plant/assets/b-induction",
    summary: "Billet heat before press. Agent sim running on power and line speed (demo).",
    loops: [
      { id: "loop-forge-induction", label: "Power / line speed", href: "/process/simulations?campaign=camp-p-sim-induction" },
      { id: "loop-induction-zone1", label: "Zone 1 temperature", href: "/process/optimisation?loop=loop-induction-zone1" },
    ],
    tags: [
      { label: "Billet temp", value: "1182", unit: "°C", state: "ok" },
      { label: "Line speed", value: "0.42", unit: "m/s", state: "ok" },
      { label: "kW", value: "640", unit: "kW", state: "warning" },
    ],
  },
  "eq-press": {
    id: "eq-press",
    title: "Press P3",
    assetHref: "/plant/assets/b-press",
    summary: "Cavity 2 weight high; hold pressure loop has a simulation candidate ready.",
    loops: [
      { id: "loop-press-barrel-temp", label: "Barrel zones 1–3", href: "/process/optimisation?loop=loop-press-barrel-temp" },
      { id: "loop-press-hold", label: "Hold pressure", href: "/process/simulations?campaign=camp-p-sim-1" },
      { id: "loop-press-tonnage", label: "Press tonnage", href: "/process/optimisation?loop=loop-press-tonnage" },
    ],
    tags: [
      { label: "Tonnage", value: "4200", unit: "kN", state: "ok" },
      { label: "Hold", value: "612", unit: "bar", state: "warning" },
      { label: "Cavity 2 wt", value: "738", unit: "g", state: "alarm" },
    ],
  },
  "eq-furnace": {
    id: "eq-furnace",
    title: "Batch furnace",
    assetHref: "/process/line",
    summary: "Three zones plus soak timer. Zone 2 soak short on last batch (demo).",
    loops: [
      { id: "loop-ht-zone1", label: "Zone 1", href: "/process/optimisation?loop=loop-ht-zone1" },
      { id: "loop-ht-zone2", label: "Zone 2 soak", href: "/process/simulations?campaign=camp-p-sim-2" },
      { id: "loop-ht-zone3", label: "Zone 3", href: "/process/optimisation?loop=loop-ht-zone3" },
    ],
    tags: [
      { label: "Z1", value: "845", unit: "°C", state: "ok" },
      { label: "Z2", value: "902", unit: "°C", state: "warning" },
      { label: "Z3", value: "860", unit: "°C", state: "ok" },
    ],
  },
  "eq-ht": {
    id: "eq-ht",
    title: "Heat treatment line",
    assetHref: "/process/line",
    summary: "Quench and temper sequence with oil temperature loop.",
    loops: [
      { id: "loop-ht-quench", label: "Quench oil temp", href: "/process/optimisation?loop=loop-ht-quench" },
      { id: "loop-ht-temper", label: "Temper soak", href: "/process/optimisation?loop=loop-ht-temper" },
    ],
    tags: [
      { label: "Quench", value: "61", unit: "°C", state: "ok" },
      { label: "Temper", value: "425", unit: "°C", state: "ok" },
    ],
  },
  "eq-machine": {
    id: "eq-machine",
    title: "Machining cell M4",
    assetHref: "/plant/assets/b-cnc",
    summary: "Cycle stable; spindle load loop in normal band (demo).",
    loops: [{ id: "loop-cnc-spindle", label: "Spindle load", href: "/process/optimisation?loop=loop-cnc-spindle" }],
    tags: [
      { label: "Cycle", value: "4.2", unit: "min", state: "ok" },
      { label: "Spindle", value: "78", unit: "%", state: "ok" },
    ],
  },
  "eq-insp": {
    id: "eq-insp",
    title: "Final inspection",
    assetHref: "/quality/lots/lot-a-3307",
    summary: "Hardness sampling and dimensional check (demo quality loops).",
    loops: [{ id: "loop-qc-sample", label: "Sampling plan", href: "/quality/simulations?campaign=camp-q-sim-1" }],
    tags: [
      { label: "Pass rate", value: "98.2", unit: "%", state: "ok" },
      { label: "Hardness lag", value: "2.1", unit: "h", state: "warning" },
    ],
  },
};

const sym = (
  id: string,
  symbol: string,
  x: number,
  y: number,
  label: string,
  asset_id: string,
  w = 100,
  h = 60,
): Element => ({
  type: "symbol",
  id,
  symbol,
  x,
  y,
  w,
  h,
  rotate: 0,
  flip: false,
  label,
  label_position: "below",
  asset_id,
});

const val = (id: string, x: number, y: number, label: string, decimals: number): Element => ({
  type: "value",
  id,
  x,
  y,
  label,
  show_label: true,
  show_unit: true,
  decimals,
  size: 11,
});

const line = (id: string, points: [number, number][], medium = "product"): Element => ({
  type: "line",
  id,
  kind: "process",
  medium,
  points,
  arrow: "end",
  label: "",
});

export const forgingLineDiagram: DiagramDraft = {
  name: "Press line B · forging flow",
  description: "Demonstration PFD · forging sequence",
  width: 1180,
  height: 380,
  grid: 10,
  elements: [
    { type: "text", id: "title", x: 24, y: 28, text: "Press line B · forging (demo data)", size: 14, align: "start", bold: true },
    sym("eq-induction", "forge.induction", 40, 120, "Induction", "eq-induction", 100, 60),
    sym("eq-press", "forge.press", 200, 110, "Press P3", "eq-press", 100, 70),
    sym("eq-furnace", "forge.furnace", 360, 100, "Furnace", "eq-furnace", 90, 80),
    sym("eq-ht", "forge.ht", 520, 120, "Heat treat", "eq-ht"),
    sym("eq-machine", "forge.machine", 680, 120, "Machining", "eq-machine"),
    sym("eq-insp", "forge.inspect", 840, 125, "Inspection", "eq-insp", 90, 60),
    val("v-induction", 48, 88, "Billet", 0),
    val("v-press", 208, 78, "Hold", 0),
    val("v-furnace", 368, 68, "Z2", 0),
    val("v-quench", 528, 88, "Quench", 0),
    val("v-cycle", 688, 88, "Cycle", 1),
    line("ln-1", [
      [140, 150],
      [200, 145],
    ]),
    line("ln-2", [
      [300, 145],
      [360, 140],
    ]),
    line("ln-3", [
      [450, 140],
      [520, 150],
    ]),
    line("ln-4", [
      [620, 150],
      [680, 150],
    ]),
    line("ln-5", [
      [780, 150],
      [840, 150],
    ]),
    {
      type: "line",
      id: "ln-util-air",
      kind: "utility",
      medium: "air",
      points: [
        [220, 260],
        [220, 200],
        [250, 200],
      ],
      arrow: "end",
      label: "Plant air",
    },
    {
      type: "line",
      id: "ln-util-water",
      kind: "utility",
      medium: "water",
      points: [
        [560, 260],
        [560, 180],
        [540, 180],
      ],
      arrow: "end",
      label: "Cooling",
    },
  ],
};

function stateSlot(state: State): Partial<Record<"state" | "running" | "level" | "value" | "flow", Shown>> {
  return { state: { state, label: "State" } };
}

export function forgingLineShows(): Shows {
  const m = new Map<string, Partial<Record<"state" | "running" | "level" | "value" | "flow", Shown>>>();
  m.set("eq-induction", { ...stateSlot("ok"), running: { on: true, label: "Heating" }, level: { fraction: 0.72, label: "Load" } });
  m.set("eq-press", { ...stateSlot("alarm"), running: { on: true, label: "Running" } });
  m.set("eq-furnace", { ...stateSlot("warning"), level: { fraction: 0.55, label: "Charge" } });
  m.set("eq-ht", { ...stateSlot("ok"), running: { on: true, label: "Sequence" } });
  m.set("eq-machine", { ...stateSlot("ok"), running: { on: true, label: "Cycle" } });
  m.set("eq-insp", { ...stateSlot("warning") });
  m.set("v-induction", { value: { value: 1182, unit: "°C", state: "ok", label: "Billet" } });
  m.set("v-press", { value: { value: 612, unit: "bar", state: "warning", label: "Hold" } });
  m.set("v-furnace", { value: { value: 902, unit: "°C", state: "warning", label: "Z2" } });
  m.set("v-quench", { value: { value: 61, unit: "°C", state: "ok", label: "Quench" } });
  m.set("v-cycle", { value: { value: 4.2, unit: "min", state: "ok", label: "Cycle" } });
  m.set("ln-1", { flow: { on: true, label: "Billets" } });
  m.set("ln-2", { flow: { on: true, label: "Forgings" } });
  m.set("ln-3", { flow: { on: true, label: "Charge" } });
  m.set("ln-4", { flow: { on: true, label: "Parts" } });
  m.set("ln-5", { flow: { on: true, label: "Parts" } });
  m.set("ln-util-air", { flow: { on: true, label: "Air" } });
  m.set("ln-util-water", { flow: { on: true, label: "Water" } });
  return m;
}

export const forgingEquipmentList = Object.values(FORGING_EQUIPMENT);
