/**
 * Illustrative control-loop campaigns (ADR-042). Rupee figures come from plant price fixtures only.
 */
import { proposals } from "./data";

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
  {
    id: "camp-p-opt-1",
    area: "process",
    kind: "optimisation",
    label: "Press P3 barrel temperature loops",
    lineId: "line-b",
    loopId: "loop-press-barrel-temp",
    loopFamily: "Press / stamping",
    runType: "pid",
    configsTried: 1,
    status: "complete",
    startedAt: "2026-10-28T09:00:00+05:30",
    ownerInrPerMonth: 84000,
    ownerLabel: "Illustrative margin at plant prices if hold-pressure band holds",
  },
  {
    id: "camp-p-sim-1",
    area: "process",
    kind: "simulation",
    label: "Agent search on hold pressure and cycle",
    lineId: "line-b",
    loopId: "loop-press-hold",
    loopFamily: "Press / stamping",
    runType: "pid",
    configsTried: 12,
    status: "chosen",
    startedAt: "2026-10-29T14:20:00+05:30",
    chosenRunId: "run-p-sim-1-7",
    proposalId: "prop-101",
    ownerInrPerMonth: 112000,
    ownerLabel: "Illustrative at plant prices (candidate vs baseline in simulation)",
  },
  {
    id: "camp-p-sim-2",
    area: "process",
    kind: "simulation",
    label: "HT furnace zone 2 and soak schedule",
    lineId: "line-a",
    loopId: "loop-ht-zone2",
    loopFamily: "Heat treat / batch furnace",
    runType: "pid",
    configsTried: 8,
    status: "complete",
    startedAt: "2026-10-27T11:00:00+05:30",
    ownerInrPerMonth: 56000,
    ownerLabel: "Illustrative energy and rework at plant prices",
  },
  {
    id: "camp-p-sim-3",
    area: "process",
    kind: "simulation",
    label: "Induction billet heat power/speed",
    lineId: "line-b",
    loopId: "loop-forge-induction",
    loopFamily: "Forging / billet heat",
    runType: "pid",
    configsTried: 6,
    status: "running",
    startedAt: "2026-10-30T08:00:00+05:30",
  },
  {
    id: "camp-q-sim-1",
    area: "quality",
    kind: "simulation",
    label: "Sampling plan for lot 3307 hardness band",
    lineId: "line-a",
    loopId: "loop-qc-sample",
    loopFamily: "Quality sampling",
    runType: "pid",
    configsTried: 5,
    status: "complete",
    startedAt: "2026-10-26T16:00:00+05:30",
    ownerInrPerMonth: 32000,
    ownerLabel: "Illustrative scrap avoided at plant prices (simulation)",
  },
];

export const loopRunResults: LoopRunResult[] = [
  { id: "run-p-sim-1-1", campaignId: "camp-p-sim-1", rank: 1, label: "Config A", scrapDelta: -0.4, cycleDeltaS: 0.2, constraintOk: true, score: 0.71, ownerInrPerMonth: 88000 },
  { id: "run-p-sim-1-2", campaignId: "camp-p-sim-1", rank: 2, label: "Config B", scrapDelta: -0.6, cycleDeltaS: 0.8, constraintOk: true, score: 0.82, ownerInrPerMonth: 96000 },
  { id: "run-p-sim-1-3", campaignId: "camp-p-sim-1", rank: 3, label: "Config C", scrapDelta: -0.2, cycleDeltaS: -0.1, constraintOk: true, score: 0.65, ownerInrPerMonth: 72000 },
  { id: "run-p-sim-1-4", campaignId: "camp-p-sim-1", rank: 4, label: "Config D", scrapDelta: -0.5, cycleDeltaS: 0.4, constraintOk: false, score: 0.0, ownerInrPerMonth: undefined },
  { id: "run-p-sim-1-5", campaignId: "camp-p-sim-1", rank: 5, label: "Config E", scrapDelta: -0.3, cycleDeltaS: 0.0, constraintOk: true, score: 0.68, ownerInrPerMonth: 80000 },
  { id: "run-p-sim-1-6", campaignId: "camp-p-sim-1", rank: 6, label: "Config F", scrapDelta: -0.55, cycleDeltaS: 1.1, constraintOk: true, score: 0.79, ownerInrPerMonth: 104000 },
  { id: "run-p-sim-1-7", campaignId: "camp-p-sim-1", rank: 7, label: "Config G (chosen)", scrapDelta: -0.58, cycleDeltaS: 0.35, constraintOk: true, score: 0.91, ownerInrPerMonth: 112000 },
  { id: "run-p-sim-1-8", campaignId: "camp-p-sim-1", rank: 8, label: "Config H", scrapDelta: -0.1, cycleDeltaS: -0.2, constraintOk: true, score: 0.55, ownerInrPerMonth: 48000 },
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
