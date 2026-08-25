import type { OverviewMachine } from "@/lib/overview-machines";
import type { L2Asset, L2MeasurementPoint } from "@/hooks/useL2Data";
import type { DataSource } from "@/lib/bff";
import type { LiveDial, LiveTelemetrySnapshot } from "@/lib/live-telemetry";
import { createLiveTelemetryBaseline } from "@/lib/live-telemetry";

function statusFromClass(
  assetClass: string | undefined,
): OverviewMachine["status"] {
  if (assetClass === "cnc_machine") return "INFO";
  if (assetClass === "furnace" || assetClass === "induction") return "WARNING";
  if (assetClass === "compressor") return "GOOD";
  return "GOOD";
}

/** Map L2 assets into Live board machines / dials — honest overlay, no invented kW. */
export function liveSnapshotFromL2Assets(
  assets: L2Asset[],
  opts?: {
    measurementPoints?: L2MeasurementPoint[];
    plantMwFallback?: number;
  },
): LiveTelemetrySnapshot {
  const baseline = createLiveTelemetryBaseline();
  const equipment = assets.filter(
    (a) =>
      a.level === "equipment" ||
      a.asset_class === "cnc_machine" ||
      a.asset_class === "furnace" ||
      a.asset_class === "induction" ||
      a.asset_class === "compressor",
  );

  const machines: OverviewMachine[] = equipment.slice(0, 16).map((a) => ({
    name: a.name,
    status: statusFromClass(a.asset_class),
    load: 0,
    kwh: null,
    reason:
      a.asset_class === "cnc_machine"
        ? "CNC asset from L2 — load awaits measurement overlay."
        : `L2 asset (${a.asset_class ?? a.level ?? "unknown"}).`,
  }));

  const dials: LiveDial[] = equipment.slice(0, 6).map((a) => ({
    name: a.name,
    load: 0,
    sub: a.asset_class ?? "asset",
  }));

  const last = opts?.measurementPoints?.at(-1);
  const plantMw =
    last && Number.isFinite(last.value)
      ? last.value > 200
        ? last.value / 1000
        : last.value
      : (opts?.plantMwFallback ?? baseline.plantMw);

  return {
    ...baseline,
    dials: dials.length ? dials : baseline.dials,
    machines: machines.length ? machines : baseline.machines,
    plantMw,
    syncAgeSec: 0,
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

/** Demo fixture assets shaped like L2 for offline fallback. */
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
      {
        asset_id: "cnc_vtl_02",
        name: "VTL-02",
        level: "equipment",
        asset_class: "cnc_machine",
      },
      {
        asset_id: "cnc_hmc_01",
        name: "HMC-01",
        level: "equipment",
        asset_class: "cnc_machine",
      },
      {
        asset_id: "cnc_hmc_02",
        name: "HMC-02",
        level: "equipment",
        asset_class: "cnc_machine",
      },
      {
        asset_id: "cnc_lathe_01",
        name: "CNC Lathe-01",
        level: "equipment",
        asset_class: "cnc_machine",
      },
      {
        asset_id: "furnace_normalize",
        name: "Normalize Furnace",
        level: "equipment",
        asset_class: "furnace",
      },
      {
        asset_id: "compressor_1",
        name: "Air Compressor 1",
        level: "equipment",
        asset_class: "compressor",
      },
    ];
  }
  return [
    {
      asset_id: "kiln_1",
      name: "Kiln 1",
      level: "equipment",
      asset_class: "process",
    },
    {
      asset_id: "cm_1",
      name: "Cement Mill 1",
      level: "equipment",
      asset_class: "process",
    },
  ];
}

/**
 * Honest live-vs-fixture badge for the Live screen.
 * "Live from L2" only when the asset graph is from L2 — fixture assets + live
 * measurements must not claim a fully live plant (Bugbot / Phase N).
 */
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
