/**
 * Jaipur demo adapters — product pages import from here, not fixtures directly.
 * Used only when `isDemoSession` is true (hardcoded demo login, no BFF).
 */
import type { EnergyBoardData } from "@/components/analytics/EnergyBoard";
import type { SustainabilityBoardData } from "@/components/analytics/SustainabilityDashboard";
import type { MachineHealthBoardData } from "@/components/equipment/MachineHealthBoard";
import type { PlantMapLevels } from "@/components/equipment/PlantSectionMap";
import type { L2Asset, L2MeasurementPoint } from "@/hooks/useL2Data";
import type { LiveTelemetrySnapshot } from "@/lib/live-telemetry";
import { DEMO_PLANT_ID } from "@/lib/demo-session";
import {
  alarmsForPlant,
  demoClosurePct,
  demoCriticalAlarmCount,
  demoNeedsReviewCount,
  demoNeedsReviewInr,
  demoOpsConfirmedInr,
  intensityDemoInput,
  prescriptionsForPlant,
} from "@/fixtures/demo";
import {
  ANALYTICS_KPIS,
  COST_BREAKDOWN,
  CUMULATIVE_SAVINGS,
  FEEDER_WISE,
  LOAD_HEATMAP,
  MONTHLY_COMPARISON,
  POWER_FACTOR_TREND,
  SEC_TREND,
  SOURCE_MIX,
  WEEKDAY_PROFILE,
} from "@/fixtures/energy-analytics";
import {
  HEALTH_ASSETS,
  HEALTH_DISTRIBUTION,
  HEALTH_KPIS,
} from "@/fixtures/machine-health";
import {
  OVERVIEW_ALERTS,
  OVERVIEW_DEMAND_PROFILE,
  OVERVIEW_DIALS,
  OVERVIEW_KPIS,
  OVERVIEW_MACHINES,
  OVERVIEW_SECTION_BREAKDOWN,
  OVERVIEW_TARIFF,
  OVERVIEW_TREND_30D,
  OVERVIEW_WASTERS,
} from "@/fixtures/overview-demo";
import { PLANT_LEVELS } from "@/fixtures/plant-sections";
import type { Alarm, Prescription } from "@/lib/types";

export const DEMO_DATA_SOURCE = "preview" as const;

export function getDemoAlarms(): Alarm[] {
  return alarmsForPlant(DEMO_PLANT_ID);
}

export function getDemoPrescriptions(): Prescription[] {
  return prescriptionsForPlant(DEMO_PLANT_ID);
}

export type DemoOverviewData = {
  plantId: string;
  generatedAt: string;
  confirmedSavingsMtdInr: number;
  closureRate30d: number;
  criticalAlarmCount: number;
  needsReviewCount: number;
  needsReviewInr: number;
  mdHeadroomPct: number;
  mdPeakKva: number;
  mdCmdKva: number;
  vsBaseline7dPct: number;
  telemetryFreshnessSec: number;
  totalEnergyKwhMtd: number;
  stampedSavingsMonthInr: number;
  aiScore: number;
  co2Tco2e: number;
  energyTrend30d: Array<{
    day: number;
    date: string;
    actualKwh: number;
    baselineKwh: number;
    savedKwh: number;
    costActualInr: number;
    costBaselineInr: number;
    co2Actual: number;
    co2Baseline: number;
  }>;
  topConsumers: Array<{
    rank: number;
    name: string;
    section: string;
    avgLoadKw: number;
    monthlyKwh: number;
    monthlyCostInr: number;
    vsBenchmarkPct: number | null;
  }>;
  sectionShare: Array<{ name: string; kwh: number }>;
  energyInrPerKwh: number;
  prescriptions: Prescription[];
};

export function getDemoOverview(): DemoOverviewData {
  const cmd = intensityDemoInput.cmdKva;
  const peak = intensityDemoInput.peakMdKva;
  return {
    plantId: DEMO_PLANT_ID,
    generatedAt: "2026-07-21T10:15:00+05:30",
    confirmedSavingsMtdInr: demoOpsConfirmedInr(),
    closureRate30d: demoClosurePct(),
    criticalAlarmCount: demoCriticalAlarmCount(),
    needsReviewCount: demoNeedsReviewCount(),
    needsReviewInr: demoNeedsReviewInr(),
    mdHeadroomPct: Math.round(((cmd - peak) / cmd) * 1000) / 10,
    mdPeakKva: peak,
    mdCmdKva: cmd,
    vsBaseline7dPct: -6.4,
    telemetryFreshnessSec: 42,
    totalEnergyKwhMtd: OVERVIEW_KPIS.energy.value,
    stampedSavingsMonthInr: OVERVIEW_KPIS.savings.value,
    aiScore: OVERVIEW_KPIS.score.value,
    co2Tco2e: OVERVIEW_KPIS.carbon.value,
    energyTrend30d: OVERVIEW_TREND_30D.map((row) => ({
      day: row.day,
      date: row.date,
      actualKwh: row.actual,
      baselineKwh: row.baseline,
      savedKwh: row.savedKwh,
      costActualInr: row.costActual,
      costBaselineInr: row.costBaseline,
      co2Actual: row.co2Actual,
      co2Baseline: row.co2Baseline,
    })),
    topConsumers: OVERVIEW_WASTERS.slice(0, 8).map((w) => ({
      rank: w.rank,
      name: w.machine,
      section: w.section,
      avgLoadKw: w.load,
      monthlyKwh: w.kwh,
      monthlyCostInr: w.cost,
      vsBenchmarkPct: w.bench,
    })),
    sectionShare: OVERVIEW_SECTION_BREAKDOWN.map((s) => ({
      name: s.name,
      kwh: s.kwh,
    })),
    energyInrPerKwh: OVERVIEW_TARIFF,
    prescriptions: getDemoPrescriptions().slice(0, 6),
  };
}

export function getDemoEnergyBoard(): EnergyBoardData {
  return {
    kpis: ANALYTICS_KPIS,
    monthlyComparison: MONTHLY_COMPARISON,
    cumulativeSavings: CUMULATIVE_SAVINGS,
    costBreakdown: COST_BREAKDOWN,
    sourceMix: SOURCE_MIX,
    powerFactorTrend: POWER_FACTOR_TREND,
    secTrend: SEC_TREND,
    weekdayProfile: WEEKDAY_PROFILE,
    feederWise: FEEDER_WISE,
    loadHeatmap: LOAD_HEATMAP,
    derivedNotes: ["Jaipur demo — sample analytics, not live billing data."],
  };
}

export function getDemoEquipmentBoard(): {
  board: MachineHealthBoardData;
  mapMachines: Array<{
    name: string;
    status: "CRITICAL" | "WARNING" | "GOOD" | "OPTIMIZED" | "OFFLINE" | "INFO";
    load: number;
    kwh: number | null;
    reason: string;
  }>;
} {
  const board: MachineHealthBoardData = {
    assets: HEALTH_ASSETS.map((a) => ({
      name: a.name,
      type: a.type,
      section: a.section,
      health: a.health,
      load: a.load,
      kwh30d: Math.round(a.runtime * a.load * 0.42),
      vib: a.vib,
      temp: a.temp,
      rpm: a.rpm,
      current: a.current,
      runtime: a.runtime,
      mtbf: a.mtbf,
      status: a.status,
      next: a.next,
    })),
    kpis: HEALTH_KPIS,
    healthDistribution: HEALTH_DISTRIBUTION,
    derivedNotes: ["Jaipur demo — predictive maintenance sample data."],
  };
  const mapMachines = OVERVIEW_MACHINES.map((m) => ({
    name: m.name,
    status: m.status,
    load: m.load,
    kwh: m.kwh,
    reason: m.reason,
  }));
  return { board, mapMachines };
}

export function getDemoPlantMap(): {
  levels: PlantMapLevels;
  rootLevelId: string;
  notes: string[];
} {
  return {
    levels: PLANT_LEVELS as PlantMapLevels,
    rootLevelId: "root",
    notes: ["Jaipur demo — hierarchy and loads are illustrative."],
  };
}

export function getDemoSustainabilityBoard(
  plantName: string,
  tariffLabel: string,
): SustainabilityBoardData {
  const grid = intensityDemoInput.gridKwh;
  const renewable = intensityDemoInput.renewableKwh;
  const production = intensityDemoInput.productionUnits ?? 1;
  const sec = grid / production;
  const scope2 = (grid / 1000) * intensityDemoInput.emissionFactorTPerMwh;
  return {
    plantName,
    tariffLabel,
    derivedNotes: ["Jaipur demo — SEC and emissions are sample values."],
    secKwhPerUnit: Math.round(sec * 10) / 10,
    scope2Tco2e: Math.round(scope2),
    renewablePct: Math.round((renewable / grid) * 1000) / 10,
    mdHeadroomPct: Math.round(
      ((intensityDemoInput.cmdKva - intensityDemoInput.peakMdKva) /
        intensityDemoInput.cmdKva) *
        1000,
    ) / 10,
    cmdKva: intensityDemoInput.cmdKva,
    peakMdKva: intensityDemoInput.peakMdKva,
    gridKwh30d: grid,
    productionUnits: intensityDemoInput.productionUnits,
    emissionFactorRef: intensityDemoInput.emissionFactorRef,
    secTrend: SEC_TREND.map((row) => ({ label: row.m, value: row.sec })),
    emissionsTrend: MONTHLY_COMPARISON.map((row) => ({
      label: row.m,
      value: Math.round(row.actual * 0.71),
    })),
    topConsumers: OVERVIEW_WASTERS.slice(0, 5).map((w) => ({
      label: w.machine,
      sharePct: Math.round((w.kwh / 1_200_000) * 1000) / 10,
      health:
        w.status === "OVER LIMIT"
          ? ("hot" as const)
          : w.status === "WARNING"
            ? ("watch" as const)
            : ("calm" as const),
    })),
    todPeakSharePct: 34,
  };
}

export function getDemoLiveAssets(): L2Asset[] {
  return [
    {
      asset_id: "incomer_1",
      name: "HT Incomer 11kV",
      level: "measurement_point",
      asset_class: "incomer",
    },
    {
      asset_id: "kiln_1",
      name: "Kiln 1",
      level: "equipment",
      asset_class: "furnace",
    },
    {
      asset_id: "cm_1",
      name: "Cement Mill 1",
      level: "equipment",
      asset_class: "mill",
    },
    {
      asset_id: "comp_2",
      name: "Compressor 2",
      level: "equipment",
      asset_class: "compressor",
    },
  ];
}

export function getDemoLiveMeasurements(): L2MeasurementPoint[] {
  const now = Date.now();
  const points: L2MeasurementPoint[] = [];
  for (let i = 0; i < 24; i++) {
    const ts = new Date(now - (23 - i) * 15 * 60 * 1000).toISOString();
    const hour = new Date(ts).getHours();
    const base =
      62000 +
      Math.sin((hour - 6) / 3.5) * 22000 +
      (hour >= 18 && hour <= 22 ? 14000 : 0);
    points.push({ ts, value: Math.round(base), quality: 192 });
  }
  return points;
}

export function getDemoLiveSnapshot(): LiveTelemetrySnapshot {
  const peak = OVERVIEW_DEMAND_PROFILE.reduce(
    (best, p) => (p.mw > best.mw ? p : best),
    OVERVIEW_DEMAND_PROFILE[0]!,
  );
  const plantMw = OVERVIEW_DEMAND_PROFILE.at(-1)?.mw ?? peak.mw;
  return {
    tick: 1,
    syncAgeSec: 12,
    dials: OVERVIEW_DIALS,
    machines: OVERVIEW_MACHINES,
    alerts: OVERVIEW_ALERTS.map((a) => ({
      id: a.id,
      time: a.time,
      severity: a.severity,
      machine: a.machine,
      message: a.message,
      action: a.action,
      alarmId: a.alarmId,
      live: false,
    })),
    demandProfile: OVERVIEW_DEMAND_PROFILE,
    anomalies: {
      total: OVERVIEW_KPIS.anomalies.total,
      critical: OVERVIEW_KPIS.anomalies.critical,
      warning: OVERVIEW_KPIS.anomalies.warning,
      info: OVERVIEW_KPIS.anomalies.info,
      lastTriggered: OVERVIEW_KPIS.anomalies.lastTriggered,
    },
    plantMw,
    peakMw: peak.mw,
    peakHour: peak.hour,
  };
}

export function getDemoUpstreamProbe() {
  return {
    l2: "down" as const,
    l5: "down" as const,
    l4: "off" as const,
    plantId: DEMO_PLANT_ID,
    orgId: "org_demo",
    checkedAt: "2026-07-21T10:15:00+05:30",
    demoMode: true,
    detail: { l2: "Jaipur demo session", l5: "Jaipur demo session" },
  };
}
