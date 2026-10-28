/** Illustrative OEE loss trees and SMED step tables for process capability screens. */
const I = { illustrative: true as const };

export interface OeeLossNode {
  id: string;
  name: string;
  lossMin: number;
  children?: OeeLossNode[];
}

export interface OeeLossCard {
  illustrative: true;
  assetId: string;
  title: string;
  windowLabel: string;
  oeePct: number;
  availabilityPct: number;
  performancePct: number;
  qualityPct: number;
  tree: OeeLossNode;
}

export const oeeLossCards: OeeLossCard[] = [
  {
    ...I,
    assetId: "a-mixer",
    title: "Mixer M1 · Line A",
    windowLabel: "Last 7 days of batches",
    oeePct: 71.2,
    availabilityPct: 88.4,
    performancePct: 84.1,
    qualityPct: 95.8,
    tree: {
      id: "m1-root",
      name: "Scheduled time",
      lossMin: 10080,
      children: [
        {
          id: "m1-planned",
          name: "Planned downtime",
          lossMin: 720,
          children: [
            { id: "m1-pm", name: "Preventive maintenance", lossMin: 420 },
            { id: "m1-clean", name: "Clean-in-place", lossMin: 300 },
          ],
        },
        {
          id: "m1-unplanned",
          name: "Unplanned stops",
          lossMin: 540,
          children: [
            { id: "m1-jacket", name: "Jacket temperature alarm", lossMin: 220 },
            { id: "m1-agit", name: "Agitator torque high", lossMin: 180 },
            { id: "m1-other", name: "Other micro-stops", lossMin: 140 },
          ],
        },
        {
          id: "m1-rate",
          name: "Rate loss",
          lossMin: 680,
          children: [
            { id: "m1-hold", name: "Extended hold waiting on viscosity", lossMin: 410 },
            { id: "m1-charge", name: "Slow charge", lossMin: 270 },
          ],
        },
        {
          id: "m1-quality",
          name: "Quality loss",
          lossMin: 190,
          children: [{ id: "m1-rework", name: "Rework batches", lossMin: 190 }],
        },
      ],
    },
  },
  {
    ...I,
    assetId: "b-press",
    title: "Press P3 · Line B",
    windowLabel: "Last completed shift",
    oeePct: 68.5,
    availabilityPct: 91.0,
    performancePct: 79.4,
    qualityPct: 94.9,
    tree: {
      id: "p3-root",
      name: "Scheduled time",
      lossMin: 480,
      children: [
        {
          id: "p3-planned",
          name: "Planned downtime",
          lossMin: 36,
          children: [{ id: "p3-warm", name: "Warm-up after tool change", lossMin: 36 }],
        },
        {
          id: "p3-unplanned",
          name: "Unplanned stops",
          lossMin: 48,
          children: [
            { id: "p3-eject", name: "Eject fault", lossMin: 22 },
            { id: "p3-dry", name: "Dryer dew point", lossMin: 26 },
          ],
        },
        {
          id: "p3-rate",
          name: "Rate loss",
          lossMin: 62,
          children: [
            { id: "p3-cycle", name: "Cycle time above target", lossMin: 44 },
            { id: "p3-robot", name: "Robot queue", lossMin: 18 },
          ],
        },
        {
          id: "p3-quality",
          name: "Quality loss",
          lossMin: 24,
          children: [{ id: "p3-scrap", name: "Scrap at vision", lossMin: 24 }],
        },
      ],
    },
  },
];

export interface SmedStep {
  illustrative: true;
  id: string;
  lineId: string;
  phase: "internal" | "external";
  step: string;
  baselineMin: number;
  targetMin: number;
  lastObservedMin?: number;
  owner: string;
}

export const smedSteps: SmedStep[] = [
  { ...I, id: "sm-1", lineId: "line-b", phase: "external", step: "Pre-stage tool T3 on cart with water lines connected", baselineMin: 18, targetMin: 12, lastObservedMin: 14, owner: "Role 3." },
  { ...I, id: "sm-2", lineId: "line-b", phase: "external", step: "Pre-heat mould to recipe setpoint offline", baselineMin: 22, targetMin: 22, lastObservedMin: 21, owner: "Role 3." },
  { ...I, id: "sm-3", lineId: "line-b", phase: "internal", step: "Drain and disconnect water on running tool", baselineMin: 8, targetMin: 5, lastObservedMin: 7, owner: "Role 2." },
  { ...I, id: "sm-4", lineId: "line-b", phase: "internal", step: "Swap tool bolts and lift with crane", baselineMin: 14, targetMin: 9, lastObservedMin: 11, owner: "Role 2." },
  { ...I, id: "sm-5", lineId: "line-b", phase: "internal", step: "First-shot validation at reduced rate", baselineMin: 12, targetMin: 8, lastObservedMin: 10, owner: "Role 4." },
  { ...I, id: "sm-6", lineId: "line-b", phase: "external", step: "Return previous tool to storage and log wear index", baselineMin: 6, targetMin: 4, lastObservedMin: 5, owner: "Role 3." },
];
