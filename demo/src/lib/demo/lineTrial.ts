/** Synthetic line_scenario trial results for the Simulate screen.
 *
 * Rates come from plant_sim.line_scenario.trial. Pack thresholds stay unset,
 * so will-not-get-worse abstains. Never invent money or plant tariffs here.
 */
import fixture from "./lineTrialFixture.json";

export interface RateMetrics {
  lots_finished: number;
  scrap_count: number;
  scrap_rate: number;
  cold_shut_rate: number;
  hardness_fail_rate: number;
  dimensional_fail_rate: number;
}

export interface NoWorseOutcome {
  available: boolean;
  passed: boolean | null;
  reason: string;
}

export interface LineTrialResult {
  seed: number;
  seeds: number[];
  ticks: number;
  envelope_id: string;
  plant_id: string;
  line_id: string;
  candidate_knobs: Record<string, number>;
  baseline: RateMetrics;
  candidate: RateMetrics;
  scrap_rate_delta: number;
  no_worse: NoWorseOutcome;
  param_origin_note: string;
  source: string;
  kind: string;
}

export interface LineTrialCatalogue {
  generated_by: string;
  note: string;
  default_id: string;
  trials: Record<string, LineTrialResult>;
}

export const lineTrialCatalogue = fixture as LineTrialCatalogue;

export function listLineTrials(): { id: string; label: string; result: LineTrialResult }[] {
  return Object.entries(lineTrialCatalogue.trials).map(([id, result]) => ({
    id,
    label: labelFor(id, result),
    result,
  }));
}

export function getLineTrial(id: string | undefined): LineTrialResult {
  const key = id && lineTrialCatalogue.trials[id] ? id : lineTrialCatalogue.default_id;
  return lineTrialCatalogue.trials[key];
}

function labelFor(id: string, result: LineTrialResult): string {
  const knobs = Object.entries(result.candidate_knobs)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");
  return knobs ? `${id} (${knobs})` : id;
}

export function formatRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

export function formatDelta(delta: number): string {
  const pts = delta * 100;
  const sign = pts > 0 ? "+" : "";
  return `${sign}${pts.toFixed(1)} pt`;
}

export const SIMULATE_PAGE_META =
  "Offline synthetic line trial on plant-sim. Predicted scrap and rejection versus baseline. Will-not-get-worse abstains until pack thresholds are fitted. Not a plant result.";
