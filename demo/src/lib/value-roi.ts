/** D157 value ROI view: rates lead; money abstains when plant unit costs are unset. */

export type RatesSource = "caller_inputs" | "plant_ops_export" | "store_verified_lots";

export interface RateDelta {
  baseline: number;
  current: number;
  delta: number;
  unit: "fraction";
}

export interface MoneyOk {
  status: "ok";
  currency: string;
  rejection_savings: number;
  scrap_savings: number;
  total_savings: number;
}

export interface MoneyAbstain {
  status: "abstain";
  abstain_reason: string;
}

export interface ValueRoiOk {
  schema_version: "0.1.0";
  plant_id: string;
  period?: { from?: string; to?: string };
  rates_status: "ok";
  rates_source: RatesSource;
  rejection_rate: RateDelta;
  scrap_rate: RateDelta;
  money: MoneyOk | MoneyAbstain;
}

export interface ValueRoiRatesAbstain {
  schema_version: "0.1.0";
  plant_id: string;
  period?: { from?: string; to?: string };
  rates_status: "abstain";
  rates_source: null;
  rates_abstain_reason: string;
  money: MoneyAbstain;
}

export type ValueRoi = ValueRoiOk | ValueRoiRatesAbstain;

/** Plant-entered unit costs. Fields start empty; money abstains until all required are set. */
export interface UnitCostsDraft {
  currency: string;
  cost_per_rejection: string;
  cost_per_scrap: string;
  units_in_period: string;
}

export const EMPTY_UNIT_COSTS: UnitCostsDraft = {
  currency: "INR",
  cost_per_rejection: "",
  cost_per_scrap: "",
  units_in_period: "",
};

export type ParsedUnitCosts =
  | { ok: true; currency: string; cost_per_rejection: number; cost_per_scrap: number; units_in_period: number }
  | { ok: false; missing: string[] };

export function parseUnitCosts(draft: UnitCostsDraft): ParsedUnitCosts {
  const missing: string[] = [];
  const currency = draft.currency.trim();
  if (!currency || currency.length !== 3) missing.push("currency");
  const cost_per_rejection = Number(draft.cost_per_rejection);
  if (draft.cost_per_rejection.trim() === "" || !Number.isFinite(cost_per_rejection) || cost_per_rejection < 0) {
    missing.push("cost_per_rejection");
  }
  const cost_per_scrap = Number(draft.cost_per_scrap);
  if (draft.cost_per_scrap.trim() === "" || !Number.isFinite(cost_per_scrap) || cost_per_scrap < 0) {
    missing.push("cost_per_scrap");
  }
  const units_in_period = Number(draft.units_in_period);
  if (draft.units_in_period.trim() === "" || !Number.isFinite(units_in_period) || units_in_period <= 0) {
    missing.push("units_in_period");
  }
  if (missing.length) return { ok: false, missing };
  return {
    ok: true,
    currency,
    cost_per_rejection,
    cost_per_scrap,
    units_in_period,
  };
}

/** Build money from rates × plant-entered unit costs. Never invents a default price. */
export function moneyFromRatesAndCosts(
  rejection: RateDelta,
  scrap: RateDelta,
  costs: Extract<ParsedUnitCosts, { ok: true }>,
): MoneyOk {
  const rejection_savings = Math.round(-rejection.delta * costs.units_in_period * costs.cost_per_rejection);
  const scrap_savings = Math.round(-scrap.delta * costs.units_in_period * costs.cost_per_scrap);
  return {
    status: "ok",
    currency: costs.currency,
    rejection_savings,
    scrap_savings,
    total_savings: rejection_savings + scrap_savings,
  };
}

export function applyUnitCosts(roi: ValueRoi, draft: UnitCostsDraft): ValueRoi {
  const parsed = parseUnitCosts(draft);
  if (!parsed.ok) {
    const reason =
      "Plant unit costs are unset; money ROI abstains (D157). Set cost_per_rejection, cost_per_scrap and units_in_period. Missing: " +
      parsed.missing.join(", ") +
      ".";
    if (roi.rates_status === "ok") {
      return { ...roi, money: { status: "abstain", abstain_reason: reason } };
    }
    return { ...roi, money: { status: "abstain", abstain_reason: reason } };
  }
  if (roi.rates_status !== "ok") {
    return {
      ...roi,
      money: {
        status: "abstain",
        abstain_reason: "Rates abstained; money cannot be computed from unit costs alone (D157).",
      },
    };
  }
  return {
    ...roi,
    money: moneyFromRatesAndCosts(roi.rejection_rate, roi.scrap_rate, parsed),
  };
}

/** Illustrative rates matching contracts/fixtures/platform/value_roi.*.json. No money defaults. */
export const DEMO_RATES = {
  rejection: { baseline: 0.042, current: 0.031, delta: -0.011, unit: "fraction" as const },
  scrap: { baseline: 0.028, current: 0.021, delta: -0.007, unit: "fraction" as const },
  period: { from: "2026-10-01T00:00:00Z", to: "2026-10-28T00:00:00Z" },
};

/** Demo when plant costs are unset - money abstains; rates still show. Default EXAMPLE path. */
export const DEMO_ROI_ABSTAIN: ValueRoi = {
  schema_version: "0.1.0",
  plant_id: "plant_demo",
  period: DEMO_RATES.period,
  rates_status: "ok",
  rates_source: "caller_inputs",
  rejection_rate: DEMO_RATES.rejection,
  scrap_rate: DEMO_RATES.scrap,
  money: {
    status: "abstain",
    abstain_reason:
      "Plant unit costs are unset; money ROI abstains (D157). Set cost_per_rejection, cost_per_scrap and units_in_period in the plant costs config.",
  },
};

/**
 * @deprecated Prefer applyUnitCosts(DEMO_ROI_ABSTAIN, draft) after the plant enters costs.
 * Kept only so tests can assert money-ok shape; never used as a UI default.
 */
export const DEMO_ROI_WITH_COSTS: ValueRoi = applyUnitCosts(DEMO_ROI_ABSTAIN, {
  currency: "INR",
  cost_per_rejection: "120",
  cost_per_scrap: "450",
  units_in_period: "1000",
});

export function pct(fraction: number): string {
  return `${(fraction * 100).toFixed(2)}%`;
}

export function moneyFmt(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(0)}`;
  }
}

export function ratesSourceLabel(source: RatesSource | null | undefined): string {
  switch (source) {
    case "caller_inputs":
      return "Caller inputs";
    case "plant_ops_export":
      return "Plant ops export";
    case "store_verified_lots":
      return "Store (verified lots)";
    default:
      return "Rates abstained";
  }
}
