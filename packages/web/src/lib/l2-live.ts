import type { OverviewMachine } from "@/lib/overview-machines";
import type { L2Asset, L2MeasurementPoint } from "@/hooks/useL2Data";
import type { DataSource } from "@/lib/bff";
import type {
  LiveDemandPoint,
  LiveDial,
  LiveTelemetrySnapshot,
} from "@/lib/live-telemetry";

function statusFromClass(
  assetClass: string | undefined,
): OverviewMachine["status"] {
  if (assetClass === "cnc_machine") return "INFO";
  if (assetClass === "furnace" || assetClass === "induction") return "WARNING";
  if (assetClass === "compressor") return "GOOD";
  return "GOOD";
}

function todForHour(hour: number): LiveDemandPoint["tod"] {
  if (hour >= 18 && hour < 22) return "peak";
  if ((hour >= 6 && hour < 9) || (hour >= 12 && hour < 15)) return "shoulder";
  return "off";
}

/** Build 24h MW profile from incomer active_power_kw points (kW → MW). */
export function demandProfileFromPowerPoints(
  points: L2MeasurementPoint[],
): {
  profile: LiveDemandPoint[];
  plantMw: number;
  peakMw: number;
  peakHour: string;
} {
  const byHour = new Map<number, number[]>();
  for (const p of points) {
    const h = new Date(p.ts).getHours();
    if (!Number.isFinite(h) || !Number.isFinite(p.value)) continue;
    const asMw = p.value > 50 ? p.value / 1000 : p.value;
    const list = byHour.get(h) ?? [];
    list.push(asMw);
    byHour.set(h, list);
  }

  const profile: LiveDemandPoint[] = [];
  let peakMw = 0;
  let peakHour = "00:00";
  for (let h = 0; h < 24; h++) {
    const vals = byHour.get(h) ?? [];
    const mw =
      vals.length > 0
        ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10
        : 0;
    const hour = `${String(h).padStart(2, "0")}:00`;
    profile.push({ hour, mw, tod: todForHour(h) });
    if (mw > peakMw) {
      peakMw = mw;
      peakHour = hour;
    }
  }

  const last = points.at(-1);
  const plantMw =
    last && Number.isFinite(last.value)
      ? Math.round((last.value > 50 ? last.value / 1000 : last.value) * 10) / 10
      : peakMw;

  return { profile, plantMw, peakMw, peakHour };
}

/** Map L2 assets into Live board — no fixture baseline. */
export function liveSnapshotFromL2Assets(
  assets: L2Asset[],
  opts?: {
    measurementPoints?: L2MeasurementPoint[];
    plantMwFallback?: number;
  },
): LiveTelemetrySnapshot {
  const equipment = assets.filter(
    (a) =>
      a.level === "equipment" ||
      a.asset_class === "cnc_machine" ||
      a.asset_class === "furnace" ||
      a.asset_class === "induction" ||
      a.asset_class === "compressor" ||
      a.asset_class === "feeder" ||
      [
        "feeder_a",
        "feeder_b",
        "compressor_1",
        "furnace_1",
        "hvac_1",
        "line_1",
        "pump_cw_12",
      ].includes(a.asset_id),
  );

  const machines: OverviewMachine[] = equipment.slice(0, 16).map((a) => ({
    name: a.name,
    status: statusFromClass(a.asset_class),
    load: 0,
    kwh: null,
    reason:
      a.asset_class === "cnc_machine"
        ? "CNC asset from L2 — load awaits per-asset power overlay."
        : `L2 asset (${a.asset_class ?? a.level ?? "unknown"}).`,
  }));

  const dials: LiveDial[] = equipment.slice(0, 6).map((a) => ({
    name: a.name,
    load: 0,
    sub: a.asset_class ?? "asset",
  }));

  const demand = opts?.measurementPoints?.length
    ? demandProfileFromPowerPoints(opts.measurementPoints)
    : {
        profile: [] as LiveDemandPoint[],
        plantMw: opts?.plantMwFallback ?? 0,
        peakMw: 0,
        peakHour: "—",
      };

  return {
    tick: 0,
    syncAgeSec: 0,
    dials,
    machines,
    plantMw: demand.plantMw,
    peakMw: demand.peakMw,
    peakHour: demand.peakHour,
    demandProfile: demand.profile,
    anomalies: {
      total: 0,
      critical: 0,
      warning: 0,
      info: 0,
      lastTriggered: "—",
    },
    alerts: [
      {
        id: "l2_live",
        time: "Now",
        severity: "INFO",
        machine: "L2",
        message: `${equipment.length} assets from L2 plant graph`,
        action: "Review equipment",
        live: true,
      },
    ],
  };
}

export function fixtureAssetsAsL2(plantId: string): L2Asset[] {
  if (plantId === "plant_lnm_faridabad_1") {
    return [
      {
        asset_id: "incomer_1",
        name: "HT Incomer 11kV",
        level: "measurement_point",
        asset_class: "incomer",
      },
      {
        asset_id: "cnc_vtl_01",
        name: "VTL-01",
        level: "equipment",
        asset_class: "cnc_machine",
      },
    ];
  }
  return [
    {
      asset_id: "compressor_1",
      name: "Compressor 1",
      level: "equipment",
      asset_class: "compressor",
    },
  ];
}

export function resolveLivePageSource(
  assetSource: DataSource,
  measSource: DataSource,
): DataSource {
  if (assetSource === "l2") return "l2";
  if (measSource === "l2") return "preview";
  if (assetSource === "unavailable" || measSource === "unavailable") {
    return "unavailable";
  }
  return "fixture";
}
