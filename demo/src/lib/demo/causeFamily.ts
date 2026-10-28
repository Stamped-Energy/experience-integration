/**
 * Cause-family taxonomy for root-cause badges (design included).
 * Mirrors plugins/causal cause_family.py (#126). Families label cards; they do
 * not change ranking math. Unlisted node types fall back to unknown.
 */

export type CauseFamily =
  | "design"
  | "material"
  | "process_setting"
  | "tooling"
  | "machine"
  | "measurement"
  | "method_operator"
  | "environment"
  | "scheduling"
  | "unknown";

export const CAUSE_FAMILY_LABEL: Record<CauseFamily, string> = {
  design: "Design",
  material: "Material",
  process_setting: "Process setting",
  tooling: "Tooling",
  machine: "Machine",
  measurement: "Measurement",
  method_operator: "Method / operator",
  environment: "Environment",
  scheduling: "Scheduling",
  unknown: "Unknown",
};

/** Node-type id -> family. Keep in sync with stamped_causal.cause_family.NODE_FAMILY. */
export const NODE_FAMILY: Record<string, CauseFamily> = {
  part_geometry: "design",
  fillet_radius: "design",
  draft_angle: "design",
  machining_allowance: "design",
  preform_volume: "design",
  design_tolerance: "design",
  feature_accessibility: "design",
  steel_heat_chemistry: "material",
  steel_hydrogen: "material",
  billet_weight: "material",
  alloy_content: "material",
  incoming_residual_stress: "material",
  workpiece_hardness: "material",
  heater_power: "process_setting",
  heater_speed: "process_setting",
  time_at_temperature: "process_setting",
  billet_temp_at_press: "process_setting",
  transfer_time: "process_setting",
  blow_energy_or_tonnage: "process_setting",
  cooling_rate: "process_setting",
  spray_volume: "process_setting",
  zone_temperature: "process_setting",
  carbon_potential: "process_setting",
  oxygen_potential: "process_setting",
  quench_oil_temperature: "process_setting",
  quench_agitation: "process_setting",
  tempering_temperature: "process_setting",
  tempering_time: "process_setting",
  induction_energy_per_part: "process_setting",
  induction_frequency: "process_setting",
  induction_scan_speed: "process_setting",
  induction_quench_flow: "process_setting",
  cutting_speed: "process_setting",
  feed_rate: "process_setting",
  depth_of_cut: "process_setting",
  coolant_flow: "process_setting",
  die_temperature: "tooling",
  die_stroke_count: "tooling",
  die_wear: "tooling",
  tool_wear: "tooling",
  tool_geometry: "tooling",
  fixture_clamp: "tooling",
  spindle_load: "machine",
  machine_thermal_drift: "machine",
  oil_condition: "machine",
  gauge_bias: "measurement",
  msa_status: "measurement",
  load_arrangement: "method_operator",
  delay_to_temper: "method_operator",
  load_weight: "method_operator",
  operator_setup: "method_operator",
  ambient_humidity: "environment",
  ambient_temperature: "environment",
};

export function familyFor(nodeTypeOrId: string): CauseFamily {
  return NODE_FAMILY[nodeTypeOrId] ?? "unknown";
}

/** Extra display labels for design / machining nodes not yet in NODE_LABEL. */
export const EXTRA_NODE_LABEL: Record<string, string> = {
  part_geometry: "Part geometry",
  fillet_radius: "Fillet radius",
  draft_angle: "Draft angle",
  machining_allowance: "Machining allowance",
  design_tolerance: "Design tolerance",
  feature_accessibility: "Feature accessibility",
  tool_wear: "Tool wear",
  tool_geometry: "Tool geometry",
  fixture_clamp: "Fixture clamp",
  cutting_speed: "Cutting speed",
  feed_rate: "Feed rate",
  depth_of_cut: "Depth of cut",
  coolant_flow: "Coolant flow",
  spindle_load: "Spindle load",
  machine_thermal_drift: "Machine thermal drift",
  gauge_bias: "Gauge bias",
  workpiece_hardness: "Workpiece hardness",
  operator_setup: "Operator setup",
};

export const DESIGN_CAUSE_META =
  "Design is a first-class cause family (not only process setpoints). Badge labels come from the cause_family taxonomy; ranking math is unchanged. Live family tags depend on causal #126.";
