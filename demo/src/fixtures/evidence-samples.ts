/** Rich per-item evidence samples - each opens at `/evidence/[id]`. */

import type { PlantOutcome } from "@/lib/types";

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
  /** Fixture capture time used to keep the proof index newest-first. */
  capturedAt?: string;
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
  outcome?: PlantOutcome;
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
    outcome: "dynamic_production_planning",
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
      "MD overlap detection · 90% confidence · tariff MD slab · baseline Apr peak week",
    mvFooter: "Savings verification · confirm on next utility MD reading · plan locked at issue.",
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
    outcome: "dynamic_production_planning",
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
      "MD coincidence detection · 88% confidence · CMD slab · baseline peak week",
    mvFooter: "Savings verification · reconcile with utility MD register · stagger co-start before next peak.",
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
    outcome: "energy_waste",
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
      "HVAC idle detection · 86% confidence · ToD energy line · baseline last 6 idle windows",
    mvFooter: "Savings verification · compare unload kWh vs night baseline · owner sign-off on cutback plan.",
    dials: [
      { label: "Idle draw", needle: 118, needleMax: 120, display: "118", unit: "%" },
      { label: "Night kWh", needle: 79, needleMax: 100, display: "95", unit: " kWh" },
      { label: "Duration", needle: 78, needleMax: 100, display: "47", unit: " min" },
    ],
  },
  {
    id: "evd_4412",
    issueTitle: "Three VFD compressors running part-load simultaneously",
    plantId: "plant_rvpnl_demo",
    assetId: "comp_2",
    assetLabel: "Compressor bank",
    rxId: "rx_9011",
    outcome: "uptime",
    baselineId: "bl_comp_vfd_30d",
    chartTitle: "COMPRESSOR kW · 06:30 SNAPSHOT",
    categoryBadge: { label: "Part-load", tone: "warning" },
    chart: {
      kind: "bar",
      yAxisLabel: "kW",
      bars: [
        { label: "U-1", value: 43 },
        { label: "U-2", value: 54 },
        { label: "U-3", value: 68, highlight: true },
        { label: "2-unit", value: 97 },
      ],
      annotation: "3rd unit waste",
    },
    tagRows: [
      { tag: "COMP_1.KW", value: "43 kW", window: "06:30" },
      { tag: "COMP_2.KW", value: "54 kW", window: "06:30" },
      { tag: "COMP_3.KW", value: "68 kW", window: "06:30" },
      { tag: "HEADER.PRESS", value: "6.8 bar", window: "06:30" },
    ],
    metadata:
      "Compressor sequencing rule · 88% confidence · energy kWh line · baseline sequenced 2-unit week",
    mvFooter: "Savings verification · compare 3-unit vs 2-unit kWh over 30 d · sequencer commissioning checklist.",
    dials: [
      { label: "Unit-1 load", needle: 57, needleMax: 100, display: "43", unit: " kW" },
      { label: "Unit-3 load", needle: 91, needleMax: 100, display: "68", unit: " kW" },
      { label: "Units online", needle: 100, needleMax: 100, display: "3", unit: "" },
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
    outcome: "energy_waste",
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
      "PF drift detection · 91% confidence · PF penalty slab · baseline healthy APFC week",
    mvFooter: "Savings verification · verify PF on next bill line after stage 3 replacement.",
    dials: [
      { label: "Power factor", needle: 84, needleMax: 100, display: "0.84", unit: "" },
      { label: "kVAR load", needle: 72, needleMax: 100, display: "72", unit: "%" },
      { label: "APFC cap", needle: 67, needleMax: 100, display: "67", unit: "%" },
    ],
  },
  {
    id: "evd_4415",
    capturedAt: "2026-07-21T10:23:00+05:30",
    issueTitle: "Kiln 1 ramp and Packing Line 1 restart narrowed MD headroom",
    plantId: "plant_jaipur_01",
    assetId: "incomer",
    assetLabel: "Main incomer",
    findingId: "fnd_4415",
    alarmId: "alm_1010",
    rxId: "rx_9012",
    outcome: "dynamic_production_planning",
    baselineId: "bl_incomer_md_14d",
    chartTitle: "ROLLING MD · 15-MINUTE WINDOW",
    categoryBadge: { label: "CMD headroom", tone: "critical" },
    chart: {
      kind: "line",
      yAxisLabel: "kVA",
      points: [
        { x: 0, y: 4380 },
        { x: 1, y: 4490 },
        { x: 2, y: 4610 },
        { x: 3, y: 4740 },
        { x: 4, y: 4820 },
        { x: 5, y: 4780 },
        { x: 6, y: 4690 },
        { x: 7, y: 4580 },
        { x: 8, y: 4510 },
      ],
      highlight: { from: 3, to: 6, label: "co-start window" },
    },
    tagRows: [
      { tag: "HT_INCOMER.MD", value: "4,820 kVA", window: "10:18–10:33" },
      { tag: "CMD.HEADROOM", value: "3.6%", window: "rolling" },
      { tag: "KILN_1.RAMP", value: "TRUE", window: "10:16" },
      { tag: "PACK_1.RESTART", value: "TRUE", window: "10:20" },
    ],
    metadata:
      "MD soft-landing detection · 90% confidence · CMD headroom band · baseline matched ramp windows",
    mvFooter:
      "Savings verification · compare the next 15-minute MD window after the second-start hold · operations confirmation first.",
    dials: [
      { label: "Rolling MD", needle: 96.4, needleMax: 100, display: "4,820", unit: " kVA" },
      { label: "CMD headroom", needle: 3.6, needleMax: 100, display: "3.6", unit: "%" },
      { label: "Co-start risk", needle: 100, needleMax: 100, display: "Open", unit: "" },
    ],
  },
  {
    id: "evd_4416",
    capturedAt: "2026-07-21T10:29:00+05:30",
    issueTitle: "Compressor 2 specific power drifted above its matched baseline",
    plantId: "plant_jaipur_01",
    assetId: "comp_2",
    assetLabel: "Compressor 2",
    findingId: "fnd_4416",
    alarmId: "alm_1011",
    rxId: "rx_9013",
    outcome: "uptime",
    baselineId: "bl_comp_2_specific_power_8w",
    chartTitle: "SPECIFIC POWER · MATCHED RUNS",
    categoryBadge: { label: "Equipment drift", tone: "warning" },
    chart: {
      kind: "line",
      yAxisLabel: "kW / bar",
      points: [
        { x: 0, y: 7.1 },
        { x: 1, y: 7.2 },
        { x: 2, y: 7.3 },
        { x: 3, y: 7.4 },
        { x: 4, y: 7.6 },
        { x: 5, y: 7.8 },
        { x: 6, y: 7.9 },
        { x: 7, y: 8.0 },
      ],
      highlight: { from: 4, to: 7, label: "drift band" },
    },
    tagRows: [
      { tag: "COMP2.SPEC_PWR", value: "+14%", window: "9-day matched trend" },
      { tag: "HEADER.PRESS", value: "6.8 bar", window: "matched runs" },
      { tag: "COMP2.RUN_HRS", value: "Normal", window: "same shift mix" },
      { tag: "COMP2.FILTER", value: "Inspect", window: "next low-load window" },
    ],
    metadata:
      "Compressor specific-power drift · 87% confidence · matched header pressure and run hours · 8-week baseline",
    mvFooter:
      "Verification · record kW, header pressure, and run hours for one matched shift after inspection.",
    dials: [
      { label: "Specific power", needle: 114, needleMax: 125, display: "+14", unit: "%" },
      { label: "Header pressure", needle: 68, needleMax: 100, display: "6.8", unit: " bar" },
      { label: "Drift duration", needle: 75, needleMax: 100, display: "9", unit: " days" },
    ],
  },
  {
    id: "evd_4417",
    capturedAt: "2026-07-21T10:35:00+05:30",
    issueTitle: "Kiln 1 ID fan used extra power after draft had stabilised",
    plantId: "plant_jaipur_01",
    assetId: "kiln_1",
    assetLabel: "Kiln 1",
    findingId: "fnd_4417",
    alarmId: "alm_1012",
    rxId: "rx_9014",
    outcome: "quality_yield",
    baselineId: "bl_kiln_1_warmup_14d",
    chartTitle: "WARM-UP DRAW · NEXT START",
    categoryBadge: { label: "Warm-up kWh", tone: "warning" },
    chart: {
      kind: "line",
      yAxisLabel: "kW",
      points: [
        { x: 0, y: 620 },
        { x: 1, y: 650 },
        { x: 2, y: 685 },
        { x: 3, y: 710 },
        { x: 4, y: 702 },
        { x: 5, y: 698 },
        { x: 6, y: 670 },
        { x: 7, y: 640 },
      ],
      highlight: { from: 2, to: 5, label: "warm-up band" },
    },
    tagRows: [
      { tag: "KILN_1.ID_FAN", value: "+11%", window: "matched warm-up" },
      { tag: "KILN_1.DRAFT", value: "Stable", window: "before band release" },
      { tag: "KILN_1.O2", value: "In band", window: "same window" },
      { tag: "WARMUP.BASELINE", value: "14 days", window: "matched starts" },
    ],
    metadata:
      "Warm-up process tune · 82% confidence · kiln draft and O₂ cross-check · matched 14-day baseline",
    mvFooter:
      "Verification · compare warm-up kWh with the matched 14-day starts before closing the tune.",
    dials: [
      { label: "Warm-up draw", needle: 111, needleMax: 125, display: "+11", unit: "%" },
      { label: "Draft", needle: 82, needleMax: 100, display: "Stable", unit: "" },
      { label: "O₂ band", needle: 84, needleMax: 100, display: "In", unit: "" },
    ],
  },
  {
    id: "evd_4418",
    capturedAt: "2026-07-21T10:42:00+05:30",
    issueTitle: "Packing Line 1 auxiliaries stayed on with zero output",
    plantId: "plant_jaipur_01",
    assetId: "pack_1",
    assetLabel: "Packing line 1",
    findingId: "fnd_4418",
    alarmId: "alm_1013",
    rxId: "rx_9015",
    outcome: "energy_waste",
    baselineId: "bl_pack_1_idle_5events",
    chartTitle: "IDLE EVENT · AUXILIARY LOAD",
    categoryBadge: { label: "Idle kWh", tone: "good" },
    chart: {
      kind: "bar",
      yAxisLabel: "kWh",
      bars: [
        { label: "Output", value: 0, highlight: true },
        { label: "Conveyor", value: 18 },
        { label: "Idle fan", value: 11 },
        { label: "Other aux", value: 9 },
      ],
      annotation: "38 kWh protected by idle SOP",
    },
    tagRows: [
      { tag: "PACK_1.OUTPUT", value: "0", window: "26 min" },
      { tag: "AUX_CONV.kW", value: "18 kW", window: "same window" },
      { tag: "AUX_FAN.RUN", value: "ON", window: "same window" },
      { tag: "IDLE.FLAG", value: "TRUE", window: "26 min" },
    ],
    metadata:
      "Idle auxiliary detection · 84% confidence · output and feeder join · baseline last 5 idle events",
    mvFooter:
      "Verification · compare feeder kWh before and after the idle cut across the next five events.",
    dials: [
      { label: "Idle duration", needle: 87, needleMax: 100, display: "26", unit: " min" },
      { label: "Aux load", needle: 38, needleMax: 50, display: "38", unit: " kWh" },
      { label: "Output", needle: 0, needleMax: 100, display: "Zero", unit: "" },
    ],
  },
  {
    id: "evd_4419",
    capturedAt: "2026-07-21T10:49:00+05:30",
    issueTitle: "Admin HVAC ran through an empty off-peak window",
    plantId: "plant_jaipur_01",
    assetId: "hvac_admin",
    assetLabel: "Admin HVAC",
    findingId: "fnd_4419",
    alarmId: "alm_1014",
    rxId: "rx_9016",
    outcome: "energy_waste",
    baselineId: "bl_admin_hvac_5windows",
    chartTitle: "OCCUPANCY VS HVAC · OFF-PEAK",
    categoryBadge: { label: "HVAC idle", tone: "info" },
    chart: {
      kind: "bar",
      yAxisLabel: "kWh",
      bars: [
        { label: "Occupied", value: 0, highlight: true },
        { label: "HVAC", value: 16 },
        { label: "Setback", value: 4 },
        { label: "Avoidable", value: 12 },
      ],
      annotation: "38 min with no occupancy",
    },
    tagRows: [
      { tag: "OFFICE.OCCUPANCY", value: "0", window: "38 min" },
      { tag: "ADMIN_HVAC.RUN", value: "TRUE", window: "off-peak" },
      { tag: "HVAC.SCHEDULE", value: "Occupied", window: "after 21:00" },
      { tag: "HVAC.SETBACK", value: "Available", window: "next window" },
    ],
    metadata:
      "Occupancy/HVAC schedule check · 79% confidence · off-peak energy line · baseline last 5 windows",
    mvFooter:
      "Verification · keep the setback only if the next five off-peak windows stay comfortable and occupied rooms remain overridable.",
    dials: [
      { label: "Empty window", needle: 63, needleMax: 100, display: "38", unit: " min" },
      { label: "HVAC load", needle: 64, needleMax: 100, display: "16", unit: " kWh" },
      { label: "Override", needle: 100, needleMax: 100, display: "Ready", unit: "" },
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

/** Map Vinayak Rx ids to analogous demo evidence samples (shared signal patterns). */
const RX_EVIDENCE_ALIASES: Record<string, string> = {
  rx_v001: "evd_4410",
  rx_v002: "evd_4402",
  rx_v003: "evd_4401",
  rx_v004: "evd_4411",
  rx_v005: "evd_4412",
  rx_v006: "evd_4410",
};

export function resolveEvidenceIdForRx(rxId: string): string | undefined {
  return byRx.get(rxId)?.id ?? RX_EVIDENCE_ALIASES[rxId];
}

export function resolveEvidenceIdForFinding(findingId: string): string | undefined {
  return byFinding.get(findingId)?.id;
}

/** Primary evidence id for deep links - prefers alarm, then rx, then finding. */
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
