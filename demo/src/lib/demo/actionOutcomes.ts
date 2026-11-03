/** Extra measurable outcomes and calculation steps per action card (illustrative demo). */
import type { ActionOutcome, ExampleAction, OutcomeCalculation } from "./types";
import { actionOutcomeForDisplay } from "./actions";

const METRICS: Record<string, ActionOutcome[]> = {
  "ex-p1": [
    { metric: "Energy per good part", before: "0.41 kWh/t", after: "0.40 to 0.41 kWh/t", label: "Estimated" },
    { metric: "Hold time", before: "55 min", after: "57 min", label: "Measured" },
  ],
  "ex-p2": [
    { metric: "Scrap on first batch", before: "8 to 12%", after: "2 to 5%", label: "Estimated" },
    { metric: "Cycle to discharge", before: "142 min", after: "136 to 140 min", label: "Modelled" },
  ],
  "ex-p3": [
    { metric: "Energy per good part", before: "0.39 kWh/t", after: "0.37 to 0.38 kWh/t", label: "Estimated" },
    { metric: "Scrap", before: "2.8%", after: "2.6 to 2.9%", label: "Measured" },
  ],
  "ex-p4": [
    { metric: "Scrap", before: "3.0%", after: "2.7 to 2.9%", label: "Estimated" },
    { metric: "Resin moisture", before: "0.18%", after: "0.12 to 0.15%", label: "Measured" },
    { metric: "Dryer cycle", before: "4.0 h", after: "3.5 h", label: "Measured" },
  ],
  "ex-p5": [
    { metric: "Energy per good part", before: "0.42 kWh/t", after: "0.41 to 0.42 kWh/t", label: "Measured" },
    { metric: "Scrap", before: "2.9%", after: "2.8 to 3.0%", label: "Measured" },
  ],
  "ex-p6": [
    { metric: "Reject rate", before: "420 ppm", after: "0 ppm", label: "Measured" },
    { metric: "Flash and short shots", before: "14 per shift", after: "0 per shift", label: "Measured" },
  ],
  "ex-q1": [
    { metric: "Scrap", before: "2.4%", after: "2.2 to 2.5%", label: "Estimated" },
    { metric: "Reject rate", before: "180 ppm", after: "90 to 120 ppm", label: "Estimated" },
  ],
  "ex-q2": [
    { metric: "Lab lead time", before: "40 min after discharge", after: "0 min at end of hold", label: "Measured" },
    { metric: "Scrap if over spec", before: "12 t lot", after: "3 to 5 t at risk", label: "Modelled" },
  ],
  "ex-q3": [
    { metric: "Material at risk", before: "24 t", after: "8 to 12 t", label: "Modelled" },
    { metric: "Energy per good part", before: "0.40 kWh/t", after: "0.39 to 0.40 kWh/t", label: "Estimated" },
  ],
  "ex-q4": [
    { metric: "Inspection time, cavity 2", before: "30 min per shift", after: "45 min per shift", label: "Measured" },
    { metric: "Reject rate", before: "210 ppm", after: "180 to 200 ppm", label: "Estimated" },
  ],
  "ex-q5": [
    { metric: "Part weight, cavity 2", before: "47.7 g", after: "48.0 to 48.2 g", label: "Measured" },
    { metric: "Reject rate", before: "380 ppm", after: "240 to 290 ppm", label: "Measured" },
  ],
  "ex-q6": [
    { metric: "Trace time on complaint", before: "45 min", after: "5 min", label: "Estimated" },
    { metric: "Lots at risk from gap", before: "3 lots", after: "0 lots", label: "Measured" },
  ],
};

const CALC: Record<string, OutcomeCalculation[]> = {
  "ex-p1": [
    { metric: "Viscosity at discharge", inputs: ["Batch 2418 path vs best 20 batches", "Jacket inlet 1.5 °C cool", "Hold extension 2 min"], formula: "Twin path + jacket offset → viscosity band", result: "2460 to 2540 mPa·s", label: "Modelled" },
    { metric: "Energy per good part", inputs: ["Extra hold 2 min", "Jacket duty cycle"], formula: "Δt_hold × jacket kW ÷ good tonnes", result: "≈0.01 kWh/t (demo)", label: "Estimated" },
    { metric: "Hold time", inputs: ["Standing approval 52 to 58 min", "Slow heat-up detected"], formula: "55 min → 57 min inside approval", result: "57 min for batch 2418", label: "Measured" },
  ],
  "ex-p2": [
    { metric: "Viscosity, first batch", inputs: ["5 best A-14 batches", "Two reworked changeovers"], formula: "Best-batch settings → first-batch band", result: "2650 to 2790 mPa·s", label: "Estimated" },
    { metric: "Scrap on first batch", inputs: ["Historical rework rate on A-14"], formula: "Rework batches ÷ first batches (demo)", result: "2 to 5%", label: "Estimated" },
    { metric: "Cycle to discharge", inputs: ["Hold 58 min", "Agitator 146 rpm"], formula: "Recipe time model (demo)", result: "136 to 140 min", label: "Modelled" },
  ],
  "ex-p3": [
    { metric: "Time to target viscosity", inputs: ["Alternating 84 vs 86 °C arms", "10 of 16 batches done"], formula: "Matched-batch median Δt to target", result: "8.0 to 11.0 min", label: "Measured" },
    { metric: "Energy per good part", inputs: ["Arm B jacket duty", "Good parts count"], formula: "kWh ÷ good tonnes per arm", result: "0.37 to 0.38 kWh/t", label: "Estimated" },
    { metric: "Scrap", inputs: ["Shift scrap logs during trial"], formula: "Scrap parts ÷ good parts", result: "2.6 to 2.9%", label: "Measured" },
  ],
  "ex-p4": [
    { metric: "Energy per good part", inputs: ["Output-adjusted kWh", "Resin lot change date"], formula: "kWh ÷ good tonnes, mix-adjusted", result: "0.36 to 0.39 kWh/t", label: "Estimated" },
    { metric: "Scrap", inputs: ["Moisture proxy from dew point"], formula: "Moisture → scrap elasticity (demo)", result: "2.7 to 2.9%", label: "Estimated" },
    { metric: "Resin moisture", inputs: ["Dew point at minus 40 °C", "Cycle length"], formula: "Dryer model equilibrium moisture", result: "0.12 to 0.15%", label: "Measured" },
    { metric: "Dryer cycle", inputs: ["Current 4.0 h cycle", "Dew point stable 30 min before end"], formula: "Shorten while dew point holds", result: "3.5 h planned", label: "Measured" },
  ],
  "ex-p5": [
    { metric: "Parts per shift", inputs: ["33.2 s cycle matched runs", "Production system counts"], formula: "Parts shift_after ÷ parts shift_before", result: "836 to 847 parts", label: "Measured" },
    { metric: "Energy per good part", inputs: ["Same matched runs"], formula: "kWh ÷ good parts", result: "0.41 to 0.42 kWh/t", label: "Measured" },
    { metric: "Scrap", inputs: ["Vision and scrap logs"], formula: "Scrap ÷ good parts", result: "2.8 to 3.0%", label: "Measured" },
  ],
  "ex-p6": [
    { metric: "Scrap from hold pressure", inputs: ["40 shift runs", "Defect map vs pressure"], formula: "Defects inside 640 to 820 bar only", result: "0% in 34 runs since narrow", label: "Measured" },
    { metric: "Reject rate", inputs: ["Customer reject records", "Hold pressure excursions"], formula: "Rejects ÷ parts × 10⁶", result: "0 ppm since narrow", label: "Measured" },
    { metric: "Flash and short shots", inputs: ["Vision defect codes"], formula: "Count per shift", result: "0 per shift", label: "Measured" },
  ],
  "ex-q1": [
    { metric: "Part weight, cavity 2", inputs: ["Vision weight last 3 shifts", "Lot 7713 estimated band"], formula: "Trend + band vs spec 47.6 g", result: "47.5 to 48.0 g → hold at 48.0 g", label: "Estimated" },
    { metric: "Scrap", inputs: ["Segregation plan", "Historical light parts"], formula: "Expected scrap if band crosses LSL (demo)", result: "2.2 to 2.5%", label: "Estimated" },
    { metric: "Reject rate", inputs: ["ppm if shipped at band edge"], formula: "Out-of-spec probability × volume", result: "90 to 120 ppm", label: "Estimated" },
  ],
  "ex-q2": [
    { metric: "Viscosity", inputs: ["Linked batches 2416–2417", "Torque and temperature"], formula: "Lot join model → viscosity band", result: "2540 to 2630 mPa·s", label: "Modelled" },
    { metric: "Lab lead time", inputs: ["Normal sample after discharge", "Early sample at end of hold"], formula: "Δt sampling point", result: "40 min earlier", label: "Measured" },
    { metric: "Scrap if over spec", inputs: ["Lot size 12 t", "Band vs USL 2600"], formula: "Fraction above USL × lot mass (demo)", result: "3 to 5 t at risk", label: "Modelled" },
  ],
  "ex-q3": [
    { metric: "Viscosity (next batches)", inputs: ["Torque 6% high", "Agitator correction band"], formula: "Process model Δrpm → Δviscosity", result: "2520 to 2590 mPa·s", label: "Modelled" },
    { metric: "Material at risk", inputs: ["Lots 3307 and 3296 mass"], formula: "Share of lot mass above spec if uncorrected (demo)", result: "8 to 12 t", label: "Modelled" },
    { metric: "Energy per good part", inputs: ["Higher agitator duty"], formula: "ΔkWh ÷ good tonnes (demo)", result: "0.39 to 0.40 kWh/t", label: "Estimated" },
  ],
  "ex-q4": [
    { metric: "Inspection time, cavity 1", inputs: ["Hourly vs 2-hourly plan", "Shift length"], formula: "Weigh events × minutes", result: "30 min per shift saved on cavity 1", label: "Measured" },
    { metric: "Inspection time, cavity 2", inputs: ["Freed time reallocated"], formula: "Shift minutes moved to cavity 2", result: "45 min per shift on cavity 2", label: "Measured" },
    { metric: "Reject rate", inputs: ["Cavity 2 drift history"], formula: "ppm with reallocated checks (demo)", result: "180 to 200 ppm", label: "Estimated" },
  ],
  "ex-q5": [
    { metric: "Scrap", inputs: ["Lots after hold pressure change", "Before 3.2% baseline"], formula: "Scrap ÷ good parts", result: "2.9%", label: "Measured" },
    { metric: "Part weight, cavity 2", inputs: ["Vision after correction"], formula: "Mean weight vs prior 47.7 g", result: "48.0 to 48.2 g", label: "Measured" },
    { metric: "Reject rate", inputs: ["Customer rejects", "Volume shipped"], formula: "Rejects ÷ parts × 10⁶", result: "240 to 290 ppm", label: "Measured" },
  ],
  "ex-q6": [
    { metric: "Link confidence, lot 7721", inputs: ["Time proximity", "Recipe match", "Sequence", "Missing scan"], formula: "Weighted join score (demo)", result: "0.71 → 0.94 confirmed", label: "Measured" },
    { metric: "Trace time on complaint", inputs: ["Manual trace without link", "Linked lot record"], formula: "Median trace minutes (demo)", result: "45 min → 5 min", label: "Estimated" },
    { metric: "Lots at risk from gap", inputs: ["Scanner gap window", "Unlinked lots"], formula: "Lots in gap hour", result: "0 after confirm", label: "Measured" },
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
  return out;
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
