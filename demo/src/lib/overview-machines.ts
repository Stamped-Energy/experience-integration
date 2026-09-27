/** Shared plant-health map machine shape — no fixture coupling. */

export type MachineStatus =
  | "CRITICAL"
  | "WARNING"
  | "GOOD"
  | "OPTIMIZED"
  | "OFFLINE"
  | "INFO";

export type OverviewMachine = {
  name: string;
  status: MachineStatus;
  load: number;
  kwh: number | null;
  reason: string;
};
