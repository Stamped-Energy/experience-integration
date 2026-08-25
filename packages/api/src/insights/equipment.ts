/**
 * Equipment / machine-health board DTO.
 * Load + status + health index are energy-derived from active_power_kw.
 * Vibration / FFT / thermal / MTBF / maintenance remain null (Class D).
 */
import type { L2QueryClient } from "../upstream/l2/client.js";

export type EquipmentStatus =
  | "CRITICAL"
  | "WARNING"
  | "GOOD"
  | "OPTIMIZED"
  | "OFFLINE"
  | "INFO";

export type EquipmentAsset = {
  assetId: string;
  name: string;
  type: string;
  section: string;
  /** Energy-stress index 0–100; null when no power samples. */
  health: number | null;
  load: number | null;
  kw: number | null;
  kwh30d: number | null;
  /** Class D — never populated from energy alone. */
  vib: null;
  temp: null;
  rpm: null;
  current: null;
  runtime: null;
  mtbf: null;
  status: EquipmentStatus;
  next: null;
  reason: string;
};

export type EquipmentKpis = {
  fleetHealth: number | null;
  fleetHealthDelta: null;
  atRisk: number | null;
  atRiskDelta: null;
  predictiveAlerts: null;
  predictiveDelta: null;
  avgMtbf: null;
  mtbfDelta: null;
  maintCompliance: null;
  maintDelta: null;
  unplannedDowntime: null;
  downtimeDelta: null;
};

export type HealthDistributionSlice = {
  name: string;
  value: number;
  color: string;
};

export type MapMachine = {
  name: string;
  status: EquipmentStatus;
  load: number;
  kwh: number | null;
  reason: string;
};

export type EquipmentBoardDto = {
  plantId: string;
  source: "l2" | "unavailable";
  generatedAt: string;
  detail: string | null;
  derivedNotes: string[];
  assets: EquipmentAsset[];
  mapMachines: MapMachine[];
  kpis: EquipmentKpis;
  healthDistribution: HealthDistributionSlice[] | null;
  vibrationTrend: null;
  vibSpectrum: null;
  tempTrend: null;
  maintenanceSchedule: null;
};

function energyDeltaFromPoints(
  points: Array<{ ts: string; value: number }>,
): number | null {
  if (points.length === 0) return null;
  if (points.length === 1) return Math.max(0, points[0]!.value);
  const first = points[0]!.value;
  const last = points[points.length - 1]!.value;
  if (last >= first && last - first > 1) return last - first;
  return Math.max(
    0,
    points.reduce((s, p) => s + Math.max(0, p.value), 0),
  );
}

/** Exported for unit tests. */
export function statusFromLoad(
  loadPct: number | null,
  hasPower: boolean,
): EquipmentStatus {
  if (!hasPower || loadPct == null) return "OFFLINE";
  if (loadPct <= 0) return "OFFLINE";
  if (loadPct >= 105) return "CRITICAL";
  if (loadPct >= 90) return "WARNING";
  return "GOOD";
}

/** Exported for unit tests — energy-stress proxy, not CM health. */
export function healthFromLoad(loadPct: number | null): number | null {
  if (loadPct == null || loadPct <= 0) return null;
  const stress =
    Math.max(0, loadPct - 80) * 1.8 + Math.max(0, loadPct - 100) * 2;
  return Math.round(Math.min(98, Math.max(35, 100 - stress)));
}

/** Exported for unit tests. */
export function distributionFromAssets(
  assets: Array<{ health: number | null }>,
): HealthDistributionSlice[] | null {
  const scored = assets.filter((a) => a.health != null);
  if (scored.length === 0) return null;
  let healthy = 0;
  let watch = 0;
  let atRisk = 0;
  for (const a of scored) {
    const h = a.health!;
    if (h >= 80) healthy += 1;
    else if (h >= 60) watch += 1;
    else atRisk += 1;
  }
  return [
    { name: "Healthy (80-100)", value: healthy, color: "#00666b" },
    { name: "Watch (60-79)", value: watch, color: "#c97a00" },
    { name: "At Risk (<60)", value: atRisk, color: "#ba1a1a" },
  ];
}

function typeLabel(assetClass: string | undefined, level: string | undefined): string {
  if (assetClass === "cnc_machine") return "CNC Machine";
  if (assetClass === "compressor") return "Compressor";
  if (assetClass === "furnace" || assetClass === "induction") return "Furnace";
  if (assetClass === "feeder") return "Feeder";
  if (assetClass) return assetClass.replace(/_/g, " ");
  return level ?? "Equipment";
}

function isFleetAsset(a: {
  asset_id: string;
  level?: string;
  asset_class?: string;
}): boolean {
  if (a.asset_id === "incomer_1" || a.asset_id === "plant_root") return false;
  if (a.level === "equipment") return true;
  if (
    a.asset_class === "cnc_machine" ||
    a.asset_class === "compressor" ||
    a.asset_class === "furnace" ||
    a.asset_class === "induction" ||
    a.asset_class === "feeder"
  ) {
    return true;
  }
  // Vinayak load-share children often lack rich class tags
  return [
    "feeder_a",
    "feeder_b",
    "compressor_1",
    "furnace_1",
    "hvac_1",
    "line_1",
    "pump_cw_12",
  ].includes(a.asset_id);
}

export async function buildEquipmentBoard(input: {
  plantId: string;
  l2: L2QueryClient | null;
}): Promise<EquipmentBoardDto> {
  const generatedAt = new Date().toISOString();
  const emptyKpis: EquipmentKpis = {
    fleetHealth: null,
    fleetHealthDelta: null,
    atRisk: null,
    atRiskDelta: null,
    predictiveAlerts: null,
    predictiveDelta: null,
    avgMtbf: null,
    mtbfDelta: null,
    maintCompliance: null,
    maintDelta: null,
    unplannedDowntime: null,
    downtimeDelta: null,
  };

  const empty = (detail: string): EquipmentBoardDto => ({
    plantId: input.plantId,
    source: "unavailable",
    generatedAt,
    detail,
    derivedNotes: [],
    assets: [],
    mapMachines: [],
    kpis: emptyKpis,
    healthDistribution: null,
    vibrationTrend: null,
    vibSpectrum: null,
    tempTrend: null,
    maintenanceSchedule: null,
  });

  if (!input.l2) return empty("L2 client not configured");

  let rawAssets: Array<{
    asset_id: string;
    name: string;
    level?: string;
    asset_class?: string;
  }> = [];
  try {
    const listed = await input.l2.listAssets(input.plantId);
    rawAssets = listed.items;
  } catch (err) {
    return empty(err instanceof Error ? err.message : "assets unavailable");
  }

  const fleet = rawAssets.filter(isFleetAsset);
  if (fleet.length === 0) {
    return empty("No equipment-level assets in L2 graph");
  }

  const derivedNotes = [
    "Health / load / status are energy-derived from active_power_kw (not vibration CM).",
    "Vibration, FFT, thermal, MTBF, and maintenance stay empty until L1 sensing exists.",
  ];

  const to = new Date();
  const from24h = new Date(to.getTime() - 24 * 3600_000);
  const from30d = new Date(to.getTime() - 30 * 86_400_000);

  const assets: EquipmentAsset[] = [];

  for (const a of fleet) {
    let kw: number | null = null;
    let load: number | null = null;
    let kwh30d: number | null = null;
    let hasPower = false;

    try {
      const power = await input.l2.listMeasurements({
        plantId: input.plantId,
        assetId: a.asset_id,
        metric: "active_power_kw",
        from: from24h.toISOString(),
        to: to.toISOString(),
        granularity: "raw",
      });
      const values = power.points
        .map((p) => p.value)
        .filter((v) => Number.isFinite(v) && v >= 0);
      if (values.length > 0) {
        hasPower = true;
        const last = values[values.length - 1]!;
        const peak = Math.max(...values);
        kw = Math.round(last * 10) / 10;
        const capacity = Math.max(peak * 1.05, last * 1.15, 50);
        load = Math.min(120, Math.round((last / capacity) * 100));
      }
    } catch {
      /* no power series */
    }

    try {
      const energy = await input.l2.listMeasurements({
        plantId: input.plantId,
        assetId: a.asset_id,
        metric: "active_energy_kwh",
        from: from30d.toISOString(),
        to: to.toISOString(),
        granularity: "day",
      });
      kwh30d = energyDeltaFromPoints(energy.points);
      if (kwh30d != null) kwh30d = Math.round(kwh30d);
    } catch {
      /* optional */
    }

    const status = statusFromLoad(load, hasPower);
    const health = healthFromLoad(load);
    const reasonParts: string[] = [];
    if (kw != null) reasonParts.push(`Live ${kw} kW`);
    if (load != null) reasonParts.push(`load ${load}% vs 24h peak`);
    if (!hasPower) reasonParts.push("No active_power_kw samples");
    reasonParts.push("Energy-derived status (not CM).");

    assets.push({
      assetId: a.asset_id,
      name: a.name,
      type: typeLabel(a.asset_class, a.level),
      section: a.asset_class ?? a.level ?? "Plant",
      health,
      load,
      kw,
      kwh30d,
      vib: null,
      temp: null,
      rpm: null,
      current: null,
      runtime: null,
      mtbf: null,
      status,
      next: null,
      reason: reasonParts.join(" · "),
    });
  }

  const scored = assets
    .map((a) => a.health)
    .filter((h): h is number => h != null);
  const fleetHealth =
    scored.length > 0
      ? Math.round(scored.reduce((s, h) => s + h, 0) / scored.length)
      : null;
  const atRisk = assets.filter(
    (a) => a.status === "CRITICAL" || a.status === "WARNING",
  ).length;

  const mapMachines: MapMachine[] = assets.map((a) => ({
    name: a.name,
    status: a.status,
    load: a.load ?? 0,
    kwh: a.kwh30d,
    reason: a.reason,
  }));

  return {
    plantId: input.plantId,
    source: "l2",
    generatedAt,
    detail: null,
    derivedNotes,
    assets,
    mapMachines,
    kpis: {
      ...emptyKpis,
      fleetHealth,
      atRisk,
    },
    healthDistribution: distributionFromAssets(assets),
    vibrationTrend: null,
    vibSpectrum: null,
    tempTrend: null,
    maintenanceSchedule: null,
  };
}
