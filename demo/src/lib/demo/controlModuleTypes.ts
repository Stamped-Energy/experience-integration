/** Subset of schemas/process/control-module*.json for the demonstration UI. */

export type ControlModule = {
  schema_version: "0.1.0";
  module_id: string;
  module_version: string;
  pack_id: string;
  type: "rule" | "bounded_setting_search" | "mpc" | "rl_policy" | "supervisory";
  mode: "shadow" | "recommend" | "write";
  role?: "primary" | "challenger" | "fallback";
  inputs: string[];
  outputs: string[];
  cadence?: "per_run" | "per_batch" | "periodic" | "on_event";
  rule?: { rules: { rule_id: string; when: string; then: string }[] };
  mpc?: { model_kind: string; offset_free: boolean; tuning?: string };
  rl?: { form: string; training: string[]; shield: string };
  supervisory?: { acts_on: string[]; action: string };
  evidence: { emulator_pass: string | null };
};

export type ControlModuleOutput = {
  schema_version: "0.2.0";
  output_id: string;
  loop_run_id: string;
  module_id: string;
  module_version: string;
  module_type: ControlModule["type"];
  mode: "shadow" | "recommend" | "write";
  result: "proposed" | "abstained" | "selected_other";
  moves?: { setpoint_id: string; current: number; proposed: number; unit: string; step?: number | null }[];
  abstain_reason?: string | null;
  reasoning: {
    method: string;
    rules_fired?: string[];
    active_constraints?: string[];
    objective_terms?: { name: string; value?: number | null }[];
    model_version?: string | null;
    selected_by?: string | null;
    selection_reason?: string | null;
    evidence_ids?: string[];
  };
  no_worse_check_id?: string | null;
  created_at: string;
};
