/**
 * Example control modules and outputs (illustrative). No module claims an emulator pass.
 */
import type { ControlModule, ControlModuleOutput } from "@/lib/demo/controlModuleTypes";
import { DRIFT_RECOVERY_METHOD, EXAMPLE_OPEN_GATE_CONSTRAINTS } from "@/lib/data/evidence/mpcDeployGate";
import { proposals } from "./data";
import type { Proposal } from "./types";

const M = (m: Omit<ControlModule, "schema_version" | "evidence">): ControlModule => ({ schema_version: "0.1.0", evidence: { emulator_pass: null }, ...m });

export const controlModules: ControlModule[] = [
  M({ module_id: "mix-rules", module_version: "1.2.0", pack_id: "pack-batch-mixer", type: "rule", mode: "recommend", role: "fallback", inputs: ["torque", "viscosity"], outputs: ["agitator", "hold-time"], cadence: "per_batch",
    rule: { rules: [{ rule_id: "R-TORQUE-HIGH", when: "End-of-hold torque above the grade's best batches", then: "Raise agitator one step inside the narrowed band" }] } }),
  M({ module_id: "mix-search", module_version: "2.4.1", pack_id: "pack-batch-mixer", type: "bounded_setting_search", mode: "recommend", role: "primary", inputs: ["torque", "viscosity", "charge-mass"], outputs: ["hold-temp", "hold-time", "agitator"], cadence: "per_batch" }),
  M({ module_id: "mould-mpc", module_version: "0.3.0", pack_id: "pack-moulding", type: "mpc", mode: "shadow", role: "challenger", inputs: ["cavity-pressure", "part-weight", "tool-temp"], outputs: ["melt-temp", "hold-pressure", "cycle-time"], cadence: "per_run",
    mpc: { model_kind: "hybrid_twin", offset_free: true, tuning: "supervisory_tuned" } }),
  M({ module_id: "mould-search", module_version: "2.4.1", pack_id: "pack-moulding", type: "bounded_setting_search", mode: "recommend", role: "fallback", inputs: ["part-weight", "tool-temp"], outputs: ["melt-temp", "hold-pressure", "cycle-time"], cadence: "per_run" }),
  M({ module_id: "mould-rl", module_version: "0.1.0", pack_id: "pack-moulding", type: "rl_policy", mode: "shadow", role: "challenger", inputs: ["cavity-pressure", "part-weight"], outputs: ["hold-pressure"], cadence: "per_run",
    rl: { form: "residual_on_incumbent", training: ["offline_historian", "plant_emulator"], shield: "safety_filter_and_mpc_envelope" } }),
  M({ module_id: "mould-supervisor", module_version: "0.1.0", pack_id: "pack-moulding", type: "supervisory", mode: "recommend", inputs: ["cavity-pressure", "part-weight"], outputs: [], cadence: "per_run",
    supervisory: { acts_on: ["mould-mpc", "mould-search", "mould-rl"], action: "select_module" } }),
];

export const MODULE_TYPE_LABEL: Record<ControlModule["type"], string> = {
  rule: "Rule-based", bounded_setting_search: "Bounded setting search", mpc: "Model predictive control", rl_policy: "Reinforcement learning policy", supervisory: "Supervisor",
};

export const moduleOf = (id: string) => controlModules.find((m) => m.module_id === id);
const unitOf: Record<string, string> = { "hold-pressure": "bar", "melt-temp": "°C", "cycle-time": "s", agitator: "rpm", "hold-temp": "°C", "hold-time": "min" };
export const loopRunOf = (p: Pick<Proposal, "id">) => `loop-${p.id}`;

type Out = ControlModuleOutput;
const base = (p: Proposal, module: string, extra: Partial<Out>): Out => {
  const m = moduleOf(module)!;
  return {
    schema_version: "0.2.0", output_id: `${p.id}-${module}`, module_type: m.type, loop_run_id: loopRunOf(p), module_id: m.module_id, module_version: m.module_version,
    mode: m.mode, result: "proposed", reasoning: { method: MODULE_TYPE_LABEL[m.type] }, no_worse_check_id: null, created_at: p.createdAt, ...extra,
  };
};
const move = (setpoint_id: string, current: number, proposed: number) => ({ setpoint_id, current, proposed, unit: unitOf[setpoint_id] ?? "", step: null });

function outputsFor(p: Proposal): Out[] {
  const mainMove = move(p.param, p.current, p.proposed);
  const withheld = p.state === "Withheld";
  const primary = p.lineId === "line-a" ? "mix-search" : "mould-search";
  const sel: Partial<Out> = withheld
    ? { result: "abstained", abstain_reason: "No setting in the signed band passed the model fit check", reasoning: { method: "Bounded setting search", evidence_ids: p.evidenceIds } }
    : { moves: [mainMove], reasoning: { method: "Bounded setting search", active_constraints: p.safetyFilter.rules, evidence_ids: p.evidenceIds, model_version: p.optimiserVersion } };
  if (p.id === "prop-101") {
    return [
      base(p, "mould-search", {
        moves: [mainMove, move("cycle-time", 33.2, 33.6)],
        reasoning: {
          method: "Bounded setting search",
          active_constraints: p.safetyFilter.rules,
          evidence_ids: p.evidenceIds,
          model_version: p.optimiserVersion,
          selected_by: "mould-supervisor",
          selection_reason: "Primary recommend module for this pack; MPC and reinforcement learning stay in shadow until a person promotes them",
        },
      }),
      base(p, "mould-mpc", {
        mode: "shadow",
        moves: [mainMove, move("cycle-time", 33.2, 33.6)],
        reasoning: {
          method: "Offset-free model predictive control, shadow only",
          active_constraints: p.safetyFilter.rules,
          objective_terms: [{ name: "Scrap rate", value: null }, { name: "Cycle time", value: null }],
          model_version: "model-b 3.1",
          evidence_ids: p.evidenceIds,
        },
      }),
      base(p, "mould-mpc", {
        output_id: `${p.id}-mould-mpc-drift-recovery`,
        mode: "recommend",
        moves: [mainMove, move("cycle-time", 33.2, 33.4)],
        reasoning: {
          method: DRIFT_RECOVERY_METHOD,
          active_constraints: [...EXAMPLE_OPEN_GATE_CONSTRAINTS],
          objective_terms: [{ name: "Scrap rate", value: null }, { name: "Cycle time", value: null }],
          model_version: "model-b 3.1",
          evidence_ids: p.evidenceIds,
          selection_reason: "EXAMPLE DATA: deploy gate open (fit quality, headroom, drift detected). Recommend only; nothing writes to a plant.",
        },
      }),
      base(p, "mould-rl", {
        mode: "shadow",
        moves: [move("hold-pressure", 720, 770)],
        reasoning: { method: "Reinforcement learning policy, shadow only", model_version: "policy 0.1.0" },
      }),
    ];
  }
  if (p.id === "prop-102") {
    return [
      base(p, "mix-rules", { moves: [mainMove], reasoning: { method: "Rule-based", rules_fired: ["R-TORQUE-HIGH: end-of-hold torque above the grade's best batches, raise agitator one step"], active_constraints: p.safetyFilter.rules, evidence_ids: p.evidenceIds } }),
      base(p, "mix-search", { result: "abstained", abstain_reason: "Model of the mixer not yet accepted for this grade" }),
    ];
  }
  return [base(p, primary, sel)];
}

export const moduleOutputs: Out[] = proposals.flatMap(outputsFor);
export const outputsForLoopRun = (loopRunId: string) => moduleOutputs.filter((o) => o.loop_run_id === loopRunId);

export function selectedOutput(outs: Out[]): Out | undefined {
  return outs.find((o) => o.result === "proposed" && o.mode !== "shadow") ?? outs.find((o) => o.result === "abstained");
}
