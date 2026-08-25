import type { OverviewMachine } from "@/lib/overview-machines";

export type AlertSeverity = "CRITICAL" | "WARNING" | "INFO" | "RESOLVED";

export type LiveDial = {
  name: string;
  load: number;
  sub: string;
};

export type LiveAlert = {
  id: string;
  time: string;
  severity: AlertSeverity;
  machine: string;
  message: string;
  action: string;
  alarmId?: string;
  live?: boolean;
};

export type LiveDemandPoint = {
  hour: string;
  mw: number;
  tod: "peak" | "shoulder" | "off";
};

export type LiveAnomalies = {
  total: number;
  critical: number;
  warning: number;
  info: number;
  lastTriggered: string;
};

export type LiveTelemetrySnapshot = {
  tick: number;
  syncAgeSec: number;
  dials: LiveDial[];
  machines: OverviewMachine[];
  alerts: LiveAlert[];
  demandProfile: LiveDemandPoint[];
  anomalies: LiveAnomalies;
  plantMw: number;
  peakMw: number;
  peakHour: string;
};

function emptySnapshot(): LiveTelemetrySnapshot {
  return {
    tick: 0,
    syncAgeSec: 0,
    dials: [],
    machines: [],
    alerts: [],
    demandProfile: [],
    anomalies: {
      total: 0,
      critical: 0,
      warning: 0,
      info: 0,
      lastTriggered: "—",
    },
    plantMw: 0,
    peakMw: 0,
    peakHour: "—",
  };
}

/** Empty baseline — no overview-demo fixtures. */
export function createLiveTelemetryBaseline(): LiveTelemetrySnapshot {
  return emptySnapshot();
}

/** No fixture jitter — tick only ages sync for empty baselines. */
export function tickLiveTelemetry(
  prev: LiveTelemetrySnapshot,
): LiveTelemetrySnapshot {
  return {
    ...prev,
    tick: prev.tick + 1,
    syncAgeSec: prev.syncAgeSec >= 15 ? 0 : prev.syncAgeSec + 1,
  };
}
