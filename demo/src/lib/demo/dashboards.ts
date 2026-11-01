/** Demonstration dashboard data (loop health gauges and PV/SP/OP trends). */

import type { PvSpOpSeries } from "@/components/view/pv-sp-op-chart";

export interface LoopHealthRow {
  id: string;
  label: string;
  line: string;
  health: number;
  tone: string;
}

/** Deterministic noise so SSR and client match. */
function noise(i: number, seed: number) {
  const x = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * 12-hour window, one point every 10 minutes (72 samples).
 * Patterns mimic sticky valve, aggressive tuning, slow drift, and a healthy loop
 * (inspired by industrial HMI dashboards; values are demonstration only).
 */
function series12h(
  kind: "sticky" | "aggressive" | "drift" | "healthy",
  base: number,
  seed: number,
): PvSpOpSeries {
  const n = 72;
  const end = Date.UTC(2026, 9, 30, 12, 0, 0); // 30 Oct 2026 12:00 UTC
  const step = 10 * 60 * 1000;
  const t: number[] = [];
  const pv: number[] = [];
  const sp: number[] = [];
  const op: number[] = [];
  for (let i = 0; i < n; i += 1) {
    t.push(end - (n - 1 - i) * step);
    const n1 = noise(i, seed);
    const n2 = noise(i, seed + 3);
    let setpoint = base;
    let process = base;
    let output = 45;
    if (kind === "sticky") {
      setpoint = base + (i > 40 && i < 55 ? 4 : 0);
      process = base + 6 * Math.sin(i / 3.2) + (n1 - 0.5) * 3.5 + (i > 40 && i < 55 ? 1.2 : 0);
      output = 38 + 22 * Math.sin(i / 2.8) + (n2 - 0.5) * 8;
    } else if (kind === "aggressive") {
      setpoint = base;
      process = base + 1.8 * Math.sin(i * 1.7) + (n1 - 0.5) * 2.4;
      output = 50 + 28 * Math.sin(i * 1.9) + (n2 - 0.5) * 10;
    } else if (kind === "drift") {
      setpoint = base;
      const drift = (i / n) * 8;
      process = base + drift + (n1 - 0.5) * 1.6 + 0.8 * Math.sin(i / 5);
      output = 40 + drift * 1.4 + (n2 - 0.5) * 4;
    } else {
      // healthy: PV tracks SP steps cleanly
      if (i > 18 && i < 36) setpoint = base + 5;
      else if (i >= 50) setpoint = base - 3;
      const lag = i > 0 ? (sp[i - 1] ?? setpoint) : setpoint;
      process = lag * 0.35 + setpoint * 0.65 + (n1 - 0.5) * 0.6;
      output = 48 + (setpoint - base) * 2.2 + (n2 - 0.5) * 2;
    }
    sp.push(Number(setpoint.toFixed(2)));
    pv.push(Number(process.toFixed(2)));
    op.push(Number(Math.max(5, Math.min(95, output)).toFixed(2)));
  }
  return { t, pv, sp, op };
}

export const DEMO_LOOP_HEALTH: LoopHealthRow[] = [
  { id: "hold", label: "Press hold pressure", line: "Press line B", health: 72, tone: "var(--warning)" },
  { id: "zone2", label: "Furnace zone 2 soak", line: "HT furnace", health: 58, tone: "var(--warning)" },
  { id: "barrel", label: "Barrel zone 1", line: "Press line B", health: 91, tone: "var(--success)" },
  { id: "quench", label: "Quench oil temperature", line: "HT line", health: 84, tone: "var(--success)" },
  { id: "air", label: "Plant air header", line: "Utilities", health: 77, tone: "var(--success)" },
  { id: "induction", label: "Induction power", line: "Press line B", health: 66, tone: "var(--warning)" },
];

export const DEMO_PV_TRENDS: {
  id: string;
  title: string;
  caption: string;
  series: PvSpOpSeries;
  units: { pv: string; sp: string; op: string };
}[] = [
  {
    id: "hold",
    title: "Hold pressure · sticky valve",
    caption: "PV hunts around SP while the valve sticks on cavity 2. Demonstration series.",
    series: series12h("sticky", 605, 2),
    units: { pv: "bar", sp: "bar", op: "%" },
  },
  {
    id: "furnace",
    title: "Zone 2 soak · aggressive tuning",
    caption: "High-gain controller: dense oscillation around the soak setpoint. Demonstration series.",
    series: series12h("aggressive", 900, 5),
    units: { pv: "°C", sp: "°C", op: "%" },
  },
  {
    id: "quench",
    title: "Quench oil · slow sensor drift",
    caption: "Oil temperature drifts off SP while cooling water ΔT rises. Demonstration series.",
    series: series12h("drift", 61, 8),
    units: { pv: "°C", sp: "°C", op: "%" },
  },
  {
    id: "induction",
    title: "Induction power · healthy loop",
    caption: "Power follows line-speed steps cleanly after billet gaps. Demonstration series.",
    series: series12h("healthy", 640, 11),
    units: { pv: "kW", sp: "kW", op: "%" },
  },
];
