/** Minimal live-read shape; static demo uses DEMO_D157_NO_COSTS. */
export type D157RoiReportView = {
  plant_id?: string;
  status?: string;
  rows?: Array<Record<string, unknown>>;
  baseline_window?: Record<string, unknown>;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  rejection_rate_delta?: number;
  scrap_rate_delta?: number;
  money?: { currency: string; rejected_cost_delta: number; scrap_cost_delta: number; total_cost_delta: number };
  money_reason?: string;
  notes?: string[];
  detail?: string;
  reason?: string;
};

/**
 * D157 ROI report view (quality library shape).
 * Order is fixed: rejection_rate_delta, scrap_rate_delta, then money.
 * Money figures appear only when the plant has set unit costs.
 * Live via quality.get_d157_roi_report; EXAMPLE only when the read source is example.
 */

export type D157RateWindow = {
  label: string;
  n_total: number;
  n_rejected: number;
  n_scrap: number;
  rejection_rate: number;
  scrap_rate: number;
};

export type D157MoneyPresent = {
  status: "present";
  currency: string;
  rejected_cost_delta: number;
  scrap_cost_delta: number;
  total_cost_delta: number;
  notes: string[];
  /** Path or label of the caller-supplied costs file. */
  costs_file: string;
};

export type D157MoneyAbstained = {
  status: "abstained";
  reason: string;
  detail: string;
};

export type D157RoiReportOk = {
  status: "ok";
  plant_id: string;
  report_order: readonly ["rejection_rate_delta", "scrap_rate_delta", "money"];
  baseline: D157RateWindow;
  candidate: D157RateWindow;
  rejection_rate_delta: number;
  scrap_rate_delta: number;
  money: D157MoneyPresent | D157MoneyAbstained;
  notes: string[];
};

export const D157_REPORT_ORDER = [
  "rejection_rate_delta",
  "scrap_rate_delta",
  "money",
] as const;

const BASELINE: D157RateWindow = {
  label: "baseline",
  n_total: 1000,
  n_rejected: 42,
  n_scrap: 28,
  rejection_rate: 0.042,
  scrap_rate: 0.028,
};

const CANDIDATE: D157RateWindow = {
  label: "candidate",
  n_total: 1000,
  n_rejected: 31,
  n_scrap: 21,
  rejection_rate: 0.031,
  scrap_rate: 0.021,
};

/** EXAMPLE: rates only; money abstains until unit costs are set. Default path. */
export const DEMO_D157_NO_COSTS: D157RoiReportOk = {
  status: "ok",
  plant_id: "plant-illustrative",
  report_order: D157_REPORT_ORDER,
  baseline: BASELINE,
  candidate: CANDIDATE,
  rejection_rate_delta: CANDIDATE.rejection_rate - BASELINE.rejection_rate,
  scrap_rate_delta: CANDIDATE.scrap_rate - BASELINE.scrap_rate,
  money: {
    status: "abstained",
    reason: "unit costs not set",
    detail: "Money section abstains until the plant sets unit costs (D157). Fields start empty; no default price.",
  },
  notes: [
    "d157_order",
    "rejection_and_scrap_deltas_first",
    "money_only_with_unit_costs",
    "EXAMPLE_DATA",
  ],
};

/** Build money from plant-entered unit costs. Never invents a default tariff. */
export function d157MoneyFromUnitCosts(args: {
  currency: string;
  cost_per_rejection: number;
  cost_per_scrap: number;
  units_in_period: number;
  rejection_rate_delta: number;
  scrap_rate_delta: number;
  costs_file?: string;
}): D157MoneyPresent {
  const rejected_cost_delta = Math.round(
    args.rejection_rate_delta * args.units_in_period * args.cost_per_rejection,
  );
  const scrap_cost_delta = Math.round(
    args.scrap_rate_delta * args.units_in_period * args.cost_per_scrap,
  );
  return {
    status: "present",
    currency: args.currency,
    rejected_cost_delta,
    scrap_cost_delta,
    total_cost_delta: rejected_cost_delta + scrap_cost_delta,
    notes: ["from_plant_unit_costs", "no_package_pricing", "no_default_price"],
    costs_file: args.costs_file ?? "plant-entered",
  };
}

/**
 * EXAMPLE helper for tests only: same rates with caller-supplied unit costs.
 * Not a UI default; the form starts empty.
 */
export const DEMO_D157_WITH_COSTS: D157RoiReportOk = {
  ...DEMO_D157_NO_COSTS,
  money: d157MoneyFromUnitCosts({
    currency: "INR",
    cost_per_rejection: 120,
    cost_per_scrap: 450,
    units_in_period: 1000,
    rejection_rate_delta: DEMO_D157_NO_COSTS.rejection_rate_delta,
    scrap_rate_delta: DEMO_D157_NO_COSTS.scrap_rate_delta,
    costs_file: "plant-entered-test",
  }),
};

export function pctDelta(fraction: number): string {
  const pts = (fraction * 100).toFixed(2);
  return `${fraction >= 0 ? "+" : ""}${pts} pt`;
}

export function pctRate(fraction: number): string {
  return `${(fraction * 100).toFixed(2)}%`;
}


/** Map the live read contract (D157RoiReportView) into the panel shape. */
export function d157ViewToPanel(view: D157RoiReportView | null | undefined): D157RoiReportOk | null {
  if (!view) return null;
  const row: D157RoiReportView = view.rows && view.rows[0] ? view.rows[0] : view;
  if (String(row.status) !== "ok") return null;

  const baseline = rateWindowFrom(
    (row.baseline_window as Record<string, unknown> | undefined) ??
      (row.before as Record<string, unknown> | undefined),
    "baseline",
  );
  const candidate = rateWindowFrom(
    row.after as Record<string, unknown> | undefined,
    "candidate",
  );
  const rejection_rate_delta = Number(row.rejection_rate_delta);
  const scrap_rate_delta = Number(row.scrap_rate_delta);
  if (
    !baseline ||
    !candidate ||
    !Number.isFinite(rejection_rate_delta) ||
    !Number.isFinite(scrap_rate_delta)
  ) {
    return null;
  }

  let money: D157MoneyPresent | D157MoneyAbstained;
  if (row.money != null) {
    money = {
      status: "present",
      currency: String(row.money.currency),
      rejected_cost_delta: Number(row.money.rejected_cost_delta),
      scrap_cost_delta: Number(row.money.scrap_cost_delta),
      total_cost_delta: Number(row.money.total_cost_delta),
      notes: ["from_plant_unit_costs", "no_package_pricing", "no_default_price"],
      costs_file: "unit_costs",
    };
  } else {
    money = {
      status: "abstained",
      reason: String(row.money_reason ?? "unit costs not set"),
      detail:
        "Money section abstains until the plant sets unit costs (D157). Fields start empty; no default price.",
    };
  }

  return {
    status: "ok",
    plant_id: String(row.plant_id ?? view.plant_id ?? ""),
    report_order: D157_REPORT_ORDER,
    baseline,
    candidate,
    rejection_rate_delta,
    scrap_rate_delta,
    money,
    notes: Array.isArray(row.notes) ? row.notes.map(String) : [],
  };
}

function rateWindowFrom(
  raw: Record<string, unknown> | undefined,
  fallbackLabel: string,
): D157RateWindow | null {
  if (!raw || typeof raw !== "object") return null;
  const n_total = Number(raw.n_total);
  const n_rejected = Number(raw.n_rejected);
  const n_scrap = Number(raw.n_scrap);
  const rejection_rate = Number(raw.rejection_rate);
  const scrap_rate = Number(raw.scrap_rate);
  if (
    ![n_total, n_rejected, n_scrap, rejection_rate, scrap_rate].every(Number.isFinite)
  ) {
    return null;
  }
  return {
    label: String(raw.label ?? fallbackLabel),
    n_total,
    n_rejected,
    n_scrap,
    rejection_rate,
    scrap_rate,
  };
}
