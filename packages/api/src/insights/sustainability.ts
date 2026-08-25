/**
 * Sustainability board DTO — SEC + derived CO₂; renewable mix null (Class D).
 */
import type { L2QueryClient } from "../upstream/l2/client.js";
import { GRID_TCO2E_PER_KWH } from "../overview/service.js";

export type SustBarPoint = { label: string; value: number };
export type SustConsumer = {
  label: string;
  sharePct: number;
  health: "calm" | "watch" | "hot";
};

export type SustainabilityDto = {
  plantId: string;
  plantName: string | null;
  source: "l2" | "unavailable";
  generatedAt: string;
  detail: string | null;
  derivedNotes: string[];
  secKwhPerUnit: number | null;
  scope2Tco2e: number | null;
  /** Always null until L2 has renewable generation (Class D). */
  renewablePct: number | null;
  mdHeadroomPct: number | null;
  cmdKva: number | null;
  peakMdKva: number | null;
  gridKwh30d: number | null;
  productionUnits: number | null;
  emissionFactorRef: string;
  secTrend: SustBarPoint[] | null;
  emissionsTrend: SustBarPoint[] | null;
  topConsumers: SustConsumer[] | null;
  todPeakSharePct: number | null;
};

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) {
    return Number(v);
  }
  return null;
}

function energyDeltaFromPoints(points: Array<{ ts: string; value: number }>): number | null {
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

const CONSUMER_ASSETS = [
  { id: "compressor_1", label: "Compressor 1" },
  { id: "furnace_1", label: "Furnace 1" },
  { id: "hvac_1", label: "HVAC 1" },
  { id: "line_1", label: "Line 1" },
  { id: "pump_cw_12", label: "CW Pump 12" },
] as const;

export async function buildSustainability(input: {
  plantId: string;
  l2: L2QueryClient | null;
}): Promise<SustainabilityDto> {
  const generatedAt = new Date().toISOString();
  const empty = (detail: string): SustainabilityDto => ({
    plantId: input.plantId,
    plantName: null,
    source: "unavailable",
    generatedAt,
    detail,
    derivedNotes: [],
    secKwhPerUnit: null,
    scope2Tco2e: null,
    renewablePct: null,
    mdHeadroomPct: null,
    cmdKva: null,
    peakMdKva: null,
    gridKwh30d: null,
    productionUnits: null,
    emissionFactorRef: `India grid Scope-2 ${GRID_TCO2E_PER_KWH} t/kWh`,
    secTrend: null,
    emissionsTrend: null,
    topConsumers: null,
    todPeakSharePct: null,
  });

  if (!input.l2) return empty("L2 client not configured");

  const derivedNotes: string[] = [];
  const detailParts: string[] = [];
  let cmdKva: number | null = null;
  let peakMdKva: number | null = null;
  let mdHeadroomPct: number | null = null;
  let secKwhPerUnit: number | null = null;
  let productionUnits: number | null = null;
  let gridKwh30d: number | null = null;
  let secTrend: SustBarPoint[] | null = null;
  let emissionsTrend: SustBarPoint[] | null = null;
  let topConsumers: SustConsumer[] | null = null;

  try {
    const tariff = await input.l2.getActiveTariff(input.plantId);
    cmdKva = num(tariff.cmd_kva) ?? num(tariff.cmdKva);
  } catch (err) {
    detailParts.push(err instanceof Error ? err.message : "tariff unavailable");
  }

  const to = new Date();
  const from30 = new Date(to.getTime() - 30 * 86_400_000);
  const from7 = new Date(to.getTime() - 7 * 86_400_000);

  try {
    const energy = await input.l2.listMeasurements({
      plantId: input.plantId,
      assetId: "incomer_1",
      metric: "active_energy_kwh",
      from: from30.toISOString(),
      to: to.toISOString(),
      granularity: "day",
    });
    gridKwh30d = energyDeltaFromPoints(energy.points);
  } catch (err) {
    detailParts.push(err instanceof Error ? err.message : "energy series unavailable");
  }

  try {
    const md = await input.l2.listMeasurements({
      plantId: input.plantId,
      assetId: "incomer_1",
      metric: "apparent_power_kva",
      from: from7.toISOString(),
      to: to.toISOString(),
      granularity: "raw",
    });
    if (md.points.length > 0) {
      peakMdKva = Math.max(...md.points.map((p) => p.value));
    }
  } catch {
    /* optional */
  }

  if (cmdKva != null && cmdKva > 0 && peakMdKva != null) {
    mdHeadroomPct = Math.round(((cmdKva - peakMdKva) / cmdKva) * 1000) / 10;
  }

  try {
    const sec = await input.l2.getSecFeature({
      plantId: input.plantId,
      window: "P30D",
    });
    const payload =
      (sec.payload as Record<string, unknown> | undefined) ??
      (sec.feature as Record<string, unknown> | undefined) ??
      sec;
    secKwhPerUnit =
      num(payload.sec) ??
      num(payload.baseline_sec) ??
      num(payload.sec_kwh_per_t);
    productionUnits =
      num(payload.production_units) ?? num(payload.units) ?? null;
    const points =
      (payload.sec_points as Array<Record<string, unknown>> | undefined) ??
      (payload.points as Array<Record<string, unknown>> | undefined) ??
      [];
    const trend: SustBarPoint[] = [];
    for (const p of points) {
      const v = num(p.sec) ?? num(p.value);
      const label = String(p.month ?? p.m ?? p.label ?? trend.length + 1);
      if (v == null) continue;
      trend.push({ label: label.slice(0, 8), value: +v.toFixed(2) });
    }
    if (trend.length > 0) {
      secTrend = trend;
      secKwhPerUnit = secKwhPerUnit ?? trend[trend.length - 1]!.value;
    } else if (secKwhPerUnit != null) {
      secTrend = [{ label: "P30D", value: +secKwhPerUnit.toFixed(2) }];
    }
  } catch (err) {
    detailParts.push(err instanceof Error ? err.message : "SEC unavailable");
  }

  const scope2Tco2e =
    gridKwh30d != null
      ? +(gridKwh30d * GRID_TCO2E_PER_KWH).toFixed(1)
      : null;
  if (scope2Tco2e != null) {
    derivedNotes.push(
      `Scope 2 uses grid factor ${GRID_TCO2E_PER_KWH} t/kWh (not plant-specific).`,
    );
    emissionsTrend = [{ label: "30d", value: scope2Tco2e }];
  }

  const rows: Array<{ label: string; kwh: number }> = [];
  let total = 0;
  for (const c of CONSUMER_ASSETS) {
    try {
      const energy = await input.l2.listMeasurements({
        plantId: input.plantId,
        assetId: c.id,
        metric: "active_energy_kwh",
        from: from30.toISOString(),
        to: to.toISOString(),
        granularity: "day",
      });
      const kwh = energyDeltaFromPoints(energy.points) ?? 0;
      rows.push({ label: c.label, kwh });
      total += kwh;
    } catch {
      /* skip */
    }
  }
  if (rows.length > 0 && total > 0) {
    topConsumers = rows
      .map((r) => {
        const sharePct = Math.round((r.kwh / total) * 1000) / 10;
        const health: SustConsumer["health"] =
          sharePct >= 30 ? "hot" : sharePct >= 18 ? "watch" : "calm";
        return { label: r.label, sharePct, health };
      })
      .sort((a, b) => b.sharePct - a.sharePct)
      .slice(0, 5);
  }

  derivedNotes.push("Renewable mix unavailable — no generation table in L2.");

  const hasAny =
    secKwhPerUnit != null ||
    scope2Tco2e != null ||
    mdHeadroomPct != null ||
    topConsumers != null;

  return {
    plantId: input.plantId,
    plantName: null,
    source: hasAny ? "l2" : "unavailable",
    generatedAt,
    detail: hasAny
      ? detailParts.length
        ? detailParts.join("; ")
        : null
      : detailParts.join("; ") || "No SEC or energy series",
    derivedNotes,
    secKwhPerUnit,
    scope2Tco2e,
    renewablePct: null,
    mdHeadroomPct,
    cmdKva,
    peakMdKva,
    gridKwh30d,
    productionUnits,
    emissionFactorRef: `India grid Scope-2 ${GRID_TCO2E_PER_KWH} t/kWh`,
    secTrend,
    emissionsTrend,
    topConsumers,
    todPeakSharePct: null,
  };
}
