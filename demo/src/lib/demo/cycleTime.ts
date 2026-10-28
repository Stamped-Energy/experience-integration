/** Illustrative cycle-time state breakdown for Line B (discrete). Dwell and share are measured on the last shift window. */
import type { EvidenceLabel } from "./types";

const I = { illustrative: true as const };

export interface CycleTimeState {
  illustrative: true;
  id: string;
  lineId: string;
  state: string;
  dwellMin: number;
  sharePct: number;
  label: EvidenceLabel;
  note?: string;
}

export const cycleTimeWindow = {
  ...I,
  lineId: "line-b",
  label: "Last completed shift on Line B",
  from: "2026-10-20T06:00:00+05:30",
  to: "2026-10-20T14:00:00+05:30",
  cycleMeanSec: 33.6,
  parts: 1840,
};

export const cycleTimeStates: CycleTimeState[] = [
  { ...I, id: "ct-clamp", lineId: "line-b", state: "Clamp and inject", dwellMin: 142, sharePct: 38, label: "Measured" },
  { ...I, id: "ct-hold", lineId: "line-b", state: "Hold and pack", dwellMin: 88, sharePct: 24, label: "Measured" },
  { ...I, id: "ct-cool", lineId: "line-b", state: "Cool in mould", dwellMin: 76, sharePct: 20, label: "Measured" },
  { ...I, id: "ct-open", lineId: "line-b", state: "Open and eject", dwellMin: 34, sharePct: 9, label: "Measured" },
  { ...I, id: "ct-robot", lineId: "line-b", state: "Robot take-out", dwellMin: 22, sharePct: 6, label: "Measured" },
  { ...I, id: "ct-idle", lineId: "line-b", state: "Idle at mould", dwellMin: 11, sharePct: 3, label: "Estimated", note: "Gap between cycles when the press waits on the robot" },
];
