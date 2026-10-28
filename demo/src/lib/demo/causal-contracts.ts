/** Minimal causal engine shapes for illustrative demo graphs (engine/cause-*.json). */

export type CauseGraph = {
  schema_version: "0.1.0" | "0.2.0";
  plant_id: string;
  graph_version: string;
  template: { template_id: string; template_version: string; line_pack_id?: string };
  overlay_bundle_version?: string | null;
  base_version?: string | null;
  nodes: Array<{ node_id: string; node_type: string; signal_ids?: string[]; fault_library_ref?: string | null }>;
  edge_ids: string[];
  created_at: string;
};

export type CauseEdge = {
  schema_version: "0.1.0";
  edge_id: string;
  plant_id: string;
  graph_version: string;
  from_node: string;
  to_node: string;
  lag_s?: { min: number; max: number } | null;
  sign?: null | "positive" | "negative";
  regime?: string | null;
  status: "proposed" | "declared" | "measured" | "validated" | "proven" | "demoted" | "retired";
  confidence: "none" | "low" | "medium" | "high";
  evidence: Array<{ kind: string; ref: string; window?: string | null; note?: string }>;
  confirmations: number;
  origin?: "template" | "plant_overlay" | "base_prior";
  audit: Array<{ at: string; actor: string; action: string; from_status: string | null; to_status: string; reason: string; bundle_version?: string | null }>;
};

export type CauseCase = {
  schema_version: "0.1.0";
  case_id: string;
  plant_id: string;
  opened_by: { kind: string; ref: string };
  asset_id: string;
  window: { start: string; end: string; regime?: string | null };
  graph_version: string;
  bundle_version?: string | null;
  status: "open" | "diagnosed" | "withheld" | "closed";
  withheld_reason?: string | null;
  ranked_causes: Array<{
    rank: number;
    root_node: string;
    path_edge_ids: string[];
    confidence: "low" | "medium" | "high";
    rests_on_declared_only?: boolean;
    evidence_label?: string;
    confirm_or_rule_out: string;
  }>;
  suggestions: Array<{ ref: string; source: string }>;
  excluded_windows?: Array<{ start: string; end: string }>;
  opened_at: string;
  closed_at: string | null;
};
