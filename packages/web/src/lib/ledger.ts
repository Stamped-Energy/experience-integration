import type { LedgerEntry, VerificationStatus } from "@/lib/types";
import { claimBadgeLabel } from "@/lib/format";

/** Buckets plant-heads can act on — bill `verified` is reserved and hidden from Auto ops. */
export const CLAIM_BUCKETS = [
  "pending",
  "modeled",
  "ops_confirmed",
  "disputed",
] as const;

export type ClaimBucket = (typeof CLAIM_BUCKETS)[number];

/**
 * Ops confirmation must never promote to bill-verified.
 * `verified` only when bill_line_refs are present (future L2 bill path).
 */
export function sanitizeClaimStatus(entry: LedgerEntry): VerificationStatus {
  if (entry.verificationStatus === "verified") {
    const hasBill = (entry.billLineRefs?.length ?? 0) > 0;
    return hasBill ? "verified" : "ops_confirmed";
  }
  return entry.verificationStatus;
}

export function isBillVerifiedVisible(entry: LedgerEntry): boolean {
  return (
    sanitizeClaimStatus(entry) === "verified" &&
    (entry.billLineRefs?.length ?? 0) > 0
  );
}

export function claimDisclosure(entry: LedgerEntry): string {
  const status = sanitizeClaimStatus(entry);
  if (status === "ops_confirmed") {
    return "Confirmed from plant data — pending utility bill verification.";
  }
  if (status === "modeled") {
    return entry.modeledReason
      ? `Estimated — ${entry.modeledReason}. Pending bill check.`
      : "Estimated counterfactual — not yet confirmed and pending bill check.";
  }
  if (status === "disputed") {
    return "Disputed — excluded from confirmed totals until resolved.";
  }
  if (status === "verified") {
    return "Verified against utility bill line items.";
  }
  return "Pending verification.";
}

export function emissionFactorLabel(entry: LedgerEntry): string {
  return entry.emissionFactorRef ?? "not_measured_by_stamped";
}

export function filterBucket(
  rows: readonly LedgerEntry[],
  bucket: ClaimBucket | "all",
): LedgerEntry[] {
  if (bucket === "all") return [...rows];
  return rows.filter((r) => sanitizeClaimStatus(r) === bucket);
}

export function sumOpsConfirmedInr(rows: readonly LedgerEntry[]): number {
  return rows
    .filter((r) => sanitizeClaimStatus(r) === "ops_confirmed")
    .reduce((s, r) => s + r.realisedInr, 0);
}

export function sumPotentialInr(rows: readonly LedgerEntry[]): number {
  return rows
    .filter((r) => {
      const s = sanitizeClaimStatus(r);
      return s === "pending" || s === "modeled";
    })
    .reduce((s, r) => s + r.potentialInr, 0);
}

export function displayClaim(entry: LedgerEntry) {
  const status = sanitizeClaimStatus(entry);
  const badge = claimBadgeLabel(status);
  return {
    status,
    badge,
    disclosure: claimDisclosure({ ...entry, verificationStatus: status }),
    emissionFactor: emissionFactorLabel(entry),
    showBillVerified: isBillVerifiedVisible(entry),
  };
}
