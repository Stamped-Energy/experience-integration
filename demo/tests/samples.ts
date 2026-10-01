/**
 * Minimal typed fixtures for unit tests only — not imported by app routes.
 * Product demo fixtures stay empty after defixture.
 */
import type {
  Alarm,
  LedgerEntry,
  Prescription,
  TodaySignal,
} from "../src/lib/types.js";
import { DEMO_PLANT } from "../src/lib/plant-catalog.js";

const plantId = DEMO_PLANT.plantId;

export const sampleAlarms: Alarm[] = [
  {
    id: "alm_1001",
    plantId,
    assetId: "kiln_1",
    assetLabel: "Kiln 1",
    severity: "critical",
    state: "raised",
    summary:
      "Load 108% - 14% above design; MD coincidence risk in 10–11 TOD peak",
    raisedAt: "2026-07-21T09:40:00+05:30",
    relatedPrescriptionId: "rx_9001",
    findingId: "fnd_4401",
  },
  {
    id: "alm_1005",
    plantId,
    assetId: "incomer",
    assetLabel: "Main incomer",
    severity: "critical",
    state: "raised",
    summary: "Rolling 15-min MD at 4,680 kVA - 6.4% headroom to CMD",
    raisedAt: "2026-07-21T10:05:00+05:30",
    relatedPrescriptionId: "rx_9001",
    findingId: "fnd_4410",
  },
  {
    id: "alm_1006",
    plantId,
    assetId: "mill_2",
    assetLabel: "Raw Mill 2",
    severity: "warning",
    state: "escalated",
    summary: "Idle draw 18% above night baseline for 47 minutes",
    raisedAt: "2026-07-21T07:22:00+05:30",
    ownerRole: "operator",
    relatedPrescriptionId: "rx_9005",
    findingId: "fnd_4411",
  },
];

export const samplePrescriptions: Prescription[] = [
  {
    id: "rx_9001",
    plantId,
    title: "Stagger Kiln 1 co-start with Mill 2 by 10 minutes",
    why: "They started together and pushed MD over the TOD peak",
    impactInrPerMonth: 84_000,
    confidence: 0.86,
    lane: "needs_review",
    ownerRole: "supervisor",
    dueAt: "2026-07-22T18:00:00+05:30",
    relatedAlarmId: "alm_1001",
  },
  {
    id: "rx_9005",
    plantId,
    title: "Cut Raw Mill 2 idle draw on night windows",
    why: "Idle draw 18% above night baseline for 47 minutes",
    impactInrPerMonth: 42_000,
    confidence: 0.81,
    lane: "needs_review",
    ownerRole: "operator",
    dueAt: "2026-07-22T22:00:00+05:30",
    relatedAlarmId: "alm_1006",
  },
];

/** Ops-confirmed realised sum = 41_600; pending+modeled potential ≥ 84_000. */
export const sampleLedger: LedgerEntry[] = [
  {
    entryId: "led_1001",
    plantId,
    prescriptionId: "rx_9004",
    title: "Shift non-critical HVAC off peak",
    entryType: "realised_savings",
    periodStart: "2026-07-01T00:00:00+05:30",
    periodEnd: "2026-07-21T00:00:00+05:30",
    potentialInr: 12_000,
    realisedInr: 11_200,
    verificationStatus: "ops_confirmed",
    mvMethod: "IPMVP Option B",
    baselineId: "bl_hvac_admin_7d",
    emissionFactorRef: "cea_grid_india_2024_v1",
  },
  {
    entryId: "led_1009",
    plantId,
    prescriptionId: "rx_9009",
    title: "Replace failed APFC stage 3 capacitor",
    entryType: "realised_savings",
    periodStart: "2026-07-01T00:00:00+05:30",
    periodEnd: "2026-07-21T00:00:00+05:30",
    potentialInr: 19_000,
    realisedInr: 17_600,
    verificationStatus: "ops_confirmed",
    mvMethod: "IPMVP Option B",
    baselineId: "bl_mill_1_pf",
    emissionFactorRef: "cea_grid_india_2024_v1",
  },
  {
    entryId: "led_1010",
    plantId,
    prescriptionId: "rx_9008",
    title: "Leak survey - instrument air loop B",
    entryType: "realised_savings",
    periodStart: "2026-06-15T00:00:00+05:30",
    periodEnd: "2026-07-15T00:00:00+05:30",
    potentialInr: 15_000,
    realisedInr: 12_800,
    verificationStatus: "ops_confirmed",
    mvMethod: "IPMVP Option A",
    baselineId: "bl_air_loop_b",
    emissionFactorRef: "cea_grid_india_2024_v1",
  },
  {
    entryId: "led_1002",
    plantId,
    prescriptionId: "rx_9001",
    title: "Stagger Kiln 1 co-start with Mill 2",
    entryType: "potential_savings",
    periodStart: "2026-07-01T00:00:00+05:30",
    periodEnd: "2026-07-31T00:00:00+05:30",
    potentialInr: 84_000,
    realisedInr: 0,
    verificationStatus: "pending",
    mvMethod: "IPMVP Option C",
    baselineId: "bl_kiln_1_7d",
    emissionFactorRef: "cea_grid_india_2024_v1",
  },
  {
    entryId: "led_1003",
    plantId,
    prescriptionId: "rx_9002",
    title: "APFC health check - Cement Mill 1",
    entryType: "opportunity_cost",
    periodStart: "2026-07-01T00:00:00+05:30",
    periodEnd: "2026-07-21T00:00:00+05:30",
    potentialInr: 38_000,
    realisedInr: 0,
    verificationStatus: "modeled",
    mvMethod: "TOD slab baseline",
    baselineId: "bl_mill_1_pf",
    emissionFactorRef: null,
    modeledReason: "Delay cost while APFC outage continues",
  },
];

export const sampleTodaySignals: TodaySignal[] = [
  {
    id: "alarms",
    label: "Critical alarms",
    value: "2 open",
    tone: "critical",
    href: "/alarms",
    hint: "Ack before shift handoff",
  },
  {
    id: "rx",
    label: "Needs review",
    value: "₹1.3L / mo",
    tone: "warning",
    href: "/prescriptions",
    hint: "2 prescriptions",
  },
  {
    id: "savings",
    label: "Confirmed savings (MTD)",
    value: "₹41.6k",
    tone: "good",
    href: "/reports",
    hint: "Confirmed this month",
  },
  {
    id: "deviation",
    label: "Vs baseline (7d)",
    value: "+4.2%",
    tone: "warning",
    href: "/evidence",
    hint: "Kiln 1 + Mill 1 drive",
  },
  {
    id: "closure",
    label: "Closure rate (30d)",
    value: "64%",
    tone: "good",
    href: "/prescriptions",
  },
  {
    id: "stale",
    label: "Telemetry",
    value: "Fresh",
    tone: "neutral",
    href: "/evidence",
    hint: "Last sample 42s ago",
  },
  {
    id: "md",
    label: "MD headroom",
    value: "6.4%",
    tone: "warning",
    href: "/intensity",
    hint: "Peak 4,680 / CMD 5,000 kVA",
  },
];

/** Ranked consumers with shares totaling ~100% (excludes incomer). */
export const sampleConsumers: Array<{
  assetId: string;
  label: string;
  kwh: number;
  sharePct: number;
  health: "calm" | "watch" | "hot";
}> = [
  {
    assetId: "kiln_1",
    label: "Kiln 1",
    kwh: 412_000,
    sharePct: 39.5,
    health: "hot",
  },
  {
    assetId: "cm_1",
    label: "Cement Mill 1",
    kwh: 268_000,
    sharePct: 25.7,
    health: "watch",
  },
  {
    assetId: "mill_2",
    label: "Raw Mill 2",
    kwh: 191_000,
    sharePct: 18.3,
    health: "calm",
  },
  {
    assetId: "comp_2",
    label: "Compressor 2",
    kwh: 84_000,
    sharePct: 8.1,
    health: "calm",
  },
  {
    assetId: "pack_1",
    label: "Packing line 1",
    kwh: 61_000,
    sharePct: 5.8,
    health: "calm",
  },
  {
    assetId: "hvac_admin",
    label: "Admin HVAC",
    kwh: 28_000,
    sharePct: 2.6,
    health: "calm",
  },
];
