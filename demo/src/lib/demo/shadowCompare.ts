/**
 * Shadow MPC / reinforcement learning compare status (illustrative fallback lanes).
 */

export type ShadowBackendState =
  | "example_shadow"
  | "live_shadow"
  | "abstain_not_fitted"
  | "abstain_not_built"
  | "empty";

export interface ShadowLane {
  module_id: string;
  module_type: "mpc" | "rl_policy";
  label: string;
  backend: ShadowBackendState;
  reason: string;
  depends_on: string;
}

export const SHADOW_PAGE_META =
  "Shadow modules compute alongside the line and write nothing. Model predictive control needs an identified plant model (C27). Reinforcement learning needs a trained, shielded policy. Neither is promoted without a person.";

export const shadowLanes: ShadowLane[] = [
  {
    module_id: "mould-mpc",
    module_type: "mpc",
    label: "Offset-free model predictive control",
    backend: "example_shadow",
    reason: "Runner on main (#108). Example shadow output is shown when live compare has no store rows yet.",
    depends_on: "process.shadow_module_output · model_fit_ref from #108",
  },
  {
    module_id: "mould-rl",
    module_type: "rl_policy",
    label: "Shielded residual reinforcement learning",
    backend: "abstain_not_built",
    reason: "Gymnasium env (#115) and shielded residual RL (#117) are on main. Live compare abstains until a trained policy and shield emit a shadow output.",
    depends_on: "Trained policy + shield attach · #115/#117",
  },
];

export const MODULES_PAGE_META =
  "Control modules the agent combines per plant (D151). Bounded search and rules recommend; model predictive control and reinforcement learning stay in shadow until promoted. The supervisor selects and explains; it never sets a number.";

export const SHADOW_TYPE_LABEL: Record<string, string> = {
  mpc: "Offset-free model predictive control",
  rl_policy: "Shielded residual reinforcement learning",
};
