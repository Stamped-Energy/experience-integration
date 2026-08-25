/**
 * Derived plant overview KPIs — every field nullable; never invent numbers.
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
  /** Plant Intelligence Score — null until L3 score is persisted (Class D). */
  aiScore: number | null;
  /** Plant CO2 — null without emission factor (Class D). */
  co2Tco2e: number | null;
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
        // try active_power as freshness proxy
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
        mdHeadroomPct = Math.round(((mdCmdKva - mdPeakKva) / mdCmdKva) * 1000) / 10;
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
        if (energy.points.length > 0) {
          const first = energy.points[0]!.value;
          const last = energy.points[energy.points.length - 1]!.value;
          totalEnergyKwhMtd = Math.max(0, last - first);
        }
      } catch {
        /* optional */
      }

      try {
        const baselines = await input.l2.listBaselines({ plantId: input.plantId });
        if (baselines.items.length > 0) {
          // Presence of a locked baseline is enough to mark L2 live; percent
          // comparison needs paired measurement windows (nullable when thin).
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
    co2Tco2e: null,
    prescriptions,
    detail,
  };
}
