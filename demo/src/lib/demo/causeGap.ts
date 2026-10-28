/**
 * Illustrative cause-gap screens (quality 0.7.x get_* wrappers).
 * EXAMPLE DATA only. Never plant figures. Operator ids are pseudonyms.
 */
const I = { illustrative: true as const };

export type OperatorShiftDemo = {
  illustrative: true;
  status: "ok";
  plant_id: string;
  n_lots: number;
  n_operators_in_scope: number;
  shift_aggregates: {
    shift_id: string;
    lots: number;
    units_produced: number;
    rejected_units: number;
    rejection_rate: number;
    skill_bands: string[];
  }[];
  include_operator_breakdown: boolean;
  withheld_below_min_group_size: number;
  operator_breakdown: {
    operator_pseudonym: string;
    shift_id: string;
    lots: number;
    units_produced: number;
    rejected_units: number;
    rejection_rate: number;
    skill_ids: string[];
  }[];
  notes: string[];
};

export const operatorShiftDemo: OperatorShiftDemo = {
  ...I,
  status: "ok",
  plant_id: "plant_demo",
  n_lots: 48,
  n_operators_in_scope: 9,
  shift_aggregates: [
    {
      shift_id: "shift-a",
      lots: 26,
      units_produced: 5200,
      rejected_units: 156,
      rejection_rate: 0.03,
      skill_bands: ["L2", "L3"],
    },
    {
      shift_id: "shift-b",
      lots: 22,
      units_produced: 4400,
      rejected_units: 220,
      rejection_rate: 0.05,
      skill_bands: ["L1", "L2"],
    },
  ],
  include_operator_breakdown: true,
  withheld_below_min_group_size: 1,
  operator_breakdown: [
    {
      operator_pseudonym: "op_7f2a",
      shift_id: "shift-a",
      lots: 12,
      units_produced: 2400,
      rejected_units: 48,
      rejection_rate: 0.02,
      skill_ids: ["press", "setup"],
    },
    {
      operator_pseudonym: "op_c91b",
      shift_id: "shift-b",
      lots: 10,
      units_produced: 2000,
      rejected_units: 140,
      rejection_rate: 0.07,
      skill_ids: ["press"],
    },
  ],
  notes: ["training_and_context", "never_blame", "illustrative_operator_shift"],
};

export type EnvironmentDemo = {
  illustrative: true;
  status: "ok";
  plant_id: string;
  n_lots: number;
  n_samples: number;
  joins: {
    lot_id: string;
    n_samples: number;
    mean_temperature_c: number;
    mean_humidity_pct: number;
    mean_power_quality_index: number;
    units_produced: number;
    rejected_units: number;
    rejection_rate: number;
  }[];
  shadow_flags: {
    metric: string;
    n_lots: number;
    pearson_r: number;
    abs_r: number;
    notes: string[];
  }[];
  notes: string[];
};

export const environmentDemo: EnvironmentDemo = {
  ...I,
  status: "ok",
  plant_id: "plant_demo",
  n_lots: 5,
  n_samples: 120,
  joins: [
    {
      lot_id: "lot-a-3301",
      n_samples: 24,
      mean_temperature_c: 20.0,
      mean_humidity_pct: 45,
      mean_power_quality_index: 0.98,
      units_produced: 1000,
      rejected_units: 0,
      rejection_rate: 0.0,
    },
    {
      lot_id: "lot-a-3303",
      n_samples: 24,
      mean_temperature_c: 22.0,
      mean_humidity_pct: 48,
      mean_power_quality_index: 0.97,
      units_produced: 1000,
      rejected_units: 20,
      rejection_rate: 0.02,
    },
    {
      lot_id: "lot-a-3305",
      n_samples: 24,
      mean_temperature_c: 24.0,
      mean_humidity_pct: 50,
      mean_power_quality_index: 0.96,
      units_produced: 1000,
      rejected_units: 40,
      rejection_rate: 0.04,
    },
    {
      lot_id: "lot-a-3307",
      n_samples: 24,
      mean_temperature_c: 26.0,
      mean_humidity_pct: 52,
      mean_power_quality_index: 0.95,
      units_produced: 1000,
      rejected_units: 60,
      rejection_rate: 0.06,
    },
    {
      lot_id: "lot-a-3309",
      n_samples: 24,
      mean_temperature_c: 28.0,
      mean_humidity_pct: 55,
      mean_power_quality_index: 0.94,
      units_produced: 1000,
      rejected_units: 80,
      rejection_rate: 0.08,
    },
  ],
  shadow_flags: [
    {
      metric: "temperature_c",
      n_lots: 5,
      pearson_r: 0.99,
      abs_r: 0.99,
      notes: ["shadow", "recommend_only", "illustrative"],
    },
  ],
  notes: ["environment_ingest", "shadow_correlation", "illustrative"],
};

export type ChangeControlDemo = {
  illustrative: true;
  status: "ok";
  plant_id: string;
  n_changes: number;
  n_lots: number;
  flags: {
    change_id: string;
    kind: "tool" | "program" | "supplier" | "setting";
    subject_id: string;
    before_rate: number;
    after_rate: number;
    rate_delta: number;
    before_lots: number;
    after_lots: number;
    notes: string[];
  }[];
  notes: string[];
};

export const changeControlDemo: ChangeControlDemo = {
  ...I,
  status: "ok",
  plant_id: "plant_demo",
  n_changes: 3,
  n_lots: 40,
  flags: [
    {
      change_id: "CH-tool-14",
      kind: "tool",
      subject_id: "die-set-b",
      before_rate: 0.018,
      after_rate: 0.092,
      rate_delta: 0.074,
      before_lots: 12,
      after_lots: 8,
      notes: ["shadow", "recommend_only", "illustrative"],
    },
    {
      change_id: "CH-supplier-3",
      kind: "supplier",
      subject_id: "sup-resin-b",
      before_rate: 0.022,
      after_rate: 0.041,
      rate_delta: 0.019,
      before_lots: 10,
      after_lots: 10,
      notes: ["shadow", "recommend_only", "illustrative"],
    },
  ],
  notes: ["change_control_log", "before_after_rates", "illustrative"],
};

export type CapaParetoDemo = {
  illustrative: true;
  status: "ok";
  plant_id: string;
  n_tags: number;
  n_actions: number;
  categories: string[];
  pareto: { category: string; count: number; share: number }[];
  notes: string[];
};

export const capaParetoDemo: CapaParetoDemo = {
  ...I,
  status: "ok",
  plant_id: "plant_demo",
  n_tags: 12,
  n_actions: 10,
  categories: ["man", "machine", "method", "material", "measurement", "mother_nature", "design"],
  pareto: [
    { category: "man", count: 4, share: 0.333 },
    { category: "machine", count: 3, share: 0.25 },
    { category: "method", count: 2, share: 0.167 },
    { category: "material", count: 2, share: 0.167 },
    { category: "design", count: 1, share: 0.083 },
  ],
  notes: ["six_m_plus_design", "capa_category_pareto", "illustrative"],
};


export type PokaYokeDemo = {
  illustrative: true;
  status: "ok";
  plant_id: string;
  n_capa_rows: number;
  n_human_error_rows: number;
  candidates: {
    root_cause_code: string;
    occurrence_count: number;
    capa_ids: string[];
    suggested_controls: string[];
    catalogue_hit: boolean;
    notes: string[];
  }[];
  notes: string[];
};

export const pokaYokeDemo: PokaYokeDemo = {
  ...I,
  status: "ok",
  plant_id: "plant_demo",
  n_capa_rows: 4,
  n_human_error_rows: 3,
  candidates: [
    {
      root_cause_code: "HE-X",
      occurrence_count: 3,
      capa_ids: ["capa-a", "capa-b", "capa-c"],
      suggested_controls: ["guide_pin", "poke-yoke fixture"],
      catalogue_hit: true,
      notes: ["shadow", "recommend_only", "illustrative"],
    },
  ],
  notes: ["poka_yoke_gap", "shadow", "recommend_only", "illustrative"],
};

/** Illustrative inputs for live/example cause-gap reads. Not plant data. */
export const operatorShiftReadInputs = {
  plant_id: "plant_demo",
  runs: [
    { lot_id: "L1", operator_id: "op-a", shift_id: "shift-a", units_produced: 2400 },
    { lot_id: "L2", operator_id: "op-b", shift_id: "shift-a", units_produced: 2800 },
    { lot_id: "L3", operator_id: "op-c", shift_id: "shift-b", units_produced: 2000 },
    { lot_id: "L4", operator_id: "op-d", shift_id: "shift-b", units_produced: 2400 },
  ],
  rejections: [
    { lot_id: "L1", rejected_units: 48 },
    { lot_id: "L2", rejected_units: 108 },
    { lot_id: "L3", rejected_units: 140 },
    { lot_id: "L4", rejected_units: 80 },
  ],
  include_operator_breakdown: true,
  min_group_size: 1,
  pseudonym_salt: "demo",
} as const;

export const environmentReadInputs = {
  plant_id: "plant_demo",
  samples: [
    { ts: "2026-10-27T08:00:00Z", temperature_c: 21.0, humidity_pct: 45.0, power_quality_index: 0.98 },
    { ts: "2026-10-27T12:00:00Z", temperature_c: 24.0, humidity_pct: 52.0, power_quality_index: 0.95 },
    { ts: "2026-10-28T08:00:00Z", temperature_c: 22.0, humidity_pct: 48.0, power_quality_index: 0.97 },
  ],
  lots: [
    { lot_id: "L1", ts: "2026-10-27T09:00:00Z", units_produced: 100, rejected_units: 2 },
    { lot_id: "L2", ts: "2026-10-27T13:00:00Z", units_produced: 100, rejected_units: 8 },
    { lot_id: "L3", ts: "2026-10-28T09:00:00Z", units_produced: 100, rejected_units: 3 },
  ],
  min_lots: 2,
} as const;

export const changeControlReadInputs = {
  plant_id: "plant_demo",
  changes: [
    {
      change_id: "chg-1",
      kind: "tool",
      changed_at: "2026-10-27T12:00:00Z",
      subject_id: "press-1",
    },
  ],
  lots: [
    { lot_id: "L1", ts: "2026-10-26T10:00:00Z", units_produced: 100, rejected_units: 2 },
    { lot_id: "L2", ts: "2026-10-26T14:00:00Z", units_produced: 100, rejected_units: 3 },
    { lot_id: "L3", ts: "2026-10-28T10:00:00Z", units_produced: 100, rejected_units: 9 },
    { lot_id: "L4", ts: "2026-10-28T14:00:00Z", units_produced: 100, rejected_units: 8 },
  ],
} as const;

export const capaParetoReadInputs = {
  plant_id: "plant_demo",
  tags: [
    { action_id: "capa-1", category: "man" },
    { action_id: "capa-2", category: "machine" },
    { action_id: "capa-3", category: "man" },
    { action_id: "capa-4", category: "method" },
    { action_id: "capa-5", category: "material" },
    { action_id: "capa-6", category: "man" },
  ],
} as const;

export const pokaYokeReadInputs = {
  plant_id: "plant_demo",
  history: [
    { capa_id: "capa-a", root_cause_code: "HE-X", is_human_error: true },
    { capa_id: "capa-b", root_cause_code: "HE-X", is_human_error: true },
    { capa_id: "capa-c", root_cause_code: "HE-X", is_human_error: true },
    { capa_id: "capa-d", root_cause_code: "MAT-1", is_human_error: false },
  ],
  min_occurrences: 2,
  control_catalogue: { "HE-X": ["guide_pin", "poke-yoke fixture"] },
} as const;

