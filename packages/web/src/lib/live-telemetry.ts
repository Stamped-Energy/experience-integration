import {
  OVERVIEW_ALERTS,
  OVERVIEW_DEMAND_PROFILE,
  OVERVIEW_DIALS,
  OVERVIEW_KPIS,
  OVERVIEW_MACHINES,
  type AlertSeverity,
} from "@/fixtures/overview-demo";
import type { OverviewMachine } from "@/lib/overview-machines";

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

function cloneBaseline(): LiveTelemetrySnapshot {
  return {
    tick: 0,
    syncAgeSec: 0,
    dials: OVERVIEW_DIALS.map((d) => ({ ...d })),
    machines: OVERVIEW_MACHINES.map((m) => ({ ...m })),
    alerts: OVERVIEW_ALERTS.map((a) => ({ ...a, live: a.time === "Now" })),
    demandProfile: OVERVIEW_DEMAND_PROFILE.map((d) => ({ ...d })),
    anomalies: { ...OVERVIEW_KPIS.anomalies },
    plantMw: 94.2,
    peakMw: 98,
    peakHour: "20:00",
  };
}

/** Deterministic pseudo-random for stable demo jitter. */
function jitter(seed: number, amplitude: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return (x - Math.floor(x) - 0.5) * 2 * amplitude;
}

function clampLoad(value: number, min = 0, max = 120): number {
  return Math.max(min, Math.min(max, value));
}

function formatKwhPerHour(kwh: number): string {
  return `${Math.round(kwh).toLocaleString("en-IN")} kWh/h`;
}

export function createLiveTelemetryBaseline(): LiveTelemetrySnapshot {
  return cloneBaseline();
}

export function tickLiveTelemetry(prev: LiveTelemetrySnapshot): LiveTelemetrySnapshot {
  const tick = prev.tick + 1;
  const syncAgeSec = prev.syncAgeSec >= 15 ? 0 : prev.syncAgeSec + 1;
  const nowHour = new Date().getHours();

  const dials = prev.dials.map((dial, i) => {
    const delta = jitter(tick + i * 3.7, 1.8);
    const load = clampLoad(Math.round(dial.load + delta));
    let sub = dial.sub;
    if (dial.name === "Kiln 1") sub = formatKwhPerHour(4820 + jitter(tick + i, 120));
    if (dial.name === "Cement Mill 1") sub = `PF ${(0.84 + jitter(tick + i, 0.015)).toFixed(2)}`;
    if (dial.name === "Raw Mill A") sub = `Vib ${(4.2 + jitter(tick + i, 0.08)).toFixed(1)}mm/s`;
    if (dial.name === "Chiller Unit 1") sub = `COP ${(3.3 + jitter(tick + i, 0.06)).toFixed(1)}`;
    return { ...dial, load, sub };
  });

  const machines = prev.machines.map((machine, i) => {
    if (machine.status === "OFFLINE") return { ...machine, load: 0, kwh: 0 };
    const delta = jitter(tick + i * 1.9, 1.4);
    const load = clampLoad(Math.round(machine.load + delta));
    const kwh =
      machine.kwh == null ? null : Math.max(0, Math.round(machine.kwh + jitter(tick + i, 45)));
    return { ...machine, load, kwh };
  });

  const demandProfile = prev.demandProfile.map((point, i) => {
    const delta = i === nowHour ? jitter(tick + 40, 0.9) : jitter(tick + i, 0.25);
    return { ...point, mw: +Math.max(28, point.mw + delta).toFixed(1) };
  });

  const plantMw = +Math.max(
    28,
    demandProfile[nowHour]?.mw ?? prev.plantMw + jitter(tick + 99, 0.4),
  ).toFixed(1);

  const alerts = prev.alerts.map((alert, i) => {
    if (alert.live) return alert;
    if (i === 0) return { ...alert, live: true, time: "Now" };
    const mins = Math.max(1, parseInt(alert.time, 10) || 1) + (tick % 3 === 0 ? 1 : 0);
    return { ...alert, time: `${mins}m ago` };
  });

  const critical = machines.filter((m) => m.status === "CRITICAL").length;
  const warning = machines.filter((m) => m.status === "WARNING").length;
  const info = machines.filter((m) => m.status === "INFO").length;

  return {
    tick,
    syncAgeSec,
    dials,
    machines,
    alerts,
    demandProfile,
    anomalies: {
      total: critical + warning + info,
      critical,
      warning,
      info,
      lastTriggered: syncAgeSec <= 2 ? "just now" : `${syncAgeSec}s ago`,
    },
    plantMw,
    peakMw: Math.max(prev.peakMw, ...demandProfile.map((d) => d.mw)),
    peakHour: prev.peakHour,
  };
}
