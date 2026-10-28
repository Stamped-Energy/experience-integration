import fixture from "./lineTrialFixture.json";

export type LineTrialFixture = {
  illustrative: boolean;
  lineId: string;
  title: string;
  window: string;
  unit: string;
  baseline: { label: string; rate: number; scrapPct: number; cycleSec: number };
  candidate: { label: string; rate: number; scrapPct: number; cycleSec: number };
  guardrails: { scrapThresholdPct: number | null; cycleThresholdSec: number | null; note: string };
  steps: { id: string; name: string; done: boolean }[];
};

export const lineTrial: LineTrialFixture = fixture as LineTrialFixture;

export function lineTrialAbstains(): string[] {
  const out: string[] = [];
  if (lineTrial.guardrails.scrapThresholdPct == null) {
    out.push("Scrap will-not-get-worse: no signed threshold set, Stamped abstains from a pass or fail call.");
  }
  if (lineTrial.guardrails.cycleThresholdSec == null) {
    out.push("Cycle time will-not-get-worse: no signed threshold set, Stamped abstains from a pass or fail call.");
  }
  return out;
}
