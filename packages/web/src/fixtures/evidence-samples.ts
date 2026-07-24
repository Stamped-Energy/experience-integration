/** Rich per-item evidence samples — each opens at `/evidence/[id]`. */

export type EvidenceTagRow = {
  tag: string;
  value: string;
  window: string;
};

export type EvidenceDialSpec = {
  label: string;
  /** Needle position on the arc. */
  needle: number;
  needleMax?: number;
  /** Centre readout (shown inside the dial). */
  display: string;
  unit?: string;
};

export type EvidenceLinePoint = { x: number; y: number };

export type EvidenceBarPoint = {
  label: string;
  value: number;
  highlight?: boolean;
};

export type EvidenceChartSpec =
  | {
      kind: "line";
      yAxisLabel: string;
      points: EvidenceLinePoint[];
      highlight?: { from: number; to: number; label: string };
    }
  | {
      kind: "bar";
      yAxisLabel: string;
      bars: EvidenceBarPoint[];
      annotation?: string;
    };

export type EvidenceCategoryTone = "critical" | "good" | "info" | "warning";

export type EvidenceSample = {
  id: string;
  plantId: string;
  /** Short chart section title, e.g. "SIGNAL WINDOW · MON 07:00-07:15" */
  chartTitle: string;
  categoryBadge: { label: string; tone: EvidenceCategoryTone };
  chart: EvidenceChartSpec;
  tagRows: EvidenceTagRow[];
  /** Monospace lineage string */
  metadata: string;
  mvFooter: string;
  dials: EvidenceDialSpec[];
  alarmId?: string;
  rxId?: string;
  findingId?: string;
  baselineId?: string;
  assetLabel: string;
  assetId: string;
  /** Issue statement shown as the card heading on the Evidence index. */
  issueTitle: string;
};

export const evidenceSamplesFixture: EvidenceSample[] = [
  {
    id: "evd_4401",
    issueTitle: "Kiln 1 and Mill 2 co-start pushed MD into TOD peak",
    plantId: "plant_rvpnl_demo",
    assetId: "kiln_1",
    assetLabel: "Kiln 1",
    findingId: "fnd_4401",
    alarmId: "alm_1001",
    rxId: "rx_9001",
    baselineId: "bl_kiln_1_7d",
    chartTitle: "SIGNAL WINDOW · MON 07:00–07:15",
    categoryBadge: { label: "MD window", tone: "critical" },
    chart: {
      kind: "line",
      yAxisLabel: "kVA",
      points: [
        { x: 0, y: 720 },
        { x: 1, y: 735 },
        { x: 2, y: 748 },
        { x: 3, y: 812 },
        { x: 4, y: 905 },
        { x: 5, y: 920 },
        { x: 6, y: 918 },
        { x: 7, y: 890 },
        { x: 8, y: 860 },
        { x: 9, y: 845 },
        { x: 10, y: 830 },
        { x: 11, y: 810 },
        { x: 12, y: 798 },
        { x: 13, y: 785 },
        { x: 14, y: 775 },
      ],
      highlight: { from: 3, to: 7, label: "overlap" },
    },
    tagRows: [
      { tag: "HT_INCOMER.MD", value: "920 kVA", window: "07:06–07:10" },
      { tag: "CHILLER_8.START", value: "TRUE", window: "07:02" },
      { tag: "KILN_1.LOAD", value: "108%", window: "07:06–07:10" },
      { tag: "MILL_2.START", value: "TRUE", window: "07:05" },
    ],
    metadata:
      "physics/md_overlap@v2.4 · model conf 0.90 · tariff MD slab · baseline Apr peak week",
    mvFooter: "M&V · verify on next DISCOM MD line · plan locked at issue.",
    dials: [
      { label: "Kiln load", needle: 108, needleMax: 120, display: "108", unit: "%" },
      { label: "Incomer MD", needle: 92, needleMax: 100, display: "920", unit: " kVA" },
      { label: "CMD headroom", needle: 6.4, needleMax: 100, display: "6.4", unit: "%" },
    ],
  },
  {
    id: "evd_4410",
    issueTitle: "Main incomer rolling MD at 6.4% headroom to CMD",
    plantId: "plant_rvpnl_demo",
    assetId: "incomer",
    assetLabel: "Main incomer",
    findingId: "fnd_4410",
    alarmId: "alm_1005",
    rxId: "rx_9001",
    baselineId: "bl_kiln_1_7d",
    chartTitle: "ROLLING MD · 15-MIN WINDOW",
    categoryBadge: { label: "MD window", tone: "critical" },
    chart: {
      kind: "line",
      yAxisLabel: "kVA",
      points: [
        { x: 0, y: 4200 },
        { x: 1, y: 4310 },
        { x: 2, y: 4450 },
        { x: 3, y: 4580 },
        { x: 4, y: 4680 },
        { x: 5, y: 4720 },
        { x: 6, y: 4690 },
        { x: 7, y: 4610 },
        { x: 8, y: 4520 },
      ],
      highlight: { from: 3, to: 6, label: "peak band" },
    },
    tagRows: [
      { tag: "HT_INCOMER.MD", value: "4,680 kVA", window: "10:00–10:15" },
      { tag: "CMD.HEADROOM", value: "6.4%", window: "rolling" },
      { tag: "KILN_1.START", value: "TRUE", window: "10:02" },
      { tag: "MILL_2.START", value: "TRUE", window: "10:04" },
    ],
    metadata:
      "physics/md_coincidence@v3.1 · model conf 0.88 · CMD slab · baseline peak week",
    mvFooter: "M&V · reconcile with DISCOM MD register · stagger co-start before next peak.",
    dials: [
      { label: "Rolling MD", needle: 93.6, needleMax: 100, display: "4,680", unit: " kVA" },
      { label: "CMD util", needle: 93.6, needleMax: 100, display: "93.6", unit: "%" },
      { label: "Peak TOD", needle: 100, needleMax: 100, display: "Peak", unit: "" },
    ],
  },
  {
    id: "evd_4411",
    issueTitle: "Raw Mill 2 idle draw above night baseline",
    plantId: "plant_rvpnl_demo",
    assetId: "mill_2",
    assetLabel: "Raw Mill 2",
    findingId: "fnd_4411",
    alarmId: "alm_1006",
    rxId: "rx_9005",
    baselineId: "bl_mill_2_night",
    chartTitle: "IDLE SUITE WINDOWS · LAST 6 EVENTS",
    categoryBadge: { label: "Idle kWh", tone: "good" },
    chart: {
      kind: "bar",
      yAxisLabel: "kWh unload",
      bars: [
        { label: "E1", value: 62 },
        { label: "E2", value: 71 },
        { label: "E3", value: 95, highlight: true },
        { label: "E4", value: 68 },
        { label: "E5", value: 74 },
        { label: "E6", value: 69 },
      ],
      annotation: "3/5 waste events",
    },
    tagRows: [
      { tag: "AHU_S3.RUN", value: "Full duty", window: "40 min avg" },
      { tag: "MILL_2.IDLE_KWH", value: "95 kWh", window: "per event" },
      { tag: "NIGHT.BASELINE", value: "+18%", window: "47 min" },
      { tag: "FEEDER.TOD", value: "Off-peak", window: "22:00–06:00" },
    ],
    metadata:
      "physics/hvac_idle@v1.5 · model conf 0.86 · ToD energy line · baseline last 6 idle windows",
    mvFooter: "M&V · compare unload kWh vs night baseline · owner sign-off on cutback plan.",
    dials: [
      { label: "Idle draw", needle: 118, needleMax: 120, display: "118", unit: "%" },
      { label: "Night kWh", needle: 79, needleMax: 100, display: "95", unit: " kWh" },
      { label: "Duration", needle: 78, needleMax: 100, display: "47", unit: " min" },
    ],
  },
  {
    id: "evd_4402",
    issueTitle: "Cement Mill 1 PF drifting toward penalty slab",
    plantId: "plant_rvpnl_demo",
    assetId: "cm_1",
    assetLabel: "Cement Mill 1",
    findingId: "fnd_4402",
    alarmId: "alm_1002",
    rxId: "rx_9002",
    baselineId: "bl_mill_1_pf",
    chartTitle: "PF DRIFT · BILLING WINDOW",
    categoryBadge: { label: "PF slab", tone: "warning" },
    chart: {
      kind: "line",
      yAxisLabel: "PF",
      points: [
        { x: 0, y: 0.92 },
        { x: 1, y: 0.91 },
        { x: 2, y: 0.9 },
        { x: 3, y: 0.88 },
        { x: 4, y: 0.86 },
        { x: 5, y: 0.84 },
        { x: 6, y: 0.83 },
        { x: 7, y: 0.82 },
      ],
      highlight: { from: 4, to: 7, label: "penalty band" },
    },
    tagRows: [
      { tag: "CM_1.PF", value: "0.84", window: "rolling 30d" },
      { tag: "APFC.STAGE_3", value: "OUT", window: "since Jun 18" },
      { tag: "KVAR.PENALTY", value: "Projected", window: "billing window" },
      { tag: "APFC.SETPOINT", value: "0.98", window: "design" },
    ],
    metadata:
      "physics/pf_drift@v1.2 · model conf 0.91 · PF penalty slab · baseline healthy APFC week",
    mvFooter: "M&V · verify PF on next bill line after stage 3 replacement · ops-confirmed only.",
    dials: [
      { label: "Power factor", needle: 84, needleMax: 100, display: "0.84", unit: "" },
      { label: "kVAR load", needle: 72, needleMax: 100, display: "72", unit: "%" },
      { label: "APFC cap", needle: 67, needleMax: 100, display: "67", unit: "%" },
    ],
  },
];

const byId = new Map(evidenceSamplesFixture.map((s) => [s.id, s]));
const byFinding = new Map(
  evidenceSamplesFixture.filter((s) => s.findingId).map((s) => [s.findingId!, s]),
);
const byAlarm = new Map(
  evidenceSamplesFixture.filter((s) => s.alarmId).map((s) => [s.alarmId!, s]),
);
const byRx = new Map<string, EvidenceSample>();
for (const s of evidenceSamplesFixture) {
  if (s.rxId && !byRx.has(s.rxId)) byRx.set(s.rxId, s);
}

export function findEvidenceSample(id: string): EvidenceSample | undefined {
  return byId.get(id);
}

export function resolveEvidenceIdForAlarm(alarmId: string): string | undefined {
  return byAlarm.get(alarmId)?.id;
}

export function resolveEvidenceIdForRx(rxId: string): string | undefined {
  return byRx.get(rxId)?.id;
}

export function resolveEvidenceIdForFinding(findingId: string): string | undefined {
  return byFinding.get(findingId)?.id;
}

/** Primary evidence id for deep links — prefers alarm, then rx, then finding. */
export function resolvePrimaryEvidenceId(input: {
  alarmId?: string;
  rxId?: string;
  findingId?: string;
}): string | undefined {
  if (input.alarmId) {
    const id = resolveEvidenceIdForAlarm(input.alarmId);
    if (id) return id;
  }
  if (input.rxId) {
    const id = resolveEvidenceIdForRx(input.rxId);
    if (id) return id;
  }
  if (input.findingId) {
    return resolveEvidenceIdForFinding(input.findingId);
  }
  return undefined;
}
