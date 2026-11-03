/**
 * Extra detail for action pages: charts, links, steps and risks. Illustrative; aligned with actions.ts and data.ts.
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
  };
  linkedLots?: string[];
  linkedRuns?: string[];
  similarCases?: { title: string; href: string; band: string }[];
  simulation?: { title: string; href: string; summary: string };
  steps: string[];
  risks: string[];
}

const lineBScrap = D.runs
  .filter((r) => r.lineId === "line-b")
  .slice(-20)
  .map((r) => r.outcomes.find((o) => /scrap/i.test(o.name))?.value ?? 3.2);

const lineAVisc = D.runs
  .filter((r) => r.lineId === "line-a")
  .slice(-15)
  .map((r) => r.outcomes.find((o) => /viscosity/i.test(o.name))?.value ?? 2500);

const cavity2Weight = [48.1, 48.0, 47.95, 47.88, 47.82, 47.76, 47.71];

export const ACTION_DETAIL: Record<string, ActionDetailExtra> = {
  "ex-p1": {
    trend: { label: "Viscosity at discharge, last batches", values: lineAVisc, spec: [2400, 2600], unit: "mPa·s" },
    linkedRuns: ["run-a-2418"],
    similarCases: [{ title: "Hold time 55 min on batch 2416", href: "/process/runs/run-a-2416", band: "viscosity 2470 to 2530 mPa·s" }],
    steps: ["Confirm jacket inlet is stable for 10 min.", "Apply hold time 57 min for batch 2418 only.", "Watch discharge viscosity against the band until release to the next stage."],
    risks: ["Extending hold uses jacket energy; Stop returns 55 min if viscosity overshoots."],
  },
  "ex-p2": {
    trend: { label: "First-batch viscosity after A-14 changeovers", values: [2780, 2810, 2690, 2750, 2720], spec: [2600, 2840], unit: "mPa·s" },
    linkedRuns: ["run-a-2419"],
    similarCases: [{ title: "Five best A-14 batches", href: "/process/lines/line-a", band: "hold 58 min, agitator 146 rpm" }],
    steps: ["Accept changeover settings before batch 2421 is charged.", "Load hold 58 min and agitator 146 rpm inside the A-14 band.", "Sample viscosity at discharge on the first batch."],
    risks: ["If torque runs high, Stop and revert to the prior grade recipe."],
  },
  "ex-p3": {
    trend: { label: "Time to target viscosity, alternating arms", values: [12.2, 11.8, 8.4, 12.0, 8.1, 11.9, 8.0, 12.1], unit: "min" },
    linkedRuns: ["run-a-2416", "run-a-2417"],
    simulation: { title: "Switchback trial trial-1", href: "/process/trials/trial-1", summary: "10 of 16 batches done; measurement plan locked before the first switch." },
    steps: ["Continue alternating 84 and 86 °C until batch 2426.", "Record any skipped batch with reason.", "Stop restores 84 °C from the next batch if the arm B effect fades."],
    risks: ["Charge mass swings can mimic a temperature gain; the trial design separates them."],
  },
  "ex-p4": {
    trend: { label: "Energy per good part, Line B", values: [0.44, 0.43, 0.42, 0.41, 0.42, 0.43, 0.42], spec: [0.35, 0.5], unit: "kWh/t" },
    linkedRuns: ["run-b-678", "run-b-679"],
    similarCases: [{ title: "Resin dryer cycle change", href: "/process/lines/line-b", band: "dew point at minus 40 °C held" }],
    steps: ["Plan dryer cycle 3.5 h for the next resin lot.", "Verify dew point at or below minus 40 °C before shortening.", "Watch energy per good part for two shift runs after changeover."],
    risks: ["Dryer is outside the signed line band; wrong dew point can raise moisture and scrap."],
  },
  "ex-p5": {
    trend: { label: "Parts per shift, Press P3", values: [812, 818, 824, 831, 836, 829, 842], unit: "parts" },
    linkedRuns: ["run-b-675", "run-b-676"],
    similarCases: [{ title: "Cycle time proof proof-3", href: "/process?evidence=proof-3", band: "1.9 to 3.3% more parts per shift" }],
    steps: ["Keep cycle time 33.2 s under standing approval.", "Use this verified result when weighing the next cycle time proposal.", "No operator action unless Stop is pressed."],
    risks: ["None while the setting stays inside the signed band."],
  },
  "ex-p6": {
    spc: {
      title: "Hold pressure, shift runs",
      subtitle: "Defects mapped to pressure band",
      chartKind: "i_mr",
      primary: { label: "Hold pressure", values: [620, 710, 830, 655, 780, 810, 635, 720], hits: [0, 0, 1, 0, 0, 1, 0, 0] },
      cl: 720,
      ucl: 850,
      lcl: 600,
      lsl: 640,
      usl: 820,
      unit: "bar",
      cpk: 1.12,
    },
    similarCases: [{ title: "Hold pressure 720 bar proposal", href: "/process/proposals/prop-101", band: "0.6 pp less scrap at R3" }],
    steps: ["Plant head already accepted the narrowed band.", "Stamped may only propose inside 640 to 820 bar.", "Widen again only through a signed limits change."],
    risks: ["Flash and short shots outside the narrowed band are still possible if tooling wears."],
  },
  "ex-q1": {
    linkedLots: ["lot-b-7713"],
    spc: {
      title: "Part weight, cavity 2",
      subtitle: "Spec band and target",
      chartKind: "i_mr",
      primary: { label: "Weight", values: cavity2Weight, hits: [cavity2Weight.length - 1] },
      cl: 48.0,
      ucl: 48.6,
      lcl: 47.4,
      lsl: 47.5,
      usl: 48.8,
      targetY: 48.0,
      unit: "g",
      cpk: 1.05,
    },
    similarCases: [{ title: "Lot 7711 light parts investigation", href: "/quality/investigations/inv-2", band: "hold pressure correction held" }],
    steps: ["Set aside the last 2 hours of cavity 2 parts.", "Weigh 32 parts before the lot is packed.", "Record the decision in Activity; Stamped keeps watching cavity 2."],
    risks: ["Continuing without a weigh risks a customer return if the band crosses the lower spec."],
  },
  "ex-q2": {
    trend: { label: "Predicted viscosity, lot 3307", values: [2520, 2540, 2560, 2580, 2600, 2610], spec: [2400, 2600], unit: "mPa·s" },
    linkedLots: ["lot-a-3307"],
    linkedRuns: ["run-a-2416", "run-a-2417"],
    similarCases: [{ title: "Lots 3307 and 3296 shared cause", href: "/quality/actions/ex-q3", band: "high end-of-hold torque" }],
    steps: ["Move the lab sample to the end of hold, 40 min before discharge.", "Do not treat the estimate as a release.", "If the lab result confirms high viscosity, send a correction to Process."],
    risks: ["Sampling early uses a slightly different temperature profile; the band accounts for that."],
  },
  "ex-q3": {
    trend: { label: "End-of-hold torque, linked batches", values: [142, 145, 148, 151, 149, 146], unit: "kN·m" },
    linkedLots: ["lot-a-3307", "lot-a-3296"],
    linkedRuns: ["run-a-2416", "run-a-2417"],
    similarCases: [{ title: "Investigation inv-1", href: "/quality/investigations/inv-1", band: "same batches on both lots" }],
    steps: ["Quality head sends correction: agitator 150 to 158 rpm.", "Process turns it into a proposal card.", "Quality does not write setpoints directly."],
    risks: ["Raising agitator speed without Process acceptance would bypass signed limits."],
  },
  "ex-q4": {
    trend: { label: "Part weight, cavity 1", values: [48.2, 48.1, 48.0, 48.1, 48.0, 48.2, 48.1], spec: [47.6, 48.8], unit: "g" },
    spc: {
      title: "Cavity 1 weight, 30 shift runs",
      chartKind: "xbar_r",
      primary: { label: "X-bar", values: [48.0, 48.1, 48.0, 48.2, 48.1, 48.0] },
      cl: 48.1,
      ucl: 48.5,
      lcl: 47.7,
      cpk: 1.35,
    },
    steps: ["Change inspection plan to weigh cavity 1 every 2 hours.", "Move freed time to cavity 2 checks.", "Revert to hourly if cavity 1 starts to drift."],
    risks: ["Cavity 2 drift is faster; starving it of checks raises escape risk."],
  },
  "ex-q5": {
    trend: { label: "Scrap rate, Line B", values: lineBScrap, spec: [0, 4], unit: "%" },
    linkedLots: ["lot-b-7711"],
    similarCases: [{ title: "Investigation inv-2 closed", href: "/quality/investigations/inv-2", band: "part weight 0.1 to 0.3 g heavier" }],
    steps: ["Close the investigation with the verified band.", "Keep the hold pressure correction in the record.", "No new hold release from Stamped."],
    risks: ["None; record only for the quality head."],
  },
  "ex-q6": {
    linkedLots: ["lot-b-7721"],
    linkedRuns: ["run-b-679"],
    similarCases: [{ title: "Scanner gap on shift run 681", href: "/quality/links", band: "time, recipe and sequence agree" }],
    steps: ["Quality head confirmed lot 7721 to shift run 681.", "Lot now carries run readings for traceability.", "Use the packing record as the audit anchor."],
    risks: ["Wrong link would attach another run's readings to the lot."],
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
