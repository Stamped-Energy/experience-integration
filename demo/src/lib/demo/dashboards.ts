/** Demonstration dashboard data (loop health gauges and PV/SP/OP trends). */

import type { PvSpOpSeries } from "@/components/view/pv-sp-op-chart";

export interface LoopHealthRow {
  id: string;
  label: string;
  line: string;
  health: number;
  tone: string;
}

function wave(n: number, base: number, amp: number, seed: number) {
  const t: number[] = [];
  const pv: number[] = [];
  const sp: number[] = [];
  const op: number[] = [];
  for (let i = 0; i < n; i += 1) {
    t.push(i);
    sp.push(base);
    pv.push(base + amp * Math.sin((i + seed) / 4) + (seed % 3) * 0.2);
    op.push(42 + 18 * Math.sin((i + seed) / 5) + (i > n - 6 ? 4 : 0));
  }
  return { t, pv, sp, op };
}

export const DEMO_LOOP_HEALTH: LoopHealthRow[] = [
  { id: "hold", label: "Press hold pressure", line: "Press line B", health: 72, tone: "var(--warning)" },
  { id: "zone2", label: "Furnace zone 2 soak", line: "HT furnace", health: 58, tone: "var(--critical)" },
  { id: "barrel", label: "Barrel zone 1", line: "Press line B", health: 91, tone: "var(--success)" },
  { id: "quench", label: "Quench oil temperature", line: "HT line", health: 84, tone: "var(--success)" },
  { id: "air", label: "Plant air header", line: "Utilities", health: 77, tone: "var(--accent)" },
  { id: "induction", label: "Induction power", line: "Press line B", health: 66, tone: "var(--warning)" },
];

export const DEMO_PV_TRENDS: { id: string; title: string; caption: string; series: PvSpOpSeries; units: { pv: string; sp: string; op: string } }[] = [
  {
    id: "hold",
    title: "Hold pressure tracked setpoint while cavity weight drifted",
    caption: "Demonstration PV/SP/OP · the narrative explains what you are seeing without opening another screen.",
    series: wave(32, 605, 8, 2),
    units: { pv: "bar", sp: "bar", op: "%" },
  },
  {
    id: "furnace",
    title: "Zone 2 temperature lagged soak timer on the last charge",
    caption: "Soak timer and zone PV · useful when comparing simulation candidates.",
    series: wave(32, 900, 6, 5),
    units: { pv: "°C", sp: "°C", op: "%" },
  },
  {
    id: "quench",
    title: "Quench oil stayed inside band while cooling water ΔT rose",
    caption: "Oil temperature loop with utility header · demo only.",
    series: wave(32, 61, 2.5, 8),
    units: { pv: "°C", sp: "°C", op: "%" },
  },
  {
    id: "induction",
    title: "Induction power followed line speed after the last billet gap",
    caption: "Power and speed coordination on Press line B.",
    series: wave(32, 640, 25, 11),
    units: { pv: "kW", sp: "kW", op: "%" },
  },
];
