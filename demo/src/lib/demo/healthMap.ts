/**
 * Health map cells for Scan screens (grain: machine, or loop on large/critical assets).
 * ISA-style states only; no bare health percentage in labels.
 */
import * as D from "./data";

export type IsaState = "ok" | "watch" | "alarm" | "unknown";

export interface HealthCell {
  id: string;
  area: string;
  lineId: string;
  assetId?: string;
  label: string;
  sublabel?: string;
  state: IsaState;
  stateWord: string;
  issue?: string;
  href: string;
  grain: "machine" | "loop";
  sparkline?: number[];
}

export interface HealthArea {
  id: string;
  label: string;
  cells: HealthCell[];
}

const stateWord: Record<IsaState, string> = { ok: "Normal", watch: "Watch", alarm: "Alarm", unknown: "Unknown" };

function cell(
  partial: Omit<HealthCell, "stateWord"> & { state: IsaState },
): HealthCell {
  return { ...partial, stateWord: stateWord[partial.state] };
}

export const processHealthAreas: HealthArea[] = [
  {
    id: "line-a",
    label: "Batch line A",
    cells: [
      cell({ id: "m-mixer", area: "line-a", lineId: "line-a", assetId: "a-mixer", label: "Mixer M1", state: "watch", issue: "Hold torque drifting high", href: "/plant/assets/a-mixer", grain: "machine", sparkline: [2410, 2422, 2438, 2445, 2451] }),
      cell({ id: "l-mixer-agit", area: "line-a", lineId: "line-a", assetId: "a-mixer", label: "Agitator loop", sublabel: "Mixer M1", state: "watch", issue: "Oscillation flagged", href: "/process/optimisation?loop=loop-mixer-agit", grain: "loop" }),
      cell({ id: "l-mixer-hold", area: "line-a", lineId: "line-a", label: "Hold time loop", sublabel: "Batch A", state: "ok", href: "/process/optimisation?loop=loop-mixer-hold", grain: "loop" }),
      cell({ id: "m-hold", area: "line-a", lineId: "line-a", assetId: "a-hold", label: "Hold tank", state: "ok", href: "/plant/assets/a-hold", grain: "machine" }),
      cell({ id: "l-hold-level", area: "line-a", lineId: "line-a", label: "Hold level", sublabel: "Tank T2", state: "ok", href: "/process/line", grain: "loop" }),
    ],
  },
  {
    id: "line-b",
    label: "Press / forging line B",
    cells: [
      cell({ id: "m-induction", area: "line-b", lineId: "line-b", label: "Induction heater", state: "ok", href: "/process/line", grain: "machine", sparkline: [1178, 1180, 1181, 1182, 1182] }),
      cell({ id: "m-press", area: "line-b", lineId: "line-b", assetId: "b-press", label: "Press P3", state: "alarm", issue: "Cavity 2 weight high", href: "/plant/assets/b-press", grain: "machine", sparkline: [718, 722, 726, 731, 738] }),
      cell({ id: "l-barrel-1", area: "line-b", lineId: "line-b", assetId: "b-press", label: "Barrel zone 1", sublabel: "Press P3", state: "watch", issue: "Temperature lag", href: "/process/optimisation?loop=loop-press-barrel-temp", grain: "loop" }),
      cell({ id: "l-barrel-2", area: "line-b", lineId: "line-b", assetId: "b-press", label: "Barrel zone 2", sublabel: "Press P3", state: "ok", href: "/process/optimisation?loop=loop-press-barrel-temp", grain: "loop" }),
      cell({ id: "l-barrel-3", area: "line-b", lineId: "line-b", label: "Barrel zone 3", sublabel: "Press P3", state: "ok", href: "/process/optimisation?loop=loop-press-barrel-temp", grain: "loop" }),
      cell({ id: "l-hold-p", area: "line-b", lineId: "line-b", assetId: "b-press", label: "Hold pressure", sublabel: "Press P3", state: "watch", issue: "Agent sim candidate ready", href: "/process/simulations?campaign=camp-p-sim-1", grain: "loop" }),
      cell({ id: "l-tonnage", area: "line-b", lineId: "line-b", label: "Press tonnage", state: "ok", href: "/process/optimisation?loop=loop-press-tonnage", grain: "loop" }),
      cell({ id: "m-cnc", area: "line-b", lineId: "line-b", label: "CNC cell M4", state: "ok", href: "/process/line", grain: "machine" }),
    ],
  },
  {
    id: "ht",
    label: "Heat treat",
    cells: [
      cell({ id: "f-zone1", area: "ht", lineId: "line-a", label: "Furnace zone 1", state: "ok", href: "/process/optimisation?loop=loop-ht-zone1", grain: "loop" }),
      cell({ id: "f-zone2", area: "ht", lineId: "line-a", label: "Furnace zone 2", state: "watch", issue: "Soak short on last batch", href: "/process/simulations?campaign=camp-p-sim-2", grain: "loop" }),
      cell({ id: "f-zone3", area: "ht", lineId: "line-a", label: "Furnace zone 3", state: "ok", href: "/process/optimisation?loop=loop-ht-zone3", grain: "loop" }),
      cell({ id: "f-quench", area: "ht", lineId: "line-a", label: "Quench oil temperature", state: "ok", href: "/process/optimisation?loop=loop-ht-quench", grain: "loop" }),
      cell({ id: "f-temper", area: "ht", lineId: "line-a", label: "Temper soak", state: "ok", href: "/process/optimisation?loop=loop-ht-temper", grain: "loop" }),
    ],
  },
  {
    id: "utilities",
    label: "Utilities",
    cells: [
      cell({ id: "u-air", area: "utilities", lineId: "line-b", label: "Compressed air header", state: "ok", href: "/process/optimisation?loop=loop-util-compressed-air", grain: "loop" }),
      cell({ id: "u-water", area: "utilities", lineId: "line-a", label: "Cooling water return", state: "watch", issue: "Delta-T narrow", href: "/process/optimisation?loop=loop-util-cooling-water", grain: "loop" }),
      cell({ id: "u-steam", area: "utilities", lineId: "line-a", label: "Steam trap bank", state: "ok", href: "/process/analytics", grain: "machine" }),
    ],
  },
];

export const qualityHealthAreas: HealthArea[] = [
  {
    id: "lab",
    label: "Laboratory coverage",
    cells: [
      cell({ id: "q-hardness", area: "lab", lineId: "line-a", label: "Hardness results", state: "watch", issue: "Lag on lot 3307", href: "/quality/lots/lot-a-3307", grain: "machine" }),
      cell({ id: "q-join", area: "lab", lineId: "line-a", label: "Genealogy links", state: "alarm", issue: "Low confidence link", href: "/quality/links", grain: "machine" }),
      cell({ id: "q-spc", area: "lab", lineId: "line-b", label: "Weight SPC", state: "watch", issue: "Western electric rule 2", href: "/quality/spc", grain: "loop" }),
      cell({ id: "q-capa", area: "lab", lineId: "line-a", label: "Open CAPA", state: "ok", href: "/quality/capa", grain: "machine" }),
    ],
  },
  {
    id: "lines",
    label: "By line",
    cells: D.lines.map((l) =>
      cell({
        id: `q-${l.id}`,
        area: "lines",
        lineId: l.id,
        label: l.short,
        state: l.id === "line-a" ? "watch" : "ok",
        issue: l.id === "line-a" ? "Lots at risk" : undefined,
        href: `/quality/lots/${D.lots.find((x) => x.lineIds.includes(l.id))?.id ?? "lot-a-3307"}`,
        grain: "machine",
      }),
    ),
  },
  {
    id: "quality-loops",
    label: "Quality loops (demo)",
    cells: [
      cell({ id: "ql-sample", area: "quality-loops", lineId: "line-a", label: "Sampling plan", state: "watch", href: "/quality/simulations?campaign=camp-q-sim-1", grain: "loop" }),
      cell({ id: "ql-spc-loop", area: "quality-loops", lineId: "line-b", label: "SPC agent loop", state: "ok", href: "/quality/simulations?campaign=camp-q-sim-spc", grain: "loop" }),
      cell({ id: "ql-genealogy", area: "quality-loops", lineId: "line-a", label: "Genealogy match", state: "alarm", issue: "Lot 3304 mismatch", href: "/quality/genealogy", grain: "machine" }),
    ],
  },
];

export const worstProcessCells = (): HealthCell[] =>
  processHealthAreas
    .flatMap((a) => a.cells)
    .filter((c) => c.state === "alarm" || c.state === "watch")
    .sort((a, b) => (a.state === "alarm" ? 0 : 1) - (b.state === "alarm" ? 0 : 1))
    .slice(0, 8);

export const worstQualityCells = (): HealthCell[] =>
  qualityHealthAreas
    .flatMap((a) => a.cells)
    .filter((c) => c.state !== "ok")
    .slice(0, 8);

export const statusStrip = (areas: HealthArea[]) => {
  const cells = areas.flatMap((a) => a.cells);
  return {
    alarm: cells.filter((c) => c.state === "alarm").length,
    watch: cells.filter((c) => c.state === "watch").length,
    ok: cells.filter((c) => c.state === "ok").length,
    unknown: cells.filter((c) => c.state === "unknown").length,
  };
};
