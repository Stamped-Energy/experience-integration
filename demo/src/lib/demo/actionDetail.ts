/**
 * Extra detail for action pages: charts, links, steps, risks and closed-loop status.
 * Illustrative; aligned with actions.ts and data.ts.
 */
import type { ExampleAction } from "./types";
import * as D from "./data";
import { exampleActions, getAction } from "./actions";

export interface ActionDetailExtra {
  trend?: { label: string; values: number[]; spec?: [number, number]; unit?: string };
  spc?: {
    title: string;
    subtitle?: string;
    chartKind: "xbar_r" | "i_mr";
    primary: { label: string; values: number[]; hits?: number[] };
    cl: number;
    ucl: number;
    lcl: number;
    usl?: number;
    lsl?: number;
    targetY?: number;
    unit?: string;
    cpk?: number;
    yMin?: number;
    yMax?: number;
    specLinesOnly?: boolean;
  };
  linkedLots?: string[];
  linkedRuns?: string[];
  similarCases?: { title: string; href: string; band: string }[];
  simulation?: { title: string; href: string; summary: string };
  steps: string[];
  risks: string[];
  /** Present when the change is already on the line (Running or Accepted). */
  loop?: {
    written: string;
    measured: string;
    verified: string;
    /** Outcome-first status, tagged MODELLED on the page. */
    statusLine: string;
  };
}

const lineAVisc = D.runs
  .filter((r) => r.lineId === "line-a")
  .slice(-15)
  .map((r) => r.outcomes.find((o) => /viscosity/i.test(o.name))?.value ?? 2500);

const lineBScrap = D.runs
  .filter((r) => r.lineId === "line-b")
  .slice(-20)
  .map((r) => r.outcomes.find((o) => /scrap/i.test(o.name))?.value ?? 3.2);

export const ACTION_DETAIL: Record<string, ActionDetailExtra> = {
  "ex-p1": {
    trend: { label: "Energy per good batch, Mixer 2", values: [182, 179, 175, 170, 166, 161, 158, 157], unit: "kWh" },
    linkedRuns: ["run-a-2417", "run-a-2418"],
    similarCases: [{ title: "Mixer 1 charge order", href: "/process/actions/ex-p4", band: "cycle 82 to 75 min" }],
    steps: [
      "Confirm viscosity is already inside the Grade A-12 band before cutting hold.",
      "Apply the eight-minute hold cut inside the signed band.",
      "Watch energy per good batch and rejection for the next forty batches.",
    ],
    risks: ["If viscosity drifts late, Stop restores the prior hold time from the next batch."],
    loop: {
      written: "Mixer 2 hold cut by eight minutes inside the signed hold-time band.",
      measured: "Energy per good batch 157 kWh over the last forty batches; cycle 66 min; rejection 4.6%.",
      verified: "In-band viscosity held; Stop unused; prior hold ready to restore.",
      statusLine: "Measured on the line: energy per good batch down 13% over 40 batches",
    },
  },
  "ex-p2": {
    trend: { label: "Cycle time, Press 7", values: [38.2, 38.0, 37.8, 37.1, 36.2, 35.4, 34.8, 34.5], unit: "s" },
    linkedRuns: ["run-b-678", "run-b-679"],
    similarCases: [{ title: "Barrel profile on Press 4", href: "/process/actions/ex-p3", band: "energy 0.51 to 0.45 kWh" }],
    steps: [
      "Confirm cavity temperature and warp checks after early open.",
      "Cut cool time so cycle moves from 38.0 s to 34.5 s.",
      "Watch scrap and energy per good part for two shift runs.",
    ],
    risks: ["Opening too early raises warp; Stop restores the prior cool time."],
  },
  "ex-p3": {
    trend: { label: "Rear-zone temperature, Press 4", values: [245, 242, 238, 235, 232, 230, 228], unit: "°C" },
    linkedRuns: ["run-b-675", "run-b-676"],
    simulation: {
      title: "Switchback trial on Press 4",
      href: "/process/trials/trial-2",
      summary: "Alternate runs on the lower rear-zone profile; measurement plan locked before the first switch.",
    },
    steps: [
      "Run the lower rear-zone profile on alternate Press 4 runs.",
      "Compare burn-mark scrap and heater kWh to the prior profile.",
      "Stop restores the prior profile straight away.",
    ],
    risks: ["Under-heating the melt can raise short shots; Stop restores the prior profile."],
  },
  "ex-p4": {
    trend: { label: "Dispersion time, Mixer 1", values: [28, 27, 25, 24, 22, 21, 20], unit: "min" },
    linkedRuns: ["run-a-2416", "run-a-2417"],
    similarCases: [{ title: "Mixer 2 hold cut", href: "/process/actions/ex-p1", band: "energy 182 to 158 kWh" }],
    steps: [
      "Lock Mixer 1 charge order to liquids first, then fines.",
      "Train the next shift on the recipe card sequence.",
      "Watch give-away and rejection on the next eight batches.",
    ],
    risks: ["Wrong order on a new grade can raise lumps; revert to the prior card if torque spikes."],
  },
  "ex-p5": {
    trend: { label: "Dryer energy through changeovers", values: [310, 302, 288, 275, 268, 260, 255], unit: "kWh" },
    linkedRuns: ["run-b-675"],
    similarCases: [{ title: "Hold moisture on nylon lots", href: "/quality/actions/ex-q4", band: "scrap 4.1 to 2.4%" }],
    steps: [
      "Drop dryer set point once the hopper is full at changeover.",
      "Restore set point before the next lot starts.",
      "Watch dew point and energy per good part for two changeovers.",
    ],
    risks: ["Leaving the dryer cool too long can wet the resin; restore before the next lot."],
  },
  "ex-q1": {
    trend: { label: "Torque curve, Batch 2417", values: lineAVisc.slice(-8).map((v, i) => 140 + i * 2 + (v % 7)), unit: "kN·m" },
    linkedLots: ["lot-a-3307"],
    linkedRuns: ["run-a-2417"],
    similarCases: [{ title: "High viscosity investigation", href: "/quality/investigations/inv-1", band: "same torque path on prior rejects" }],
    steps: [
      "Confirm the three-minute correction window is still open.",
      "Apply the signed agitator correction on Batch 2417.",
      "Sample at the end of hold; do not release from Stamped.",
    ],
    risks: ["Skipping the correction risks scrapping the batch at the lab."],
  },
  "ex-q2": {
    trend: { label: "Peak injection pressure, Press 7", values: [1180, 1175, 1160, 1140, 1110, 1085, 1060, 1040], unit: "bar" },
    spc: {
      title: "Peak injection pressure, last shots",
      subtitle: "Drop leads short shots by about 40 shots",
      chartKind: "i_mr",
      primary: { label: "Peak pressure", values: [1180, 1175, 1160, 1140, 1110, 1085, 1060, 1040], hits: [6, 7] },
      cl: 1140,
      ucl: 1220,
      lcl: 1060,
      unit: "bar",
      cpk: 1.08,
    },
    linkedRuns: ["run-b-678", "run-b-679"],
    similarCases: [{ title: "Tighten cooling on Press 7", href: "/process/actions/ex-p2", band: "cycle 38.0 to 34.5 s" }],
    steps: [
      "Arm the floor flag when peak injection pressure drops.",
      "Hold the next tray for a weigh check before packing.",
      "Record the decision; Stamped does not scrap parts on its own.",
    ],
    risks: ["Ignoring the pressure drop packs short shots for about forty more shots."],
  },
  "ex-q3": {
    trend: { label: "Rejection rate on Tool 12", values: [2.8, 2.6, 2.4, 2.1, 1.9, 1.7, 1.6], unit: "%" },
    spc: {
      title: "Circuit 3 outlet temperature, Tool 12",
      subtitle: "Warm circuit linked to sink marks",
      chartKind: "i_mr",
      primary: { label: "Outlet °C", values: [58, 59, 61, 62, 60, 56, 55, 55], hits: [2, 3] },
      cl: 56,
      ucl: 60,
      lcl: 52,
      unit: "°C",
      cpk: 1.15,
    },
    linkedLots: ["lot-b-7711"],
    linkedRuns: ["run-b-678", "run-b-679"],
    similarCases: [{ title: "Investigation inv-2", href: "/quality/investigations/inv-2", band: "mould temperature cause held" }],
    steps: [
      "Keep the inspection plan unchanged.",
      "Record the circuit clear against the sink-mark map.",
      "Watch rejection on Tool 12 for the next fortnight.",
    ],
    risks: ["None open; record only for the quality head."],
    loop: {
      written: "Tool 12 cooling circuit 3 cleared; inspection plan left unchanged.",
      measured: "Rejection rate 1.6% on Tool 12 since the clear; sink marks no longer follow circuit 3.",
      verified: "Cause linked to mould temperature; Verified on the investigation record.",
      statusLine: "Measured on the line: rejection rate down to 1.6% on Tool 12 since the clear",
    },
  },
  "ex-q4": {
    trend: { label: "Splay scrap on nylon lots", values: lineBScrap.slice(-8), unit: "%" },
    linkedLots: ["lot-b-7713", "lot-b-7719"],
    linkedRuns: ["run-b-679"],
    similarCases: [{ title: "Stop hot dryer idle", href: "/process/actions/ex-p5", band: "dryer 310 to 255 kWh" }],
    steps: [
      "Hold any nylon lot whose dryer log is short of the set time.",
      "Release only when the dryer log clears.",
      "Set the hold in your quality system; Stamped only recommends it.",
    ],
    risks: ["Releasing wet nylon raises splay scrap on the next press run."],
  },
};

export function detailFor(action: ExampleAction): ActionDetailExtra {
  return (
    ACTION_DETAIL[action.id] ?? {
      steps: [action.action],
      risks: ["Illustrative demo only; a real plant validates each step against its quality system."],
    }
  );
}

export function actionIds() {
  return exampleActions.map((a) => ({ id: a.id }));
}

export function assertAction(id: string): ExampleAction {
  const a = getAction(id);
  if (!a) throw new Error(`Unknown action ${id}`);
  return a;
}

/** Actions already applied on the line: Running on its own, or Accepted and closed. */
export function actionIsApplied(a: ExampleAction) {
  return Boolean(a.closed) || a.who.how === "On its own, inside the signed band" || a.who.how === "Record only";
}
