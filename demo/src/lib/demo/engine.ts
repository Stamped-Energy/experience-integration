/**
 * Example causal-engine data. Built only from the forging and heat-treatment node templates (D130) in
 * stamped-external: technical/design/industry/forging.md section 13 and heat-treatment.md section 12.
 * Every link is a declared template link with no plant evidence: confidence "none", no lag, no sign,
 * no confirmations. Nothing here is a measured result, and these example plants are not the
 * demonstration plant's lines.
 */
import type { CauseCase, CauseEdge, CauseGraph } from "@/lib/demo/causal-contracts";

const CREATED = "2026-10-01T00:00:00Z";
const SRC = {
  forging: "stamped-external technical/design/industry/forging.md#13",
  heat: "stamped-external technical/design/industry/heat-treatment.md#12",
} as const;

type NodeDef = [id: string, type: "input" | "latent" | "outcome", label: string];

const forgingNodes: NodeDef[] = [
  ["steel_heat_chemistry", "input", "Steel heat chemistry"],
  ["steel_hydrogen", "input", "Steel hydrogen"],
  ["billet_weight", "input", "Billet weight"],
  ["billet_temperature_at_press", "input", "Billet temperature at press"],
  ["transfer_time", "input", "Transfer time"],
  ["heater_power_and_speed", "input", "Heater power and speed"],
  ["time_at_temperature", "input", "Time at temperature"],
  ["die_temperature", "latent", "Die temperature (latent unless sensed)"],
  ["spray_volume", "input", "Spray volume"],
  ["die_stroke_count", "input", "Die stroke count"],
  ["blow_energy_or_tonnage", "input", "Blow energy or tonnage"],
  ["preform_volume", "input", "Preform volume"],
  ["cooling_rate", "input", "Cooling rate"],
  ["underfill", "outcome", "Underfill"],
  ["lap", "outcome", "Lap"],
  ["scale_pit", "outcome", "Scale pit"],
  ["mismatch", "outcome", "Mismatch"],
  ["crack", "outcome", "Crack"],
  ["die_wear", "outcome", "Die wear"],
  ["flow_through", "outcome", "Flow-through"],
  ["flakes", "outcome", "Flakes"],
];

const heatNodes: NodeDef[] = [
  ["steel_heat_chemistry", "input", "Steel heat chemistry (Si, Mn, Cr, hardenability)"],
  ["load_weight_and_arrangement", "input", "Load weight and arrangement"],
  ["zone_temperatures", "input", "Zone temperatures"],
  ["carbon_potential", "input", "Carbon potential (probe mV, CO, dew point)"],
  ["oxygen_potential", "input", "Oxygen potential"],
  ["time_at_temperature", "input", "Time at temperature"],
  ["quench_oil_temperature", "input", "Quench oil temperature"],
  ["agitation", "input", "Agitation"],
  ["oil_condition", "input", "Oil condition (lab)"],
  ["delay_to_temper", "input", "Delay to temper"],
  ["tempering_temperature_and_time", "input", "Tempering temperature and time"],
  ["induction_energy_per_part", "input", "Induction energy per part"],
  ["induction_frequency", "input", "Induction frequency"],
  ["scan_speed", "input", "Scan speed"],
  ["quench_flow", "input", "Quench flow"],
  ["surface_hardness", "outcome", "Surface hardness"],
  ["case_depth", "outcome", "Case depth"],
  ["core_hardness", "outcome", "Core hardness"],
  ["distortion", "outcome", "Distortion"],
  ["igo_depth", "outcome", "IGO depth"],
  ["retained_austenite", "outcome", "Retained austenite"],
];

/** Display names for every node id, for the UI. */
export const NODE_LABEL: Record<string, string> = Object.fromEntries([...forgingNodes, ...heatNodes].map(([id, , label]) => [id, label]));
export const NODE_KIND: Record<string, NodeDef[1]> = Object.fromEntries([...forgingNodes, ...heatNodes].map(([id, kind]) => [id, kind]));

const graph = (plant_id: string, template_id: string, nodes: NodeDef[], edges: CauseEdge[]): CauseGraph => ({
  schema_version: "0.1.0",
  plant_id,
  graph_version: "0.1.0",
  template: { template_id, template_version: "0.1.0" },
  overlay_bundle_version: null,
  base_version: null,
  nodes: nodes.map(([node_id, node_type]) => ({ node_id, node_type, signal_ids: [], fault_library_ref: null })),
  edge_ids: edges.map((e) => e.edge_id),
  created_at: CREATED,
});

const edge = (plant_id: string, src: string, from_node: string, to_node: string, cite: string): CauseEdge => ({
  schema_version: "0.1.0",
  edge_id: `${plant_id}:${from_node}->${to_node}`,
  plant_id,
  graph_version: "0.1.0",
  from_node,
  to_node,
  lag_s: null,
  sign: null,
  regime: null,
  status: "declared",
  confidence: "none",
  evidence: [{ kind: "template", ref: `${src} ${cite}`, window: null, note: "Template link with a literature source; no plant evidence yet" }],
  confirmations: 0,
  origin: "template",
  audit: [{ at: CREATED, actor: "template", action: "created", from_status: null, to_status: "declared", reason: `Declared by the node template (${cite})`, bundle_version: null }],
});

const FORGE = "example-forge-plant";
const HEAT = "example-heat-treat-plant";

export const exampleEdges: CauseEdge[] = [
  edge(FORGE, SRC.forging, "billet_temperature_at_press", "underfill", "[Part 1 source 1]"),
  edge(FORGE, SRC.forging, "die_temperature", "underfill", "[D10]"),
  edge(FORGE, SRC.forging, "die_temperature", "die_wear", "[D10]"),
  edge(FORGE, SRC.forging, "time_at_temperature", "scale_pit", "[D6]"),
  edge(FORGE, SRC.forging, "preform_volume", "flow_through", "[D5]"),
  edge(FORGE, SRC.forging, "steel_hydrogen", "flakes", "[D8]"),
  edge(FORGE, SRC.forging, "cooling_rate", "flakes", "[D8]"),
  edge(HEAT, SRC.heat, "oxygen_potential", "igo_depth", "[D4]"),
  edge(HEAT, SRC.heat, "steel_heat_chemistry", "igo_depth", "[D4] (alloy content)"),
  edge(HEAT, SRC.heat, "carbon_potential", "retained_austenite", "[D7]"),
  edge(HEAT, SRC.heat, "oil_condition", "surface_hardness", "[D9]"),
  edge(HEAT, SRC.heat, "induction_energy_per_part", "case_depth", "[D15]"),
];

export const exampleGraphs: CauseGraph[] = [
  graph(FORGE, "forging", forgingNodes, exampleEdges.filter((e) => e.plant_id === FORGE)),
  graph(HEAT, "heat-treatment", heatNodes, exampleEdges.filter((e) => e.plant_id === HEAT)),
];

const byEdge = (id: string) => exampleEdges.find((e) => e.edge_id === id)!.edge_id;

/** One example case: underfill on an example forge press. Ranked on declared template links only. */
export const exampleCases: CauseCase[] = [
  {
    schema_version: "0.1.0",
    case_id: "case-example-underfill",
    plant_id: FORGE,
    opened_by: { kind: "engineer", ref: "example" },
    asset_id: "example-forge-press",
    window: { start: "2026-10-01T06:00:00Z", end: "2026-10-01T14:00:00Z", regime: null },
    graph_version: "0.1.0",
    bundle_version: null,
    status: "diagnosed",
    withheld_reason: null,
    ranked_causes: [
      { rank: 1, root_node: "billet_temperature_at_press", path_edge_ids: [byEdge(`${FORGE}:billet_temperature_at_press->underfill`)], confidence: "low", rests_on_declared_only: true, evidence_label: "assumed", confirm_or_rule_out: "Compare per-billet temperature at the press for underfilled and good parts in the window" },
      { rank: 2, root_node: "die_temperature", path_edge_ids: [byEdge(`${FORGE}:die_temperature->underfill`)], confidence: "low", rests_on_declared_only: true, evidence_label: "assumed", confirm_or_rule_out: "Die temperature is latent here: fit a die thermocouple or check die id and stroke count against underfill" },
    ],
    suggestions: [],
    excluded_windows: [],
    opened_at: "2026-10-01T14:05:00Z",
    closed_at: null,
  },
];

export function queryGraph(q: { node_id?: string; edge_id?: string; status?: string; graph_version?: string }) {
  const edges = exampleEdges.filter((e) =>
    (!q.edge_id || e.edge_id === q.edge_id) && (!q.node_id || e.from_node === q.node_id || e.to_node === q.node_id) &&
    (!q.status || e.status === q.status) && (!q.graph_version || e.graph_version === q.graph_version));
  const plants = new Set(edges.map((e) => e.plant_id));
  const graphs = exampleGraphs.filter((g) => (!q.graph_version || g.graph_version === q.graph_version) && (q.node_id || q.edge_id || q.status ? plants.has(g.plant_id) : true));
  return { graphs, edges };
}

export function diagnoseCase(assetId: string): { ok: true; data: CauseCase } | { ok: false; abstainReason: string } {
  const data = exampleCases.find((c) => c.asset_id === assetId);
  if (!data) {
    return { ok: false, abstainReason: `No grounded diagnosis for ${assetId}. The tool abstains rather than inventing findings.` };
  }
  return { ok: true, data };
}
