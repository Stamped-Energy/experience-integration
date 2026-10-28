/** Illustrative tool-life cards for Press P3. Taylor n and C appear only when fitted from enough indexed changes. */
import type { EvidenceLabel } from "./types";

const I = { illustrative: true as const };

export type ToolLifeTaylor = {
  kind: "taylor";
  id: string;
  assetId: string;
  toolLabel: string;
  material: string;
  speedMmin: number;
  feedMmRev: number;
  n: number;
  C: number;
  minutesUsed: number;
  minutesRemaining: number;
  indexedChanges: number;
  label: EvidenceLabel;
};

export type ToolLifeAbstain = {
  kind: "abstain";
  id: string;
  assetId: string;
  toolLabel: string;
  reason: string;
  missing: string[];
};

export type ToolLifeCard = (ToolLifeTaylor | ToolLifeAbstain) & { illustrative: true };

export const toolLifeCards: ToolLifeCard[] = [
  {
    ...I,
    kind: "taylor",
    id: "tl-t3",
    assetId: "b-press",
    toolLabel: "Tool T3 · Housing B-40",
    material: "PBT GF30",
    speedMmin: 85,
    feedMmRev: 0.18,
    n: 0.22,
    C: 1840,
    minutesUsed: 612,
    minutesRemaining: 318,
    indexedChanges: 14,
    label: "Modelled",
  },
  {
    ...I,
    kind: "taylor",
    id: "tl-t2",
    assetId: "b-press",
    toolLabel: "Tool T2 · Cover plate",
    material: "ABS",
    speedMmin: 92,
    feedMmRev: 0.15,
    n: 0.19,
    C: 2260,
    minutesUsed: 940,
    minutesRemaining: 420,
    indexedChanges: 11,
    label: "Modelled",
  },
  {
    ...I,
    kind: "abstain",
    id: "tl-t4",
    assetId: "b-press",
    toolLabel: "Tool T4 · Bracket (trial cavity)",
    reason: "Taylor parameters are not estimated yet.",
    missing: [
      "At least eight indexed tool changes with speed and feed logged",
      "Wear index aligned to the same material family",
    ],
  },
  {
    ...I,
    kind: "abstain",
    id: "tl-m1",
    assetId: "a-mixer",
    toolLabel: "Agitator blade set · Line A",
    reason: "This asset is not on a tool-life programme in the demo plant.",
    missing: ["Tool-life is scoped to discrete machining and moulding tools on Line B"],
  },
];
