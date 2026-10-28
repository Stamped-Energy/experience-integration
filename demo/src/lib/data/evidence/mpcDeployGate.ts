/**
 * MPC deploy gate (Eng Lead / SWE #242): recommend only as "drift recovery"
 * when fit quality, plant headroom and drift detected all pass (fail closed).
 * UI shows these as gate reasons; never invent plant numbers.
 */

export const DRIFT_RECOVERY_METHOD = "drift recovery";

export type DeployGateReasonId =
  | "fit_quality"
  | "plant_headroom"
  | "drift_detected";

export type DeployGateReason = {
  id: DeployGateReasonId;
  label: string;
  token: string;
};

export const MPC_DEPLOY_GATE_REASONS: DeployGateReason[] = [
  { id: "fit_quality", label: "Fit quality", token: "fit_quality_passed" },
  { id: "plant_headroom", label: "Headroom", token: "plant_headroom_passed" },
  { id: "drift_detected", label: "Drift detected", token: "drift_detected" },
];

export const MPC_DEPLOY_GATE_SUMMARY =
  "MPC may recommend only as drift recovery when fit quality, headroom and drift detected all pass. Fail closed. Shadow may still log. Nothing writes to a plant.";

export const EXAMPLE_OPEN_GATE_CONSTRAINTS = [
  "Fit quality: passed",
  "Plant headroom: passed",
  "Drift detected: yes",
] as const;

export function isDriftRecoveryMethod(method: string | undefined | null): boolean {
  return (method ?? "").toLowerCase() === DRIFT_RECOVERY_METHOD;
}

export function gateReasonStates(
  method: string | undefined | null,
  activeConstraints: string[] | null | undefined,
): { id: DeployGateReasonId; label: string; passed: boolean }[] {
  const drift = isDriftRecoveryMethod(method);
  const bag = (activeConstraints ?? []).join("\n").toLowerCase();
  return MPC_DEPLOY_GATE_REASONS.map((r) => {
    let passed = false;
    if (bag.includes(r.token.toLowerCase()) || bag.includes(r.label.toLowerCase())) {
      passed = !/\b(failed|missing|false|no)\b/.test(
        (activeConstraints ?? [])
          .filter((c) => c.toLowerCase().includes(r.token.toLowerCase()) || c.toLowerCase().includes(r.label.toLowerCase()))
          .join(" ")
          .toLowerCase(),
      );
    } else if (drift) {
      passed = true;
    }
    return { id: r.id, label: r.label, passed };
  });
}
