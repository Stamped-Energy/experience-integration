/** Extra measurable outcomes and calculation steps per action card (illustrative demo). All displayed values are MODELLED. */
import type { ActionOutcome, ExampleAction, OutcomeCalculation } from "./types";
import { actionOutcomeForDisplay } from "./actions";

const M = "Modelled" as const;

const METRICS: Record<string, ActionOutcome[]> = {
  "ex-p1": [
    { metric: "Heats per 100 parts", before: "106", after: "104", label: M },
  ],
  "ex-p2": [
    { metric: "Overheating scrap", before: "1.1%", after: "0.9%", label: M, measuredAfter: "0.9%" },
    { metric: "Coil energy per 100 parts", before: "100", after: "96", label: M, measuredAfter: "96" },
  ],
  "ex-p3": [
    { metric: "Overheating scrap", before: "1.2%", after: "0.9%", label: M },
    { metric: "Heats per 100 parts", before: "108", after: "105", label: M },
  ],
  "ex-p4": [
    { metric: "Casting scrap", before: "3.0%", after: "2.7%", label: M },
    { metric: "Hold energy per stop", before: "45 kWh", after: "28 kWh", label: M },
  ],
  "ex-p5": [
    { metric: "Spindle load", before: "61%", after: "68%", label: M },
    { metric: "Tool life", before: "400 parts", after: "380 parts", label: M },
  ],
  "ex-p6": [
    { metric: "Energy per good part", before: "0.42 kWh", after: "0.40 kWh", label: M },
    { metric: "Scrap rate", before: "3.2%", after: "3.0%", label: M },
  ],
  "ex-q1": [
    { metric: "Reheat loads", before: "3 in 40", after: "1 in 40", label: M },
  ],
  "ex-q2": [
    { metric: "Laps found at inspection", before: "9 per week", after: "4 per week", label: M },
  ],
  "ex-q3": [
    { metric: "Misruns per heat", before: "5", after: "2", label: M },
  ],
  "ex-q4": [],
};

const CALC: Record<string, OutcomeCalculation[]> = {
  "ex-p1": [
    {
      metric: "Overheating scrap",
      inputs: ["Overheating scrap codes on the Forge line", "Parts forged per shift run", "Billet exit temperature on trial arm B"],
      formula: "Overheating scrap ÷ parts forged, trial arm B against prior arm A",
      result: "1.2 → 0.8%",
      label: M,
    },
    {
      metric: "Heats per 100 parts",
      inputs: ["Heats counted at heater H1", "Good parts forged"],
      formula: "Heats ÷ good parts × 100 (scrap and rework heats count in the numerator)",
      result: "106 → 104",
      label: M,
    },
  ],
  "ex-p2": [
    {
      metric: "Heats per 100 parts",
      inputs: ["Heats counted at heater H1", "Good parts forged", "Press stops under ten minutes"],
      formula: "Heats ÷ good parts × 100 (heats lost to cold restarts count in the numerator)",
      result: "109 → 104 (line 104)",
      label: M,
    },
    {
      metric: "Overheating scrap",
      inputs: ["Overheating scrap codes", "Parts forged"],
      formula: "Overheating scrap ÷ parts forged",
      result: "1.1 → 0.9%",
      label: M,
    },
    {
      metric: "Coil energy per 100 parts",
      inputs: ["Coil kWh", "Good parts forged"],
      formula: "Coil kWh ÷ good parts × 100, indexed to the prior level of 100",
      result: "100 → 96",
      label: M,
    },
  ],
  "ex-p3": [
    {
      metric: "Billets waiting at a stop",
      inputs: ["Billet count in the coil at each press stop", "Pusher rate and press stroke rate"],
      formula: "Mean billets in the coil at a stop, with the pusher paced to the press",
      result: "13 → 5",
      label: M,
    },
    {
      metric: "Overheating scrap",
      inputs: ["Overheating scrap codes", "Parts forged"],
      formula: "Overheating scrap ÷ parts forged",
      result: "1.2 → 0.9%",
      label: M,
    },
    {
      metric: "Heats per 100 parts",
      inputs: ["Heats counted at heater H1", "Good parts forged"],
      formula: "Heats ÷ good parts × 100",
      result: "108 → 105",
      label: M,
    },
  ],
  "ex-p4": [
    {
      metric: "Melt energy per tonne",
      inputs: ["Furnace M1 kWh", "Tonnes of good metal poured", "Metal returned to the furnace in the divisor"],
      formula: "kWh ÷ good tonnes (returned metal counts in the energy per good figure)",
      result: "612 → 574 kWh",
      label: M,
    },
    {
      metric: "Casting scrap",
      inputs: ["Casting scrap codes", "Castings poured"],
      formula: "Scrapped ÷ poured castings",
      result: "3.0 → 2.7%",
      label: M,
    },
    {
      metric: "Hold energy per stop",
      inputs: ["Furnace M1 kWh during mould-line stops", "Number of stops"],
      formula: "Stop-window kWh ÷ stops, with melt power eased",
      result: "45 → 28 kWh",
      label: M,
    },
  ],
  "ex-p5": [
    {
      metric: "Cycle time",
      inputs: ["VMC-2 cycle timer", "Finish-pass feed on the twin"],
      formula: "Mean cycle with the higher finish-pass feed, read from the twin",
      result: "108 → 103 s",
      label: M,
    },
    {
      metric: "Spindle load",
      inputs: ["Spindle load by pass", "Twin run at the higher feed"],
      formula: "Mean finish-pass spindle load on the twin",
      result: "61 → 68%",
      label: M,
    },
    {
      metric: "Tool life",
      inputs: ["Tool life count at each change", "Twin wear model"],
      formula: "Parts per tool at the higher feed, from the twin",
      result: "400 → 380 parts",
      label: M,
    },
  ],
  "ex-p6": [
    {
      metric: "Cycle time",
      inputs: ["Tool T3 cycle timer", "Part temperature at ejection"],
      formula: "Cool cut while the part is already stable at open",
      result: "33.2 → 32.4 s",
      label: M,
    },
    {
      metric: "Energy per good part",
      inputs: ["Press kWh", "Good parts", "Scrap and rework parts in the divisor"],
      formula: "kWh ÷ good parts (scrap and rework count in energy per good)",
      result: "0.42 → 0.40 kWh",
      label: M,
    },
    {
      metric: "Scrap rate",
      inputs: ["Vision scrap codes", "Parts produced"],
      formula: "Scrap ÷ parts",
      result: "3.2 → 3.0%",
      label: M,
    },
  ],
  "ex-q1": [
    {
      metric: "Baskets in hardness spec",
      inputs: ["Hardness on each basket", "Quench oil temperature by basket", "The three low baskets that followed an oil climb"],
      formula: "Baskets inside the hardness spec ÷ baskets quenched, with the next basket held",
      result: "93 → 97%",
      label: M,
    },
    {
      metric: "Reheat loads",
      inputs: ["Loads sent back for a second harden", "Loads quenched"],
      formula: "Reheated loads per 40 loads",
      result: "3 → 1 in 40",
      label: M,
    },
  ],
  "ex-q2": [
    {
      metric: "Defect escapes",
      inputs: ["Billet exit temperature by stroke", "Press force by stroke", "Inspection lap codes"],
      formula: "Forgings with a lap that reached inspection ÷ forgings, after an early flag",
      result: "2.1 → 1.2%",
      label: M,
    },
    {
      metric: "Laps found at inspection",
      inputs: ["Lap codes per week", "Strokes inside the risk pool"],
      formula: "Weekly lap count after the flagged stretch is checked first",
      result: "9 → 4 per week",
      label: M,
    },
  ],
  "ex-q3": [
    {
      metric: "Casting scrap",
      inputs: ["Pour temperature by ladle", "Misrun scrap on the last 30 heats", "Moulds held and checked"],
      formula: "Scrapped ÷ poured castings, with cold-poured moulds held",
      result: "3.6 → 2.5%",
      label: M,
    },
    {
      metric: "Misruns per heat",
      inputs: ["Misrun codes at shakeout", "Heats poured"],
      formula: "Misruns ÷ heats",
      result: "5 → 2",
      label: M,
    },
  ],
  "ex-q4": [
    {
      metric: "Bore scrap",
      inputs: ["Scrapped bores at HMC-1", "Casting id traced to its heat", "Carbon equivalent by heat"],
      formula: "Bore scrap ÷ bores machined, by heat, after the carbon equivalent target was corrected",
      result: "2.6 → 1.2% (line 1.2%)",
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
      formula: "Plant model from listed evidence",
      result: `${primary.before} → ${primary.after}`,
      label: primary.label,
    },
  ];
}
