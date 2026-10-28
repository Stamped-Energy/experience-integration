/** Illustrative capability-screen fixtures (ported from Stamped ui/app @ 0f77288). */
import type { EvidenceLabel } from "./types";

const I = { illustrative: true as const };

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
