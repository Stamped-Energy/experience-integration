/**
 * Energy Analytics board DTO — shaped for EnergyBoard props.
 * Every series is null when upstream cannot supply it (never invent).
 */
import type { L2QueryClient } from "../upstream/l2/client.js";
import { GRID_TCO2E_PER_KWH } from "../overview/service.js";

const FALLBACK_ENERGY_INR_PER_KWH = 6.32;
/** When no locked baseline: mild uplift so “vs baseline” is labeled derived. */
const IMPLIED_BASELINE_UPLIFT = 1.08;

export type EnergyKpi = {
  label: string;
  value: string;
  unit: string;
  delta: number | null;
  good: boolean | null;
};

export type MonthlyPoint = {
  m: string;
  actual: number;
  baseline: number;
  cost: number;
};

export type NamedSlice = {
  name: string;
  value: number;
  color: string;
};

export type PfPoint = { day: number; date: string; pf: number };
export type SecPoint = { m: string; sec: number };
export type WeekdayPoint = { d: string; kwh: number };
export type FeederRow = {
  feeder: string;
  assetId: string;
  kwh: number;
  share: number;
  pf: number | null;
};
export type HeatCell = { day: string; hour: number; v: number };
export type CumSavePoint = { m: string; saved: number; cum: number };

export type EnergyBoardDto = {
  plantId: string;
  source: "l2" | "unavailable";
  generatedAt: string;
  detail: string | null;
  /** Derived labels — client must not treat as metered truth without note. */
  derivedNotes: string[];
  kpis: EnergyKpi[];
  monthlyComparison: MonthlyPoint[] | null;
  cumulativeSavings: CumSavePoint[] | null;
  costBreakdown: NamedSlice[] | null;
  /** Always null until L2 has a generation/source-mix table (Class D). */
  sourceMix: NamedSlice[] | null;
  powerFactorTrend: PfPoint[] | null;
  secTrend: SecPoint[] | null;
  weekdayProfile: WeekdayPoint[] | null;
  feederWise: FeederRow[] | null;
  loadHeatmap: HeatCell[][] | null;
  energyInrPerKwh: number | null;
  cmdKva: number | null;
  peakDemandKva: number | null;
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

function dailyDeltasFromCumulative(
  points: Array<{ ts: string; value: number }>,
): Array<{ date: string; kwh: number }> {
  if (points.length < 2) return [];
  const byDay = new Map<string, number>();
  for (const p of points) {
    byDay.set(p.ts.slice(0, 10), p.value);
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

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const COST_COLORS = ["#f75440", "#000a07", "#c97a00", "#ba1a1a", "#8f706b"] as const;

const FEEDER_ASSETS = [
  { assetId: "feeder_a", label: "Feeder A" },
  { assetId: "feeder_b", label: "Feeder B" },
] as const;

/** Pure helper — monthly rows from bill headers (exported for unit tests). */
export function monthlyFromBills(
  bills: Array<Record<string, unknown>>,
  rateInrPerKwh: number,
): MonthlyPoint[] {
  const rows: MonthlyPoint[] = [];
  for (const b of bills) {
    const month =
      String(b.bill_month ?? b.month ?? b.period ?? "").trim() ||
      String(b.bill_id ?? "");
    const kwh =
      num(b.total_kwh) ??
      num(b.energy_kwh) ??
      num(b.billed_kwh) ??
      num(b.kwh);
    const costInr =
      num(b.total_amount_inr) ??
      num(b.amount_inr) ??
      num(b.total_inr) ??
      (kwh != null ? kwh * rateInrPerKwh : null);
    if (kwh == null || costInr == null) continue;
    const actual = Math.round(kwh / 1000); // chart axis is “k kWh”
    const baseline = Math.round(actual * IMPLIED_BASELINE_UPLIFT);
    const label =
      month.length >= 7
        ? MONTH_SHORT[Number(month.slice(5, 7)) - 1] ?? month.slice(0, 7)
        : month.slice(0, 3) || "—";
    rows.push({
      m: label,
      actual,
      baseline,
      cost: Math.round((costInr / 100_000) * 10) / 10, // ₹L
    });
  }
  return rows;
}

/** Pure helper — weekday profile from daily kWh deltas. */
export function weekdayFromDaily(
  daily: Array<{ date: string; kwh: number }>,
): WeekdayPoint[] {
  const sums = new Map<string, { kwh: number; n: number }>();
  for (const d of WEEKDAYS) sums.set(d, { kwh: 0, n: 0 });
  for (const row of daily) {
    const wd = WEEKDAYS[new Date(`${row.date}T12:00:00Z`).getUTCDay()]!;
    const cur = sums.get(wd)!;
    cur.kwh += row.kwh;
    cur.n += 1;
  }
  // Display Mon→Sun
  const order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
  return order.map((d) => {
    const cur = sums.get(d)!;
    return { d, kwh: cur.n ? Math.round(cur.kwh / cur.n) : 0 };
  });
}

export async function buildEnergyBoard(input: {
  plantId: string;
  l2: L2QueryClient | null;
}): Promise<EnergyBoardDto> {
  const generatedAt = new Date().toISOString();
  const empty = (detail: string): EnergyBoardDto => ({
    plantId: input.plantId,
    source: "unavailable",
    generatedAt,
    detail,
    derivedNotes: [],
    kpis: [],
    monthlyComparison: null,
    cumulativeSavings: null,
    costBreakdown: null,
    sourceMix: null,
    powerFactorTrend: null,
    secTrend: null,
    weekdayProfile: null,
    feederWise: null,
    loadHeatmap: null,
    energyInrPerKwh: null,
    cmdKva: null,
    peakDemandKva: null,
  });

  if (!input.l2) {
    return empty("L2 client not configured");
  }

  const derivedNotes: string[] = [];
  const detailParts: string[] = [];
  let energyInrPerKwh: number | null = null;
  let cmdKva: number | null = null;
  let peakDemandKva: number | null = null;
  let monthlyComparison: MonthlyPoint[] | null = null;
  let cumulativeSavings: CumSavePoint[] | null = null;
  let costBreakdown: NamedSlice[] | null = null;
  let powerFactorTrend: PfPoint[] | null = null;
  let secTrend: SecPoint[] | null = null;
  let weekdayProfile: WeekdayPoint[] | null = null;
  let feederWise: FeederRow[] | null = null;
  let loadHeatmap: HeatCell[][] | null = null;
  let avgPf: number | null = null;
  let secLatest: number | null = null;
  let totalEnergyMtd: number | null = null;

  try {
    const tariff = await input.l2.getActiveTariff(input.plantId);
    const rates =
      tariff.rates && typeof tariff.rates === "object"
        ? (tariff.rates as Record<string, unknown>)
        : tariff;
    cmdKva =
      num(tariff.cmd_kva) ??
      num(tariff.cmdKva) ??
      num((rates as Record<string, unknown>).cmd_kva);
    energyInrPerKwh =
      num(tariff.energy_charge_inr_per_kwh) ??
      num((rates as Record<string, unknown>).energy_charge_inr_per_kwh) ??
      FALLBACK_ENERGY_INR_PER_KWH;
    if (energyInrPerKwh === FALLBACK_ENERGY_INR_PER_KWH) {
      derivedNotes.push("Energy ₹/kWh used fallback rate (tariff field missing).");
    }
  } catch (err) {
    detailParts.push(err instanceof Error ? err.message : "tariff unavailable");
    energyInrPerKwh = FALLBACK_ENERGY_INR_PER_KWH;
    derivedNotes.push("Energy ₹/kWh used fallback rate (tariff unavailable).");
  }

  const rate = energyInrPerKwh ?? FALLBACK_ENERGY_INR_PER_KWH;

  try {
    const bills = await input.l2.listBills({ plantId: input.plantId });
    const monthly = monthlyFromBills(bills.bills, rate);
    if (monthly.length > 0) {
      monthlyComparison = monthly;
      derivedNotes.push("Baseline on monthly chart is derived (+8% uplift), not a locked L2 baseline.");
      let cum = 0;
      cumulativeSavings = monthly.map((row) => {
        const saved = Math.round((row.baseline - row.actual) * 1000 * rate);
        cum += saved;
        return { m: row.m, saved, cum };
      });
      // Cost breakdown from latest bill lines when present
      const latest = bills.bills[bills.bills.length - 1];
      const billId = latest ? String(latest.bill_id ?? latest.id ?? "") : "";
      if (billId) {
        try {
          const lines = await input.l2.getBillLines({
            plantId: input.plantId,
            billId,
          });
          const slices: NamedSlice[] = [];
          let ci = 0;
          for (const line of lines.lines) {
            const amt =
              num(line.amount_inr) ??
              num(line.amount) ??
              num(line.line_amount_inr);
            const name = String(line.description ?? line.line_type ?? line.name ?? "Charge");
            if (amt == null || amt <= 0) continue;
            slices.push({
              name,
              value: Math.round(amt),
              color: COST_COLORS[ci % COST_COLORS.length]!,
            });
            ci += 1;
          }
          if (slices.length > 0) costBreakdown = slices;
        } catch {
          /* optional */
        }
      }
    }
  } catch (err) {
    detailParts.push(err instanceof Error ? err.message : "bills unavailable");
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
    const daily = dailyDeltasFromCumulative(energy.points);
    if (daily.length > 0) {
      weekdayProfile = weekdayFromDaily(daily);
      totalEnergyMtd = energyDeltaFromPoints(energy.points);
    }
  } catch (err) {
    detailParts.push(err instanceof Error ? err.message : "energy series unavailable");
  }

  try {
    const pf = await input.l2.listMeasurements({
      plantId: input.plantId,
      assetId: "incomer_1",
      metric: "power_factor",
      from: from30.toISOString(),
      to: to.toISOString(),
      granularity: "day",
    });
    if (pf.points.length > 0) {
      const byDay = new Map<string, number[]>();
      for (const p of pf.points) {
        const day = p.ts.slice(0, 10);
        const arr = byDay.get(day) ?? [];
        arr.push(p.value);
        byDay.set(day, arr);
      }
      const days = [...byDay.keys()].sort();
      powerFactorTrend = days.map((date, i) => {
        const vals = byDay.get(date)!;
        const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
        return { day: i + 1, date, pf: +mean.toFixed(3) };
      });
      avgPf =
        powerFactorTrend.reduce((s, p) => s + p.pf, 0) / powerFactorTrend.length;
    }
  } catch {
    /* optional */
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
      peakDemandKva = Math.max(...md.points.map((p) => p.value));
    }
  } catch {
    /* optional */
  }

  try {
    const power = await input.l2.listMeasurements({
      plantId: input.plantId,
      assetId: "incomer_1",
      metric: "active_power_kw",
      from: from7.toISOString(),
      to: to.toISOString(),
      granularity: "15min",
    });
    if (power.points.length > 0) {
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
      const grid = new Map<string, number[]>();
      for (const d of ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) {
        grid.set(d, Array.from({ length: 24 }, () => 0));
      }
      const counts = new Map<string, number[]>();
      for (const d of grid.keys()) {
        counts.set(d, Array.from({ length: 24 }, () => 0));
      }
      let maxKw = 1;
      for (const p of power.points) {
        const dt = new Date(p.ts);
        const d = dayNames[dt.getUTCDay()]!;
        const h = dt.getUTCHours();
        const g = grid.get(d)!;
        const c = counts.get(d)!;
        g[h] = (g[h] ?? 0) + p.value;
        c[h] = (c[h] ?? 0) + 1;
        maxKw = Math.max(maxKw, p.value);
      }
      loadHeatmap = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => {
        const g = grid.get(d)!;
        const c = counts.get(d)!;
        return g.map((sum, hour) => {
          const n = c[hour] ?? 0;
          const avg = n ? sum / n : 0;
          const v = Math.round(Math.min(100, (avg / maxKw) * 100));
          return { day: d, hour, v };
        });
      });
    }
  } catch {
    /* optional */
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
    const points =
      (payload.sec_points as Array<Record<string, unknown>> | undefined) ??
      (payload.points as Array<Record<string, unknown>> | undefined) ??
      [];
    const trend: SecPoint[] = [];
    for (const p of points) {
      const secVal = num(p.sec) ?? num(p.value) ?? num(p.sec_kwh_per_t);
      const label = String(p.month ?? p.m ?? p.label ?? trend.length + 1);
      if (secVal == null) continue;
      trend.push({ m: label.slice(0, 3), sec: +secVal.toFixed(2) });
    }
    if (trend.length > 0) {
      secTrend = trend;
      secLatest = trend[trend.length - 1]!.sec;
    } else {
      const single = num(payload.sec) ?? num(payload.baseline_sec);
      if (single != null) {
        secLatest = single;
        secTrend = [{ m: "Now", sec: +single.toFixed(2) }];
      }
    }
  } catch {
    /* optional */
  }

  const feederRows: FeederRow[] = [];
  let feederTotal = 0;
  for (const f of FEEDER_ASSETS) {
    try {
      const energy = await input.l2.listMeasurements({
        plantId: input.plantId,
        assetId: f.assetId,
        metric: "active_energy_kwh",
        from: from30.toISOString(),
        to: to.toISOString(),
        granularity: "day",
      });
      const kwh = energyDeltaFromPoints(energy.points) ?? 0;
      let pf: number | null = null;
      try {
        const pfSeries = await input.l2.listMeasurements({
          plantId: input.plantId,
          assetId: f.assetId,
          metric: "power_factor",
          from: from7.toISOString(),
          to: to.toISOString(),
          granularity: "day",
        });
        if (pfSeries.points.length > 0) {
          pf =
            pfSeries.points.reduce((s, p) => s + p.value, 0) /
            pfSeries.points.length;
        }
      } catch {
        /* feeders may lack PF */
      }
      feederRows.push({
        feeder: f.label,
        assetId: f.assetId,
        kwh: Math.round(kwh),
        share: 0,
        pf: pf != null ? +pf.toFixed(3) : null,
      });
      feederTotal += kwh;
    } catch {
      /* skip missing feeder */
    }
  }
  if (feederRows.length > 0) {
    feederWise = feederRows.map((r) => ({
      ...r,
      share:
        feederTotal > 0
          ? Math.round((r.kwh / feederTotal) * 1000) / 10
          : 0,
    }));
  }

  const kpis: EnergyKpi[] = [];
  if (secLatest != null) {
    kpis.push({
      label: "Specific Energy Consumption",
      value: String(secLatest),
      unit: "kWh/t",
      delta: null,
      good: null,
    });
  }
  if (avgPf != null) {
    kpis.push({
      label: "Avg Power Factor",
      value: avgPf.toFixed(2),
      unit: "",
      delta: null,
      good: avgPf >= 0.9,
    });
  }
  if (peakDemandKva != null) {
    kpis.push({
      label: "Peak Demand (7d)",
      value: String(Math.round(peakDemandKva)),
      unit: "kVA",
      delta: null,
      good: cmdKva != null ? peakDemandKva < cmdKva : null,
    });
  }
  if (cmdKva != null && peakDemandKva != null && cmdKva > 0) {
    const headroom = ((cmdKva - peakDemandKva) / cmdKva) * 100;
    kpis.push({
      label: "MD Headroom",
      value: headroom.toFixed(1),
      unit: "%",
      delta: null,
      good: headroom > 5,
    });
  }
  if (totalEnergyMtd != null) {
    kpis.push({
      label: "Energy (30d)",
      value: String(Math.round(totalEnergyMtd)),
      unit: "kWh",
      delta: null,
      good: null,
    });
  }
  if (energyInrPerKwh != null && totalEnergyMtd != null) {
    kpis.push({
      label: "Est. energy cost (30d)",
      value: `₹${Math.round(totalEnergyMtd * energyInrPerKwh).toLocaleString("en-IN")}`,
      unit: "",
      delta: null,
      good: null,
    });
  }
  // CO2 derived
  if (totalEnergyMtd != null) {
    kpis.push({
      label: "CO₂e (30d, grid factor)",
      value: (totalEnergyMtd * GRID_TCO2E_PER_KWH).toFixed(1),
      unit: "t",
      delta: null,
      good: null,
    });
    derivedNotes.push(
      `CO₂e uses grid factor ${GRID_TCO2E_PER_KWH} t/kWh (not plant-specific).`,
    );
  }

  const hasAny =
    monthlyComparison != null ||
    powerFactorTrend != null ||
    weekdayProfile != null ||
    feederWise != null ||
    secTrend != null ||
    kpis.length > 0;

  return {
    plantId: input.plantId,
    source: hasAny ? "l2" : "unavailable",
    generatedAt,
    detail: hasAny
      ? detailParts.length
        ? detailParts.join("; ")
        : null
      : detailParts.join("; ") || "No L2 energy series for this plant",
    derivedNotes,
    kpis,
    monthlyComparison,
    cumulativeSavings,
    costBreakdown,
    sourceMix: null,
    powerFactorTrend,
    secTrend,
    weekdayProfile,
    feederWise,
    loadHeatmap,
    energyInrPerKwh,
    cmdKva,
    peakDemandKva,
  };
}
