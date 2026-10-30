/** Forging line PFD fixture (demonstration data only). */
import type { DiagramDraft, Element, LabelPosition, Shows, Shown, State } from "./model";

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
    title: "Induction billet heater (P3 line)",
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
  "eq-induction-a": {
    id: "eq-induction-a",
    title: "Induction heater · P2 line",
    assetHref: "/plant/assets/b-induction",
    summary: "Upper press line billet heat (demo).",
    loops: [{ id: "loop-induction-zone1", label: "Zone 1 temperature", href: "/process/optimisation?loop=loop-induction-zone1" }],
    tags: [
      { label: "Billet temp", value: "1176", unit: "°C", state: "ok" },
      { label: "Line speed", value: "0.38", unit: "m/s", state: "ok" },
    ],
  },
  "eq-press-a": {
    id: "eq-press-a",
    title: "Press P2",
    assetHref: "/plant/assets/b-press",
    summary: "Parallel press line feeding shared HT furnace (demo).",
    loops: [{ id: "loop-press-tonnage", label: "Press tonnage", href: "/process/optimisation?loop=loop-press-tonnage" }],
    tags: [
      { label: "Tonnage", value: "3800", unit: "kN", state: "ok" },
      { label: "Hold", value: "598", unit: "bar", state: "ok" },
    ],
  },
  "eq-induction-b": {
    id: "eq-induction-b",
    title: "Induction heater · P3 line",
    assetHref: "/plant/assets/b-induction",
    summary: "Lower press line billet heat before Press P3 (demo).",
    loops: [
      { id: "loop-forge-induction", label: "Power / line speed", href: "/process/simulations?campaign=camp-p-sim-induction" },
      { id: "loop-induction-zone1", label: "Zone 1 temperature", href: "/process/optimisation?loop=loop-induction-zone1" },
    ],
    tags: [
      { label: "Billet temp", value: "1182", unit: "°C", state: "ok" },
      { label: "kW", value: "640", unit: "kW", state: "warning" },
    ],
  },
  "eq-press-b": {
    id: "eq-press-b",
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
  "eq-quench": {
    id: "eq-quench",
    title: "Oil quench tank",
    assetHref: "/process/line",
    summary: "Quench and oil temperature loop tied to cooling water header (demo).",
    loops: [{ id: "loop-ht-quench", label: "Quench oil temp", href: "/process/optimisation?loop=loop-ht-quench" }],
    tags: [
      { label: "Oil", value: "61", unit: "°C", state: "ok" },
      { label: "Agitator", value: "ON", state: "ok" },
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
  label_position: LabelPosition = "below",
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
  label_position,
  asset_id,
});

const val = (id: string, x: number, y: number, label: string, decimals: number): Element => ({
  type: "value",
  id,
  x,
  y,
  label,
  show_label: false,
  show_unit: true,
  decimals,
  size: 15,
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

const utilLine = (
  id: string,
  points: [number, number][],
  medium: string,
  label: string,
): Element => ({
  type: "line",
  id,
  kind: "utility",
  medium,
  points,
  arrow: "end",
  label,
});

export const forgingLineDiagram: DiagramDraft = {
  name: "Press line B · dual press · shared HT",
  description: "Demonstration PFD · parallel presses to shared furnace",
  width: 1420,
  height: 480,
  grid: 10,
  elements: [
    { type: "text", id: "title", x: 28, y: 36, text: "Press line B · parallel presses · shared HT (demo)", size: 16, align: "start", bold: true },
    { type: "text", id: "track-a", x: 36, y: 62, text: "Line P2", size: 12, align: "start", bold: true },
    { type: "text", id: "track-b", x: 36, y: 172, text: "Line P3", size: 12, align: "start", bold: true },
    sym("eq-induction-a", "forge.induction", 36, 72, "Induction P2", "eq-induction-a", 128, 86),
    sym("eq-press-a", "forge.press", 204, 66, "Press P2", "eq-press-a", 140, 94),
    sym("eq-induction-b", "forge.induction", 36, 182, "Induction P3", "eq-induction-b", 128, 86),
    sym("eq-press-b", "forge.press", 204, 176, "Press P3", "eq-press-b", 140, 94),
    sym("eq-furnace", "forge.furnace", 408, 108, "HT furnace", "eq-furnace", 150, 102),
    sym("eq-quench", "forge.quench", 592, 118, "Quench tank", "eq-quench", 120, 88),
    sym("eq-ht", "forge.ht", 744, 122, "Temper", "eq-ht", 128, 86),
    sym("eq-machine", "forge.machine", 904, 122, "Machining M4", "eq-machine", 128, 86),
    sym("eq-insp", "forge.inspect", 1064, 128, "Final insp.", "eq-insp", 110, 84),
    sym("pump-air", "forge.pump", 248, 332, "", "eq-press-a", 52, 52, "none"),
    sym("pump-water", "forge.pump", 612, 372, "", "eq-quench", 52, 52, "none"),
    val("v-ind-a", 52, 38, "Billet", 0),
    val("v-press-a", 238, 28, "Hold", 0),
    val("v-ind-b", 52, 148, "Billet", 0),
    val("v-press-b", 238, 132, "Hold", 0),
    val("v-furnace", 438, 82, "Z2", 0),
    val("v-quench", 608, 92, "Oil", 0),
    val("v-temper", 760, 96, "Temper", 0),
    val("v-cycle", 920, 96, "Cycle", 1),
    line("ln-a1", [
      [164, 115],
      [204, 113],
    ]),
    line("ln-a2", [
      [344, 113],
      [408, 130],
    ]),
    line("ln-b1", [
      [164, 225],
      [204, 223],
    ]),
    line("ln-b2", [
      [344, 223],
      [408, 168],
    ]),
    line("ln-ht1", [
      [558, 159],
      [592, 162],
    ]),
    line("ln-ht2", [
      [712, 162],
      [744, 165],
    ]),
    line("ln-ht3", [
      [872, 165],
      [904, 165],
    ]),
    line("ln-ht4", [
      [1032, 165],
      [1064, 165],
    ]),
    utilLine(
      "ln-header-air",
      [
        [72, 348],
        [1348, 348],
      ],
      "air",
      "Compressed air header",
    ),
    utilLine(
      "ln-header-water",
      [
        [72, 408],
        [1348, 408],
      ],
      "water",
      "Cooling water header",
    ),
    utilLine(
      "ln-util-air-a",
      [
        [286, 348],
        [286, 160],
      ],
      "air",
      "",
    ),
    utilLine(
      "ln-util-air-b",
      [
        [326, 348],
        [326, 270],
      ],
      "air",
      "",
    ),
    utilLine(
      "ln-util-water-q",
      [
        [652, 408],
        [652, 206],
      ],
      "water",
      "",
    ),
  ],
};

function stateSlot(state: State): Partial<Record<"state" | "running" | "level" | "value" | "flow", Shown>> {
  return { state: { state, label: "State" } };
}

export function forgingLineShows(): Shows {
  const m = new Map<string, Partial<Record<"state" | "running" | "level" | "value" | "flow", Shown>>>();
  m.set("eq-induction-a", { ...stateSlot("ok"), running: { on: true, label: "Heating" }, level: { fraction: 0.68, label: "Load" } });
  m.set("eq-press-a", { ...stateSlot("ok"), running: { on: true, label: "Running" } });
  m.set("eq-induction-b", { ...stateSlot("ok"), running: { on: true, label: "Heating" }, level: { fraction: 0.72, label: "Load" } });
  m.set("eq-press-b", { ...stateSlot("alarm"), running: { on: true, label: "Running" } });
  m.set("eq-furnace", { ...stateSlot("warning"), level: { fraction: 0.55, label: "Charge" } });
  m.set("eq-quench", { ...stateSlot("ok"), running: { on: true, label: "Agitator" } });
  m.set("eq-ht", { ...stateSlot("ok"), running: { on: true, label: "Sequence" } });
  m.set("eq-machine", { ...stateSlot("ok"), running: { on: true, label: "Cycle" } });
  m.set("eq-insp", { ...stateSlot("warning") });
  m.set("pump-air", { ...stateSlot("ok"), running: { on: true, label: "Running" } });
  m.set("pump-water", { ...stateSlot("warning"), running: { on: true, label: "Running" } });
  m.set("v-ind-a", { value: { value: 1176, unit: "°C", state: "ok", label: "Billet" } });
  m.set("v-press-a", { value: { value: 598, unit: "bar", state: "ok", label: "Hold" } });
  m.set("v-ind-b", { value: { value: 1182, unit: "°C", state: "ok", label: "Billet" } });
  m.set("v-press-b", { value: { value: 612, unit: "bar", state: "warning", label: "Hold" } });
  m.set("v-furnace", { value: { value: 902, unit: "°C", state: "warning", label: "Z2" } });
  m.set("v-quench", { value: { value: 61, unit: "°C", state: "ok", label: "Oil" } });
  m.set("v-temper", { value: { value: 425, unit: "°C", state: "ok", label: "Temper" } });
  m.set("v-cycle", { value: { value: 4.2, unit: "min", state: "ok", label: "Cycle" } });
  m.set("ln-a1", { flow: { on: true, label: "Billets" } });
  m.set("ln-a2", { flow: { on: true, label: "Forgings" } });
  m.set("ln-b1", { flow: { on: true, label: "Billets" } });
  m.set("ln-b2", { flow: { on: true, label: "Forgings" } });
  m.set("ln-ht1", { flow: { on: true, label: "Charge" } });
  m.set("ln-ht2", { flow: { on: true, label: "Quench" } });
  m.set("ln-ht3", { flow: { on: true, label: "Parts" } });
  m.set("ln-ht4", { flow: { on: true, label: "Parts" } });
  m.set("ln-header-air", { flow: { on: true, label: "Header" } });
  m.set("ln-header-water", { flow: { on: true, label: "Header" } });
  m.set("ln-util-air-a", { flow: { on: true, label: "Air" } });
  m.set("ln-util-air-b", { flow: { on: true, label: "Air" } });
  m.set("ln-util-water-q", { flow: { on: true, label: "Water" } });
  return m;
}

export const forgingEquipmentList = Object.values(FORGING_EQUIPMENT);
