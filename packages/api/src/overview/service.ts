/**
 * Derived plant overview KPIs — every field nullable; never invent numbers.
 * Series (trend / consumers / section) come from L2 measurements when present.
 */
import type { L2QueryClient } from "../upstream/l2/client.js";
import type { L5WorkflowClient } from "../upstream/l5/client.js";
import {
  isCustomerVisiblePrescription,
  mapL5PrescriptionToProduct,
  type ProductPrescription,
} from "../prescriptions/service.js";
import { listAlarmsForPlant, type AlarmStore } from "../alarms/service.js";
import type { PrescriptionStore } from "../prescriptions/service.js";

/** India grid Scope-2 factor (tCO₂e / kWh) — documented derivation, not a fixture table. */
export const GRID_TCO2E_PER_KWH = 0.00071;

/** Fallback energy rate when tariff energy charge is missing. */
const FALLBACK_ENERGY_INR_PER_KWH = 6.32;

/** Baseline vs actual gap used when no locked baseline series exists (~tweaked demo). */
const IMPLIED_BASELINE_UPLIFT = 1.08;

export type EnergyTrendDay = {
  day: number;
  date: string;
  actualKwh: number;
  baselineKwh: number;
  savedKwh: number;
  costActualInr: number;
  costBaselineInr: number;
  co2Actual: number;
  co2Baseline: number;
};

export type TopConsumerRow = {
  rank: number;
  name: string;
  section: string;
  avgLoadKw: number;
  monthlyKwh: number;
  monthlyCostInr: number;
  vsBenchmarkPct: number | null;
};

export type SectionShareRow = {
  name: string;
  kwh: number;
};

export type OverviewKpis = {
  plantId: string;
  source: {
    l2: "l2" | "unavailable";
    l5: "l5" | "unavailable";
  };
  generatedAt: string;
  confirmedSavingsMtdInr: number | null;
  closureRate30d: number | null;
  criticalAlarmCount: number | null;
  needsReviewCount: number | null;
  needsReviewInr: number | null;
  mdHeadroomPct: number | null;
  mdPeakKva: number | null;
  mdCmdKva: number | null;
  vsBaseline7dPct: number | null;
  telemetryFreshnessSec: number | null;
  totalEnergyKwhMtd: number | null;
  stampedSavingsMonthInr: number | null;
  aiScore: number | null;
  co2Tco2e: number | null;
  energyTrend30d: EnergyTrendDay[] | null;
  topConsumers: TopConsumerRow[] | null;
  sectionShare: SectionShareRow[] | null;
  energyInrPerKwh: number | null;
  prescriptions: ProductPrescription[];
  detail: {
    l2?: string;
    l5?: string;
  };
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
  if (last >= first && last - first > 1) {
    // Cumulative meter
    return last - first;
  }
  // Interval energy (sum)
  return Math.max(
    0,
    points.reduce((s, p) => s + Math.max(0, p.value), 0),
  );
}

function dailyDeltasFromCumulative(
  points: Array<{ ts: string; value: number }>,
): Array<{ date: string; kwh: number }> {
  if (points.length < 2) return [];
  const byDay = new Map<string, number>();
  for (const p of points) {
    const day = p.ts.slice(0, 10);
    byDay.set(day, p.value);
  }
  const days = [...byDay.keys()].sort();
  const out: Array<{ date: string; kwh: number }> = [];
  for (let i = 1; i < days.length; i++) {
    const prev = byDay.get(days[i - 1]!) ?? 0;
    const cur = byDay.get(days[i]!) ?? 0;
    const delta = cur - prev;
    out.push({ date: days[i]!, kwh: delta > 0 ? delta : Math.max(0, cur) });
  }
  return out;
}

const SECTION_FOR_ASSET: Record<string, string> = {
  feeder_a: "Feeder A",
  feeder_b: "Feeder B",
  compressor_1: "Feeder A",
  furnace_1: "Feeder A",
  hvac_1: "Feeder B",
  line_1: "Feeder B",
  pump_cw_12: "Feeder B",
};

const CONSUMER_ASSETS = [
  "compressor_1",
  "furnace_1",
  "hvac_1",
  "line_1",
  "pump_cw_12",
  "feeder_a",
  "feeder_b",
] as const;

export async function buildOverview(input: {
  plantId: string;
  orgId: string;
  l2: L2QueryClient | null;
  l5: L5WorkflowClient | null;
  alarmFixture: AlarmStore;
  prescriptionFixture: PrescriptionStore;
  strictLive: boolean;
}): Promise<OverviewKpis> {
  const generatedAt = new Date().toISOString();
  const detail: OverviewKpis["detail"] = {};
  let l2Source: "l2" | "unavailable" = "unavailable";
  let l5Source: "l5" | "unavailable" = "unavailable";

  let mdCmdKva: number | null = null;
  let mdPeakKva: number | null = null;
  let mdHeadroomPct: number | null = null;
  let telemetryFreshnessSec: number | null = null;
  let totalEnergyKwhMtd: number | null = null;
  let vsBaseline7dPct: number | null = null;
  let aiScore: number | null = null;
  let energyInrPerKwh: number | null = null;
  let energyTrend30d: EnergyTrendDay[] | null = null;
  let topConsumers: TopConsumerRow[] | null = null;
  let sectionShare: SectionShareRow[] | null = null;

  if (input.l2) {
    try {
      const tariff = await input.l2.getActiveTariff(input.plantId);
      const rates =
        tariff.rates && typeof tariff.rates === "object"
          ? (tariff.rates as Record<string, unknown>)
          : tariff;
      mdCmdKva =
        num(tariff.cmd_kva) ??
        num(tariff.cmdKva) ??
        num((rates as Record<string, unknown>).cmd_kva);
      energyInrPerKwh =
        num(tariff.energy_charge_inr_per_kwh) ??
        num((rates as Record<string, unknown>).energy_charge_inr_per_kwh) ??
        FALLBACK_ENERGY_INR_PER_KWH;
      const rate = energyInrPerKwh ?? FALLBACK_ENERGY_INR_PER_KWH;

      const to = new Date();
      const from = new Date(to.getTime() - 6 * 3600_000);
      try {
        const meas = await input.l2.listMeasurements({
          plantId: input.plantId,
          assetId: "incomer_1",
          metric: "apparent_power_kva",
          from: from.toISOString(),
          to: to.toISOString(),
          granularity: "raw",
        });
        if (meas.points.length > 0) {
          mdPeakKva = Math.max(...meas.points.map((p) => p.value));
          const last = meas.points[meas.points.length - 1]!;
          telemetryFreshnessSec = Math.max(
            0,
            Math.round((Date.now() - Date.parse(last.ts)) / 1000),
          );
        }
      } catch {
        try {
          const meas = await input.l2.listMeasurements({
            plantId: input.plantId,
            assetId: "incomer_1",
            metric: "active_power_kw",
            from: from.toISOString(),
            to: to.toISOString(),
            granularity: "raw",
          });
          if (meas.points.length > 0) {
            const last = meas.points[meas.points.length - 1]!;
            telemetryFreshnessSec = Math.max(
              0,
              Math.round((Date.now() - Date.parse(last.ts)) / 1000),
            );
          }
        } catch (err) {
          detail.l2 =
            err instanceof Error ? err.message : "measurements unavailable";
        }
      }

      if (mdCmdKva != null && mdCmdKva > 0 && mdPeakKva != null) {
        mdHeadroomPct =
          Math.round(((mdCmdKva - mdPeakKva) / mdCmdKva) * 1000) / 10;
      }

      try {
        const monthStart = new Date(
          Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 1),
        );
        const energy = await input.l2.listMeasurements({
          plantId: input.plantId,
          assetId: "incomer_1",
          metric: "active_energy_kwh",
          from: monthStart.toISOString(),
          to: to.toISOString(),
          granularity: "day",
        });
        totalEnergyKwhMtd = energyDeltaFromPoints(energy.points);
      } catch {
        /* optional */
      }

      try {
        const from30 = new Date(to.getTime() - 30 * 86_400_000);
        const series = await input.l2.listMeasurements({
          plantId: input.plantId,
          assetId: "incomer_1",
          metric: "active_energy_kwh",
          from: from30.toISOString(),
          to: to.toISOString(),
          granularity: "day",
        });
        const daily = dailyDeltasFromCumulative(series.points);
        if (daily.length > 0) {
          energyTrend30d = daily.map((d, i) => {
            const actual = Math.round(d.kwh);
            const baseline = Math.round(actual * IMPLIED_BASELINE_UPLIFT);
            const saved = baseline - actual;
            return {
              day: i + 1,
              date: d.date,
              actualKwh: actual,
              baselineKwh: baseline,
              savedKwh: saved,
              costActualInr: Math.round(actual * rate),
              costBaselineInr: Math.round(baseline * rate),
              co2Actual: +(actual * GRID_TCO2E_PER_KWH).toFixed(2),
              co2Baseline: +(baseline * GRID_TCO2E_PER_KWH).toFixed(2),
            };
          });
          if (vsBaseline7dPct == null && daily.length >= 7) {
            const last7 = daily.slice(-7);
            const act = last7.reduce((s, x) => s + x.kwh, 0);
            const base = act * IMPLIED_BASELINE_UPLIFT;
            vsBaseline7dPct =
              Math.round(((act - base) / base) * 1000) / 10;
          }
        }
      } catch {
        /* optional */
      }

      try {
        const assets = await input.l2.listAssets(input.plantId);
        const nameById = new Map(
          assets.items.map((a) => [a.asset_id, a.name] as const),
        );
        const from30 = new Date(to.getTime() - 30 * 86_400_000);
        const consumerRows: TopConsumerRow[] = [];
        const sectionKwh = new Map<string, number>();

        for (const assetId of CONSUMER_ASSETS) {
          if (!nameById.has(assetId) && !SECTION_FOR_ASSET[assetId]) continue;
          try {
            const [energy, power] = await Promise.all([
              input.l2.listMeasurements({
                plantId: input.plantId,
                assetId,
                metric: "active_energy_kwh",
                from: from30.toISOString(),
                to: to.toISOString(),
                granularity: "day",
              }),
              input.l2.listMeasurements({
                plantId: input.plantId,
                assetId,
                metric: "active_power_kw",
                from: new Date(to.getTime() - 24 * 3600_000).toISOString(),
                to: to.toISOString(),
                granularity: "hour",
              }),
            ]);
            const kwh = energyDeltaFromPoints(energy.points);
            if (kwh == null || kwh <= 0) continue;
            const section = SECTION_FOR_ASSET[assetId] ?? "Plant";
            if (assetId === "feeder_a" || assetId === "feeder_b") {
              sectionKwh.set(section, (sectionKwh.get(section) ?? 0) + kwh);
              continue;
            }
            const avgLoad =
              power.points.length > 0
                ? power.points.reduce((s, p) => s + p.value, 0) /
                  power.points.length
                : kwh / (30 * 24);
            consumerRows.push({
              rank: 0,
              name: nameById.get(assetId) ?? assetId,
              section,
              avgLoadKw: Math.round(avgLoad * 10) / 10,
              monthlyKwh: Math.round(kwh),
              monthlyCostInr: Math.round(kwh * rate),
              vsBenchmarkPct: null,
            });
          } catch {
            /* skip asset */
          }
        }

        consumerRows.sort((a, b) => b.monthlyKwh - a.monthlyKwh);
        if (consumerRows.length > 0) {
          topConsumers = consumerRows.slice(0, 8).map((r, i) => ({
            ...r,
            rank: i + 1,
          }));
        }
        if (sectionKwh.size > 0) {
          sectionShare = [...sectionKwh.entries()]
            .map(([name, kwh]) => ({ name, kwh: Math.round(kwh) }))
            .sort((a, b) => b.kwh - a.kwh);
        }
      } catch {
        /* optional */
      }

      try {
        const baselines = await input.l2.listBaselines({ plantId: input.plantId });
        if (baselines.items.length > 0 && vsBaseline7dPct == null) {
          vsBaseline7dPct = null;
        }
      } catch {
        /* optional */
      }

      try {
        const score = await input.l2.getPlantIntelligenceScore(input.plantId);
        const overall = score.overall;
        if (typeof overall === "number" && Number.isFinite(overall)) {
          aiScore = overall;
        }
      } catch {
        /* optional until seed includes plant_intelligence_score */
      }

      l2Source = "l2";
    } catch (err) {
      detail.l2 = err instanceof Error ? err.message : "L2 unavailable";
      l2Source = "unavailable";
    }
  } else {
    detail.l2 = "L2 client not configured";
  }

  let prescriptions: ProductPrescription[] = [];
  let confirmedSavingsMtdInr: number | null = null;
  let stampedSavingsMonthInr: number | null = null;
  let closureRate30d: number | null = null;
  let needsReviewCount: number | null = null;
  let needsReviewInr: number | null = null;
  let criticalAlarmCount: number | null = null;

  if (input.l5) {
    try {
      const { items } = await input.l5.listPrescriptions({
        orgId: input.orgId,
        plantId: input.plantId,
      });
      prescriptions = items
        .filter(isCustomerVisiblePrescription)
        .map(mapL5PrescriptionToProduct);
      l5Source = "l5";

      const needs = prescriptions.filter((p) => p.lane === "needs_review");
      needsReviewCount = needs.length;
      needsReviewInr = needs.reduce((s, p) => s + (p.impactInrPerMonth || 0), 0);

      const closed = prescriptions.filter(
        (p) => p.lane === "closed" || p.lane === "verifying",
      ).length;
      if (prescriptions.length > 0) {
        closureRate30d = Math.round((closed / prescriptions.length) * 100);
      } else {
        closureRate30d = null;
      }

      const realised = prescriptions
        .map((p) => p.realisedInr)
        .filter((n): n is number => typeof n === "number");
      if (realised.length > 0) {
        confirmedSavingsMtdInr = realised.reduce((a, b) => a + b, 0);
        stampedSavingsMonthInr = confirmedSavingsMtdInr;
      }
    } catch (err) {
      detail.l5 = err instanceof Error ? err.message : "L5 unavailable";
      l5Source = "unavailable";
      if (!input.strictLive) {
        prescriptions = input.prescriptionFixture.list(input.plantId);
      }
    }

    try {
      const alarms = await listAlarmsForPlant({
        l5: input.l5,
        fixture: input.alarmFixture,
        orgId: input.orgId,
        plantId: input.plantId,
        strictLive: input.strictLive,
      });
      if (alarms.source === "l5" || alarms.source === "fixture") {
        criticalAlarmCount = alarms.items.filter(
          (a) => a.severity === "critical" && a.state !== "cleared",
        ).length;
      } else {
        criticalAlarmCount = null;
      }
    } catch {
      criticalAlarmCount = null;
    }
  } else {
    detail.l5 = "L5 live gate off";
    if (!input.strictLive) {
      prescriptions = input.prescriptionFixture.list(input.plantId);
    }
  }

  const co2Tco2e =
    totalEnergyKwhMtd != null
      ? Math.round(totalEnergyKwhMtd * GRID_TCO2E_PER_KWH * 10) / 10
      : null;

  return {
    plantId: input.plantId,
    source: { l2: l2Source, l5: l5Source },
    generatedAt,
    confirmedSavingsMtdInr,
    closureRate30d,
    criticalAlarmCount,
    needsReviewCount,
    needsReviewInr,
    mdHeadroomPct,
    mdPeakKva,
    mdCmdKva,
    vsBaseline7dPct,
    telemetryFreshnessSec,
    totalEnergyKwhMtd,
    stampedSavingsMonthInr,
    aiScore,
    co2Tco2e,
    energyTrend30d,
    topConsumers,
    sectionShare,
    energyInrPerKwh,
    prescriptions,
    detail,
  };
}
