/** Extra measurable outcomes and calculation steps per action card (illustrative demo). All displayed values are MODELLED. */
import type { ActionOutcome, ExampleAction, OutcomeCalculation } from "./types";
import { actionOutcomeForDisplay } from "./actions";

const M = "Modelled" as const;

const METRICS: Record<string, ActionOutcome[]> = {
  "ex-p1": [
    { metric: "Cycle time", before: "74 min", after: "66 min", label: M, measuredAfter: "66 min" },
    { metric: "Rejection rate", before: "4.8%", after: "4.6%", label: M, measuredAfter: "4.6%" },
  ],
  "ex-p2": [
    { metric: "Energy per good part", before: "0.42 kWh", after: "0.38 kWh", label: M },
    { metric: "Scrap", before: "3.1%", after: "2.9%", label: M },
  ],
  "ex-p3": [
    { metric: "Scrap", before: "2.6%", after: "2.2%", label: M },
    { metric: "Cycle time", before: "41 s", after: "40 s", label: M },
  ],
  "ex-p4": [
    { metric: "Material give-away", before: "1.9%", after: "1.2%", label: M },
    { metric: "Rejection rate", before: "5.2%", after: "4.1%", label: M },
  ],
  "ex-p5": [
    { metric: "Dryer energy per shift", before: "310 kWh", after: "255 kWh", label: M },
  ],
  "ex-q1": [
    { metric: "Material per good batch", before: "1,020 kg", after: "1,000 kg", label: M },
    { metric: "Energy per good batch", before: "190 kWh", after: "172 kWh", label: M },
  ],
  "ex-q2": [
    { metric: "Energy per good part", before: "0.44 kWh", after: "0.41 kWh", label: M },
  ],
  "ex-q3": [],
  "ex-q4": [
    { metric: "Material per good part", before: "52 g", after: "51 g", label: M },
  ],
};

const CALC: Record<string, OutcomeCalculation[]> = {
  "ex-p1": [
    {
      metric: "Energy per good batch",
      inputs: ["Mixer 2 kWh meter", "Good batches after viscosity in band", "Scrap and rework batches included in the divisor"],
      formula: "kWh ÷ good batches (scrap and rework count in the energy per good figure)",
      result: "182 → 158 kWh (line 157 kWh)",
      label: M,
    },
    {
      metric: "Cycle time",
      inputs: ["Charge to discharge clock", "Viscosity in band eight minutes early"],
      formula: "Prior hold end minus early-in-band window",
      result: "74 → 66 min",
      label: M,
    },
    {
      metric: "Rejection rate",
      inputs: ["Lab rejects on Mixer 2", "Good batches in the same window"],
      formula: "Rejected ÷ discharged batches",
      result: "4.8 → 4.6%",
      label: M,
    },
  ],
  "ex-p2": [
    {
      metric: "Cycle time",
      inputs: ["Press 7 cycle timer", "Cavity temperature at ejection"],
      formula: "Cool cut while part is already stable at open",
      result: "38.0 → 34.5 s",
      label: M,
    },
    {
      metric: "Energy per good part",
      inputs: ["Press kWh", "Good parts", "Scrap and rework parts in the divisor"],
      formula: "kWh ÷ good parts (scrap and rework count in energy per good)",
      result: "0.42 → 0.38 kWh",
      label: M,
    },
    {
      metric: "Scrap",
      inputs: ["Vision scrap codes", "Parts produced"],
      formula: "Scrap ÷ parts",
      result: "3.1 → 2.9%",
      label: M,
    },
  ],
  "ex-p3": [
    {
      metric: "Energy per good part",
      inputs: ["Barrel heater kWh", "Good parts", "Scrap and rework in the divisor"],
      formula: "Heater kWh ÷ good parts (scrap and rework count in energy per good)",
      result: "0.51 → 0.45 kWh",
      label: M,
    },
    {
      metric: "Scrap",
      inputs: ["Burn-mark defect codes", "Parts produced"],
      formula: "Burn scrap ÷ parts",
      result: "2.6 → 2.2%",
      label: M,
    },
    {
      metric: "Cycle time",
      inputs: ["Press 4 cycle timer"],
      formula: "Mean cycle after lower rear zones",
      result: "41 → 40 s",
      label: M,
    },
  ],
  "ex-p4": [
    {
      metric: "Cycle time",
      inputs: ["Mixer 1 charge to discharge", "Dispersion time after liquids-first order"],
      formula: "Recipe time with fines after liquids",
      result: "82 → 75 min",
      label: M,
    },
    {
      metric: "Material give-away",
      inputs: ["Corrective top-up mass", "Batch charge mass"],
      formula: "Top-up ÷ charge mass",
      result: "1.9 → 1.2%",
      label: M,
    },
    {
      metric: "Rejection rate",
      inputs: ["Lab rejects for lumps and under-dispersion", "Batches discharged"],
      formula: "Rejected ÷ discharged",
      result: "5.2 → 4.1%",
      label: M,
    },
  ],
  "ex-p5": [
    {
      metric: "Energy per good part",
      inputs: ["Dryer and press kWh", "Good parts", "Scrap and rework in the divisor"],
      formula: "kWh ÷ good parts (scrap and rework count in energy per good)",
      result: "0.47 → 0.43 kWh",
      label: M,
    },
    {
      metric: "Dryer energy per shift",
      inputs: ["Dryer meter through changeovers", "Hopper-full windows"],
      formula: "Shift dryer kWh with idle cut when hopper is full",
      result: "310 → 255 kWh",
      label: M,
    },
  ],
  "ex-q1": [
    {
      metric: "Rejection rate",
      inputs: ["Torque path vs last three rejected batches", "Batch 2417 still in hold"],
      formula: "Saved batch vs scrap-at-lab baseline",
      result: "5.0 → 3.2%",
      label: M,
    },
    {
      metric: "Material per good batch",
      inputs: ["Charge mass", "Good batches after correction"],
      formula: "Material used ÷ good batches",
      result: "1,020 → 1,000 kg",
      label: M,
    },
    {
      metric: "Energy per good batch",
      inputs: ["Mixer kWh", "Good batches", "Scrap and rework in the divisor"],
      formula: "kWh ÷ good batches (scrap and rework count in energy per good)",
      result: "190 → 172 kWh",
      label: M,
    },
  ],
  "ex-q2": [
    {
      metric: "Scrap",
      inputs: ["Peak injection pressure drop", "Vision short-shot codes"],
      formula: "Short-shot scrap ÷ parts after early flag",
      result: "3.4 → 1.9%",
      label: M,
    },
    {
      metric: "Energy per good part",
      inputs: ["Press kWh", "Good parts", "Scrap and rework in the divisor"],
      formula: "kWh ÷ good parts (scrap and rework count in energy per good)",
      result: "0.44 → 0.41 kWh",
      label: M,
    },
  ],
  "ex-q3": [
    {
      metric: "Rejection rate",
      inputs: ["Sink-mark map on Tool 12", "Circuit 3 outlet temperature", "Parts after circuit clear"],
      formula: "Sink rejects ÷ parts after warm circuit cleared",
      result: "2.8 → 1.6% (line 1.6%)",
      label: M,
    },
  ],
  "ex-q4": [
    {
      metric: "Scrap",
      inputs: ["Dryer log vs splay scrap", "Nylon lots under set dry time"],
      formula: "Splay scrap ÷ parts after hold-until-clear",
      result: "4.1 → 2.4%",
      label: M,
    },
    {
      metric: "Material per good part",
      inputs: ["Shot weight", "Good parts after hold"],
      formula: "Material used ÷ good parts",
      result: "52 → 51 g",
      label: M,
    },
  ],
};

export function actionOutcomesForDisplay(a: ExampleAction): ActionOutcome[] {
  const primary = actionOutcomeForDisplay(a);
  const extra = METRICS[a.id] ?? [];
  const seen = new Set<string>();
  const out: ActionOutcome[] = [];
  for (const o of [primary, ...extra]) {
    const key = o.metric.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(o);
  }
  return out.slice(0, 3);
}

export function calculationsForAction(a: ExampleAction): OutcomeCalculation[] {
  const rows = CALC[a.id];
  if (rows?.length) return rows;
  const primary = actionOutcomeForDisplay(a);
  return [
    {
      metric: primary.metric,
      inputs: a.evidence.map((e) => e.text).slice(0, 3),
      formula: "Demonstration plant model from listed evidence (demo)",
      result: `${primary.before} → ${primary.after}`,
      label: primary.label,
    },
  ];
}
