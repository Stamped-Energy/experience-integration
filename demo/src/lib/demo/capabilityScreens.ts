/** Example cards and caller-supplied inputs for capability screens.
 *  OEE / SMED use process reads; SPC, capability, gauge R&R, suppliers, genealogy and
 *  CAPA use quality read-contract tools (0.4.0). Demo fixtures still seed inputs until
 *  store-backed samples exist.
 */
import type { EvidenceLabel } from "./types";

const I = { illustrative: true as const };

export const CAPABILITY_EXAMPLE_META = "Recommend only · Live quality reads when session connected";

export type OeeLossCard = {
  illustrative: true;
  assetId: string;
  assetName: string;
  lineId: string;
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  downtimeByReason: { reason: string; seconds: number }[];
  cycleShare: { state: string; share: number }[];
};

export const oeeLossCards: OeeLossCard[] = [
  {
    ...I,
    assetId: "a-mixer",
    assetName: "Mixer M1",
    lineId: "line-a",
    oee: 0.62,
    availability: 0.81,
    performance: 0.88,
    quality: 0.87,
    downtimeByReason: [
      { reason: "Changeover", seconds: 4200 },
      { reason: "Waiting on QC", seconds: 1800 },
      { reason: "Minor stop", seconds: 900 },
    ],
    cycleShare: [
      { state: "run", share: 0.71 },
      { state: "idle", share: 0.14 },
      { state: "down", share: 0.15 },
    ],
  },
  {
    ...I,
    assetId: "b-press",
    assetName: "Press P3",
    lineId: "line-b",
    oee: 0.71,
    availability: 0.9,
    performance: 0.84,
    quality: 0.94,
    downtimeByReason: [
      { reason: "Tool change", seconds: 2400 },
      { reason: "Material wait", seconds: 1100 },
    ],
    cycleShare: [
      { state: "run", share: 0.78 },
      { state: "idle", share: 0.1 },
      { state: "down", share: 0.12 },
    ],
  },
];

export type SmedStep = {
  illustrative: true;
  assetId: string;
  changeoverId: string;
  activity: string;
  durationS: number;
  currentKind: "internal" | "external" | "unknown";
  recommendedKind: "internal" | "external" | "unknown";
};

export const smedSteps: SmedStep[] = [
  { ...I, assetId: "b-press", changeoverId: "co-12", activity: "Purge barrel", durationS: 480, currentKind: "internal", recommendedKind: "internal" },
  { ...I, assetId: "b-press", changeoverId: "co-12", activity: "Stage next tool", durationS: 600, currentKind: "internal", recommendedKind: "external" },
  { ...I, assetId: "b-press", changeoverId: "co-12", activity: "Preheat tool", durationS: 900, currentKind: "internal", recommendedKind: "external" },
  { ...I, assetId: "b-press", changeoverId: "co-12", activity: "Swap tool", durationS: 720, currentKind: "internal", recommendedKind: "internal" },
  { ...I, assetId: "b-press", changeoverId: "co-12", activity: "First-article check", durationS: 360, currentKind: "internal", recommendedKind: "internal" },
];

export type SpcChartCard = {
  illustrative: true;
  characteristicId: string;
  name: string;
  chart: "xbar_r" | "i_mr";
  values: number[];
  ucl: number;
  lcl: number;
  cl: number;
  hits: { rule: string; at: number }[];
  label: EvidenceLabel;
};

export const spcCharts: SpcChartCard[] = [
  {
    ...I,
    characteristicId: "char-viscosity",
    name: "Viscosity (Line A)",
    chart: "i_mr",
    values: [2480, 2495, 2510, 2505, 2520, 2535, 2550, 2540, 2565, 2580, 2570, 2595],
    ucl: 2620,
    lcl: 2380,
    cl: 2500,
    hits: [{ rule: "WE1 (point beyond limit)", at: 11 }],
    label: "Estimated",
  },
  {
    ...I,
    characteristicId: "char-weight",
    name: "Part weight (Line B)",
    chart: "xbar_r",
    values: [48.1, 48.0, 47.9, 48.2, 47.8, 47.7, 47.6, 47.5, 47.9, 48.0],
    ucl: 48.6,
    lcl: 47.2,
    cl: 47.9,
    hits: [],
    label: "Measured",
  },
];

export type CapabilityCard = {
  illustrative: true;
  characteristicId: string;
  name: string;
  n: number;
  cp: number;
  cpk: number;
  pp: number;
  ppk: number;
  lsl: number;
  usl: number;
};

export const capabilityCards: CapabilityCard[] = [
  { ...I, characteristicId: "char-viscosity", name: "Viscosity", n: 48, cp: 1.21, cpk: 1.05, pp: 1.1, ppk: 0.98, lsl: 2380, usl: 2600 },
  { ...I, characteristicId: "char-weight", name: "Part weight", n: 120, cp: 1.45, cpk: 1.32, pp: 1.38, ppk: 1.28, lsl: 47.2, usl: 48.8 },
];

export type GaugeRrCard = {
  illustrative: true;
  studyId: string;
  characteristic: string;
  grrPct: number;
  ndc: number;
  supportsClaim: boolean;
  ev: number;
  av: number;
  pv: number;
};

export const gaugeRrCards: GaugeRrCard[] = [
  { ...I, studyId: "grr-1", characteristic: "Cavity weight", grrPct: 18.4, ndc: 7.2, supportsClaim: true, ev: 0.04, av: 0.03, pv: 0.22 },
  { ...I, studyId: "grr-2", characteristic: "Viscosity cup", grrPct: 32.1, ndc: 3.1, supportsClaim: false, ev: 12, av: 18, pv: 40 },
];

export type SupplierScore = {
  illustrative: true;
  supplierId: string;
  name: string;
  lots: number;
  defectPpm: number;
  topDefect: string;
  scarDraft: string | null;
};

export const supplierScores: SupplierScore[] = [
  { ...I, supplierId: "sup-coil-a", name: "Coil supplier A.", lots: 42, defectPpm: 820, topDefect: "Moisture", scarDraft: null },
  { ...I, supplierId: "sup-resin-b", name: "Resin supplier B.", lots: 18, defectPpm: 4100, topDefect: "Contamination", scarDraft: "Draft SCAR: contamination on lots 7713 to 7719" },
];

export type GenealogyNode = {
  illustrative: true;
  kind: string;
  id: string;
  label: string;
};

export type GenealogyTrace = {
  illustrative: true;
  startId: string;
  direction: "forward" | "backward";
  nodes: GenealogyNode[];
};

export const genealogyTraces: GenealogyTrace[] = [
  {
    ...I,
    startId: "lot-b-7713",
    direction: "backward",
    nodes: [
      { ...I, kind: "lot", id: "lot-b-7713", label: "Lot 7713" },
      { ...I, kind: "heat", id: "heat-882", label: "Heat 882" },
      { ...I, kind: "supplier", id: "sup-resin-b", label: "Resin supplier B." },
    ],
  },
  {
    ...I,
    startId: "heat-882",
    direction: "forward",
    nodes: [
      { ...I, kind: "heat", id: "heat-882", label: "Heat 882" },
      { ...I, kind: "lot", id: "lot-b-7713", label: "Lot 7713" },
      { ...I, kind: "lot", id: "lot-b-7719", label: "Lot 7719" },
      { ...I, kind: "dispatch", id: "ship-441", label: "Dispatch 441" },
    ],
  },
];

export type CapaCase = {
  illustrative: true;
  id: string;
  title: string;
  dStep: number;
  status: "open" | "waiting" | "closed";
  owner: string;
  lotIds: string[];
  due: string;
};

export const capaCases: CapaCase[] = [
  { ...I, id: "capa-1", title: "Cavity 2 light parts on Line B", dStep: 4, status: "open", owner: "Quality engineer A.", lotIds: ["lot-b-7713", "lot-b-7719"], due: "2026-11-04" },
  { ...I, id: "capa-2", title: "Viscosity drift on Line A", dStep: 2, status: "waiting", owner: "Process engineer A.", lotIds: ["lot-a-3307"], due: "2026-11-08" },
  { ...I, id: "capa-3", title: "Jacket sensor stuck (closed)", dStep: 8, status: "closed", owner: "Plant head A.", lotIds: [], due: "2026-10-20" },
];

export type SpcFarSweepCard = {
  illustrative: true;
  chart: string;
  driftSigma: number;
  rows: {
    rule_set: string;
    false_alarm_rate: number;
    detection_rate: number;
    mean_detection_delay: number;
    n_replicates: number;
    n_detected: number;
    n_false_alarm: number;
  }[];
  notes: string[];
};

export const spcFarSweepCards: SpcFarSweepCard[] = [
  {
    ...I,
    chart: "i_mr",
    driftSigma: 1.5,
    rows: [
      {
        rule_set: "western_electric",
        false_alarm_rate: 0.027,
        detection_rate: 0.81,
        mean_detection_delay: 3.2,
        n_replicates: 200,
        n_detected: 162,
        n_false_alarm: 5,
      },
      {
        rule_set: "nelson",
        false_alarm_rate: 0.041,
        detection_rate: 0.88,
        mean_detection_delay: 2.4,
        n_replicates: 200,
        n_detected: 176,
        n_false_alarm: 8,
      },
    ],
    notes: ["illustrative_far_sweep", "measure_only"],
  },
];

export type D153MsaReportCard = {
  illustrative: true;
  grrPct: number;
  ndc: number;
  supportsClaim: boolean;
  ev: number;
  av: number;
  pv: number;
  d153: {
    mode: "coverage" | "ambiguity";
    coverage: number;
    ambiguity_penalty: number;
    supports_quality_claim: boolean;
    detail: string;
  };
};

export const d153MsaReportCards: D153MsaReportCard[] = [
  {
    ...I,
    grrPct: 18.4,
    ndc: 7.2,
    supportsClaim: true,
    ev: 0.04,
    av: 0.03,
    pv: 0.22,
    d153: {
      mode: "coverage",
      coverage: 0.92,
      ambiguity_penalty: 0.08,
      supports_quality_claim: true,
      detail: "Illustrative D153 coverage band on cavity-weight study",
    },
  },
];

export type ScarGeneratorCard = {
  illustrative: true;
  defectRows: { lot_id: string; defect_type: string; quantity: number }[];
  scorecards: { supplier_id: string; lot_count: number; defect_quantity: number; defect_rate: number | null }[];
  scarDrafts: { supplier_id: string; subject: string; body: string }[];
  notes: string[];
};

export const scarGeneratorCards: ScarGeneratorCard[] = [
  {
    ...I,
    defectRows: [
      { lot_id: "lot-b-7713", defect_type: "Contamination", quantity: 12 },
      { lot_id: "lot-b-7719", defect_type: "Contamination", quantity: 9 },
    ],
    scorecards: [
      { supplier_id: "sup-resin-b", lot_count: 18, defect_quantity: 21, defect_rate: 0.0041 },
    ],
    scarDrafts: [
      {
        supplier_id: "sup-resin-b",
        subject: "Draft SCAR: contamination on lots 7713 to 7719",
        body: "Illustrative draft only. Never sent. Contamination linked to heat 882 / Resin supplier B.",
      },
    ],
    notes: ["never_sent", "illustrative_scar_generator"],
  },
];

export type LotToSupplierTraceCard = {
  illustrative: true;
  lotId: string;
  links: {
    lot_id: string;
    heat_id: string;
    supplier_id: string;
    path_nodes: { kind: string; id: string }[];
  }[];
  heats: string[];
  suppliers: string[];
  notes: string[];
};

export const lotToSupplierTraceCards: LotToSupplierTraceCard[] = [
  {
    ...I,
    lotId: "lot-b-7713",
    links: [
      {
        lot_id: "lot-b-7713",
        heat_id: "heat-882",
        supplier_id: "sup-resin-b",
        path_nodes: [
          { kind: "lot", id: "lot-b-7713" },
          { kind: "heat", id: "heat-882" },
          { kind: "supplier", id: "sup-resin-b" },
        ],
      },
    ],
    heats: ["heat-882"],
    suppliers: ["sup-resin-b"],
    notes: ["lot_to_heat_to_supplier", "recommend_only_read", "illustrative"],
  },
];

export type SpcToCapaDraftCard = {
  illustrative: true;
  plantId: string;
  investigationId: string;
  lotId: string;
  characteristicId: string;
  openedAt: string;
  title: string;
  status: "draft";
  ruleHits: { rule_set: string; rule_id: string; point_index: number; chart: string; detail: string }[];
  notes: string[];
};

export const spcToCapaDraftCards: SpcToCapaDraftCard[] = [
  {
    ...I,
    plantId: "plant_demo",
    investigationId: "inv-spc-1",
    lotId: "lot-a-3307",
    characteristicId: "char-viscosity",
    openedAt: "2026-10-28T10:00:00+00:00",
    title: "Draft investigation: viscosity WE1 hit on Line A",
    status: "draft",
    ruleHits: [
      {
        rule_set: "western_electric",
        rule_id: "WE1",
        point_index: 11,
        chart: "i_mr",
        detail: "Point beyond UCL on illustrative viscosity series",
      },
    ],
    notes: ["spc_to_capa_draft", "recommend_only", "never_writes_mes"],
  },
];
