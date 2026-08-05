import type { PrescriptionLane, VerificationStatus, WorkflowStatus } from "./enums.js";

/**
 * Map L5 workflow status → UI triage lane.
 * Runtime truth stays on L5; this is display projection only.
 */
export function workflowStatusToLane(status: WorkflowStatus): PrescriptionLane {
  switch (status) {
    case "pending_stamped_review":
    case "withheld":
      throw new Error(`internal workflow status ${status} must not reach customer mapping`);
    case "open":
    case "blocked":
      return "needs_review";
    case "in_progress":
    case "deferred":
      return "active";
    case "done":
      return "verifying";
    case "verified":
    case "rejected":
    case "disputed":
      return "closed";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export type ClaimBadge = {
  label: string;
  tone: "good" | "warning" | "neutral" | "critical";
};

/**
 * Dual claim labels — never present ops clearance as bill verification.
 */
export function claimBadgeLabel(
  status: VerificationStatus | string | undefined,
): ClaimBadge {
  switch (status) {
    case "ops_confirmed":
      return { label: "Ops-confirmed", tone: "good" };
    case "modeled":
      return { label: "Modeled — not bill-verified", tone: "warning" };
    case "pending":
      return { label: "Pending", tone: "neutral" };
    case "disputed":
      return { label: "Disputed", tone: "critical" };
    case "verified":
      // Reserved for future bill path — never invent from ops alone.
      return { label: "Bill-verified", tone: "good" };
    default:
      return { label: "Unknown", tone: "neutral" };
  }
}

/** Missing upstream fields must render as explicit absence, not invented values. */
export function missingDataLabel(field: string): string {
  return `${field}: not_measured_by_stamped`;
}
