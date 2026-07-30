/**
 * Canonical L6 display projections — runtime truth stays on L5/L2.
 * Reuses @stamped/l6-contracts for workflow lanes and claim badges.
 */
import {
  claimBadgeLabel,
  missingDataLabel,
  workflowStatusToLane,
  type AlarmState,
  type ClaimBadge,
  type PrescriptionLane,
  type VerificationStatus,
  type WorkflowStatus,
} from "@stamped/l6-contracts";

export {
  claimBadgeLabel,
  missingDataLabel,
  workflowStatusToLane,
};

export type DualClaimLabels = {
  /** Short chip for tables */
  short: ClaimBadge;
  /** Explicit sentence — never equates ops clearance with bill verification */
  long: string;
};

export function dualClaimLabels(
  status: VerificationStatus | string | undefined,
): DualClaimLabels {
  const short = claimBadgeLabel(status);
  if (status === "ops_confirmed") {
    return {
      short,
      long: "Ops-confirmed from telemetry clearance — not bill-verified.",
    };
  }
  if (status === "modeled") {
    return {
      short,
      long: "Modeled counterfactual — not ops-confirmed and not bill-verified.",
    };
  }
  if (status === "verified") {
    return {
      short,
      long: "Bill-verified (reserved path) — distinct from ops-confirmed.",
    };
  }
  return { short, long: short.label };
}

export type AlarmUiState = {
  state: AlarmState;
  label: string;
  tone: "critical" | "warning" | "good" | "neutral" | "info";
  /** Actions the UI may offer; upstream gaps still feature-gated at the client. */
  allowedActions: Array<"ack" | "escalate" | "silence" | "unsilence" | "evidence">;
};

export function alarmStateToUi(state: AlarmState): AlarmUiState {
  switch (state) {
    case "raised":
      return {
        state,
        label: "Raised",
        tone: "critical",
        allowedActions: ["ack", "escalate", "silence", "evidence"],
      };
    case "acked":
      return {
        state,
        label: "Acknowledged",
        tone: "warning",
        allowedActions: ["escalate", "silence", "evidence"],
      };
    case "escalated":
      return {
        state,
        label: "Escalated",
        tone: "critical",
        allowedActions: ["silence", "evidence"],
      };
    case "silenced":
      return {
        state,
        label: "Silenced",
        tone: "neutral",
        allowedActions: ["unsilence", "evidence"],
      };
    case "cleared":
      return {
        state,
        label: "Cleared",
        tone: "good",
        allowedActions: ["evidence"],
      };
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

export type MissingDataPolicy = {
  field: string;
  display: string;
  inventValue: false;
};

/** Missing upstream fields render as explicit absence — never invented numbers. */
export function missingDataPolicy(fields: readonly string[]): MissingDataPolicy[] {
  return fields.map((field) => ({
    field,
    display: missingDataLabel(field),
    inventValue: false as const,
  }));
}

export function projectPrescriptionLane(status: WorkflowStatus): PrescriptionLane {
  return workflowStatusToLane(status);
}

/**
 * L5 external org id for a given external plant id. Vinayak Plant (C-L6a
 * live path) is scoped to org_acme; Jaipur (offline fixture baseline)
 * stays on org_demo. Unknown plants default to org_acme (the live org).
 */
export function orgIdForExternalPlantId(externalPlantId: string): string {
  if (externalPlantId === "plant_vinayak_1") return "org_acme";
  if (externalPlantId === "plant_jaipur_01") return "org_demo";
  return "org_acme";
}
