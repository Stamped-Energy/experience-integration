/**
 * Illustrative control-loop campaigns (ADR-042). Rupee figures come from plant price fixtures only.
 */
import { proposals } from "./data";
import { generateOptimisationCampaigns, generateRunResults, generateSimulationCampaigns } from "./loopRunsExpand";

export type LoopRunType = "pid" | "mpc" | "rl";
export type LoopCampaignKind = "optimisation" | "simulation";

export interface LoopCampaign {
  id: string;
  area: "process" | "quality";
  kind: LoopCampaignKind;
  label: string;
  lineId: string;
  loopId: string;
  loopFamily: string;
  runType: LoopRunType;
  configsTried: number;
  status: "running" | "complete" | "chosen";
  startedAt: string;
  /** Illustrative plant-economics at this site's prices (INR/month), not a savings claim */
  ownerInrPerMonth?: number;
  ownerLabel?: string;
  chosenRunId?: string;
  proposalId?: string;
}

export interface LoopRunResult {
  id: string;
  campaignId: string;
  rank: number;
  label: string;
  scrapDelta: number;
  cycleDeltaS: number;
  constraintOk: boolean;
  score: number;
  /** Illustrative economics from the same plant price book as Home Owner view */
  ownerInrPerMonth?: number;
}

const ILL = { illustrative: true as const };

export const loopCampaigns: LoopCampaign[] = [
  ...generateOptimisationCampaigns(),
  ...generateSimulationCampaigns(),
];

export const loopRunResults: LoopRunResult[] = [
  ...generateRunResults(loopCampaigns),
];

export const runsForCampaign = (id: string) => loopRunResults.filter((r) => r.campaignId === id).sort((a, b) => b.score - a.score);

export const chosenProposal = () => proposals.find((p) => p.id === "prop-101");

export const RUN_TYPE_LABEL: Record<LoopRunType, string> = {
  pid: "PID / regulatory",
  mpc: "Model predictive control",
  rl: "Reinforcement learning policy",
};

export const RUN_TYPE_SOON: LoopRunType[] = ["mpc", "rl"];

export { ILL as LOOP_DEMO_ILLUSTRATIVE };
