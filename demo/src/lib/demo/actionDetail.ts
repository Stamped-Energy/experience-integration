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

/** Overheating scrap on the most recent Forge line shift runs, from the demo run history. */
const forgeScrap = D.runs
  .filter((r) => r.lineId === "line-a")
  .slice(-10)
  .map((r) => r.outcomes.find((o) => o.name === "Overheating scrap")?.value ?? 1);

export const ACTION_DETAIL: Record<string, ActionDetailExtra> = {
  "ex-p1": {
    trend: { label: "Overheating scrap, Forge line shift runs", values: forgeScrap, unit: "%" },
    linkedRuns: ["run-a-2416", "run-a-2417"],
    simulation: {
      title: "Switchback trial on the Forge line",
      href: "/process/trials/trial-1",
      summary: "Alternate shift runs on the lower billet exit target; measurement plan locked before the first switch.",
    },
    similarCases: [{ title: "Hold the coil warm through press stops", href: "/process/actions/ex-p2", band: "heats per 100 parts 109 to 104" }],
    steps: [
      "Run the 1205 °C billet exit target on alternate shift runs.",
      "Compare overheating scrap and heats per 100 parts with the prior target.",
      "Stop restores 1215 °C straight away.",
    ],
    risks: ["Billets that leave too cool can load the press; Stop restores the prior target."],
  },
  "ex-p2": {
    trend: { label: "Heats per 100 parts, Forge line", values: [109, 108, 108, 107, 106, 105, 105, 104], unit: "heats" },
    linkedRuns: ["run-a-2417", "run-a-2418"],
    similarCases: [{ title: "Pace the pusher to the press", href: "/process/actions/ex-p3", band: "billets waiting 13 to 5" }],
    steps: [
      "Detect a press stop under ten minutes.",
      "Drop heater H1 to the warm idle level inside the signed coil-power band.",
      "Return to run power when the press restarts; watch heats per 100 parts for the next forty shift runs.",
    ],
    risks: ["If the idle level runs too cool, the first billets after a restart wait; Stop restores the prior coil power."],
    loop: {
      written: "Heater H1 held at a warm idle level during press stops under ten minutes, inside the signed coil-power band.",
      measured: "Heats per 100 parts 104 over the last forty shift runs; overheating scrap 0.9%; coil energy 4% lower per 100 parts.",
      verified: "Billet exit temperature stayed inside its band; Stop unused; prior coil power ready to restore.",
      statusLine: "Measured on the line: heats per 100 parts down 5 over 40 shift runs",
    },
  },
  "ex-p3": {
    trend: { label: "Billets waiting in heater H1 at press stops", values: [13, 12, 12, 10, 9, 8, 6, 5], unit: "billets" },
    linkedRuns: ["run-a-2416", "run-a-2417"],
    similarCases: [{ title: "Trial a lower billet exit target", href: "/process/actions/ex-p1", band: "overheating scrap 1.2 to 0.8%" }],
    steps: [
      "Link the pusher rate to the press stroke rate.",
      "Cap the billets held ahead of the press at six.",
      "Watch overheating scrap and heats per 100 parts for the next eight shift runs.",
    ],
    risks: ["A press that restarts faster than the pusher can feed will starve; revert to the fixed rate if it does."],
  },
  "ex-p4": {
    trend: { label: "Melt energy per tonne, furnace M1", values: [612, 606, 598, 592, 586, 580, 576, 574], unit: "kWh" },
    linkedRuns: ["run-d-8826", "run-d-8827"],
    similarCases: [{ title: "Pour temperature outside the good-heat window", href: "/quality/actions/ex-q3", band: "casting scrap 3.6 to 2.5%" }],
    steps: [
      "Detect a mould-line stop from the line signal.",
      "Step melt power to the holding level inside the signed melt-power band.",
      "Bring power back ahead of the next pour; watch pour temperature and casting scrap for the next ten heats.",
    ],
    risks: ["A short stop can leave the metal below the pour window; Stop restores the prior melt power."],
  },
  "ex-p5": {
    trend: { label: "Cycle time, VMC-2", values: [108, 108, 107, 106, 105, 104, 103.5, 103], unit: "s" },
    linkedRuns: ["run-e-3328", "run-e-3329"],
    simulation: {
      title: "Finish-pass feed on the twin",
      href: "/process/simulate",
      summary: "The higher feed is run on the twin first; tool life, spindle load and bore size are read before the machine is changed.",
    },
    similarCases: [{ title: "Tighten the cooling time on Tool T3", href: "/process/actions/ex-p6", band: "cycle 33.2 to 32.4 s" }],
    steps: [
      "Run the higher finish-pass feed on the twin.",
      "Read tool life, spindle load and bore size from the twin run.",
      "The Process engineer or Plant head decides whether to change the feed on the machine.",
    ],
    risks: ["A higher feed shortens tool life; the twin shows by how much before the machine takes the risk."],
  },
  "ex-p6": {
    trend: { label: "Cycle time, Tool T3", values: [34.1, 34.0, 33.6, 33.4, 33.2, 33.0, 32.7, 32.4], unit: "s" },
    linkedRuns: ["run-b-678", "run-b-679"],
    similarCases: [{ title: "Feed change on VMC-2, tried on the twin", href: "/process/actions/ex-p5", band: "cycle 108 to 103 s" }],
    steps: [
      "Confirm part temperature and warp checks after early open.",
      "Cut cool time so cycle moves from 33.2 s to 32.4 s.",
      "Watch scrap and energy per good part for two shift runs.",
    ],
    risks: ["Opening too early raises warp; Stop restores the prior cool time."],
  },
  "ex-q1": {
    trend: { label: "Quench oil temperature by basket, tank Q1", values: [66, 67, 68, 70, 71, 73], unit: "°C" },
    linkedLots: ["lot-c-5212"],
    linkedRuns: ["run-c-5118", "run-c-5119"],
    similarCases: [{ title: "Quench oil proposal on tank Q1", href: "/process/proposals/prop-111", band: "hardness 59.2 to 60.8 HRC" }],
    steps: [
      "Confirm the next basket has not been charged to the furnace.",
      "Hold it at the quench door until the oil is back under 72 °C.",
      "Sample hardness on that basket; do not release from Stamped.",
    ],
    risks: ["Quenching in warm oil risks a basket below the hardness spec."],
  },
  "ex-q2": {
    trend: { label: "Press force, screw press P1", values: [4620, 4650, 4710, 4790, 4880, 4960, 5040, 5100], unit: "kN" },
    spc: {
      title: "Press force by stroke, screw press P1",
      subtitle: "Force outliers cluster with cold billets",
      chartKind: "i_mr",
      primary: { label: "Press force", values: [4620, 4650, 4710, 4790, 4880, 4960, 5040, 5100], hits: [6, 7] },
      cl: 4800,
      ucl: 5000,
      lcl: 4600,
      unit: "kN",
      cpk: 1.1,
    },
    linkedRuns: ["run-a-2416", "run-a-2417"],
    similarCases: [{ title: "Trial a lower billet exit target", href: "/process/actions/ex-p1", band: "overheating scrap 1.2 to 0.8%" }],
    steps: [
      "Arm the floor flag when cold billets and force outliers coincide.",
      "Hold the next tray for a lap check before it moves on.",
      "Record the decision; Stamped does not scrap parts on its own.",
    ],
    risks: ["Ignoring the flag lets laps reach inspection, about twenty strokes later."],
  },
  "ex-q3": {
    trend: { label: "Pour temperature by ladle, heat 8836", values: [1421, 1418, 1412, 1406, 1401, 1397], unit: "°C" },
    spc: {
      title: "Pour temperature by ladle, heat 8836",
      subtitle: "Cold pour leads misruns",
      chartKind: "i_mr",
      primary: { label: "Pour temperature", values: [1421, 1418, 1412, 1406, 1401, 1397, 1396], hits: [5, 6] },
      cl: 1420,
      ucl: 1435,
      lcl: 1405,
      unit: "°C",
      cpk: 0.98,
    },
    linkedLots: ["lot-d-8913"],
    linkedRuns: ["run-d-8826", "run-d-8827"],
    similarCases: [{ title: "Low tensile on ductile iron housing", href: "/quality/investigations/inv-3", band: "carbon equivalent low on the same heats" }],
    steps: [
      "Confirm the pour temperature is under the good-heat window.",
      "Hold the next moulds from the ladle in your quality system.",
      "Check the first castings for misruns; the Quality head releases the hold.",
    ],
    risks: ["Pouring on risks misruns that only show after shakeout."],
  },
  "ex-q4": {
    trend: { label: "Bore scrap at HMC-1 by heat", values: [2.6, 2.7, 2.5, 2.4, 1.8, 1.4, 1.2], unit: "%" },
    linkedLots: ["lot-d-8913"],
    linkedRuns: ["run-d-8826", "run-d-8827"],
    similarCases: [{ title: "Low tensile on ductile iron housing", href: "/quality/investigations/inv-3", band: "carbon equivalent low on the same heats" }],
    steps: [
      "Keep the machining plan unchanged.",
      "Record the carbon equivalent correction against the heat and the scrapped bores.",
      "Watch bore scrap on the next six heats.",
    ],
    risks: ["None open; record only for the quality head."],
    loop: {
      written: "Carbon equivalent target on furnace M1 raised to the middle of its range; machining plan left unchanged.",
      measured: "Bore scrap 1.2% on the six heats since the change; porosity no longer follows one heat.",
      verified: "Cause linked to heat 8826; Verified on the investigation record.",
      statusLine: "Measured on the line: bore scrap down to 1.2% on the six heats since the change",
    },
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
