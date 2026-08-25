/**
 * DEPRECATED for app routes — use `@/lib/plant-catalog` for plant switcher metadata.
 * Remaining exports support legacy components until they are deleted (Phase 4).
 * App routes must not import overview-demo / machine-health / energy-analytics /
 * evidence-samples / plant-sections / assignments (see scripts/check-no-app-fixtures.mjs).
 */
export {
  DEMO_PLANT,
  VINAYAK_PLANT,
  LNM_PLANT,
  PLANTS,
  DEMO_SHELL_ROLE,
  connectionFixture,
  plantForId,
} from "@/lib/plant-catalog";

import type {
  Alarm,
  LedgerEntry,
  Prescription,
  TodaySignal,
} from "../lib/types";
import { DEMO_PLANT, LNM_PLANT, PLANTS, VINAYAK_PLANT } from "@/lib/plant-catalog";

export type DemoAsset = {
  id: string;
  label: string;
  area: string;
  loadPct: number;
  health: "calm" | "watch" | "hot";
  kwhMtd: number;
  pf?: number;
  mdContributionKva?: number;
};

/** @deprecated Empty — fixtures removed from product paths. */
export const assetsFixture: DemoAsset[] = [];

/** @deprecated */
export function alarmsForPlant(_plantId: string): Alarm[] {
  return [];
}

/** @deprecated */
export function prescriptionsForPlant(_plantId: string): Prescription[] {
  return [];
}

/** @deprecated */
export const alarmsFixture: Alarm[] = [];

/** @deprecated */
export const prescriptionsFixture: Prescription[] = [];

/** @deprecated */
export const ledgerFixture: LedgerEntry[] = [];

/** @deprecated */
export const todaySignalsFixture: TodaySignal[] = [];

/** @deprecated Zero stubs — keep fields required by legacy analytics consumers. */
export const energyKpisFixture = {
  mtdGridKwh: 0,
  peakMdKva: 0,
  cmdKva: 0,
  todPeakSharePct: 0,
  vsBaselinePct: 0,
};

/** @deprecated Zero stubs for intensitySnapshot. */
export const intensityDemoInput = {
  productionUnits: null as number | null,
  gridKwh: null as number | null,
  renewableKwh: null as number | null,
  emissionFactorTPerMwh: null as number | null,
  emissionFactorRef: null as string | null,
  cmdKva: 0,
  peakMdKva: 0,
};

/** @deprecated */
export function demoNeedsReviewCount() {
  return 0;
}

/** @deprecated */
export function demoNeedsReviewInr() {
  return 0;
}

/** @deprecated */
export function demoOpsConfirmedInr() {
  return 0;
}

/** @deprecated */
export const reportJobsFixture: unknown[] = [];

/** @deprecated */
export const apiKeysFixture: unknown[] = [];

/** @deprecated */
export const webhooksFixture: unknown[] = [];

/** @deprecated */
export const membersFixture: unknown[] = [];

/** @deprecated */
export const auditEventsFixture: unknown[] = [];

/** @deprecated */
export const investigationsFixture: unknown[] = [];

/** @deprecated */
export function findPrescription(_id: string): Prescription | undefined {
  return undefined;
}

/** @deprecated */
export function assetById(_id: string): DemoAsset | undefined {
  return undefined;
}

/** @deprecated */
export function consumersFromAssets(): Array<{
  assetId: string;
  label: string;
  kwh: number;
  sharePct: number;
  health: "calm" | "watch" | "hot";
}> {
  return [];
}

// Keep catalog symbols referenced so tree-shaking does not drop re-exports in odd bundlers.
void DEMO_PLANT;
void LNM_PLANT;
void PLANTS;
void VINAYAK_PLANT;
