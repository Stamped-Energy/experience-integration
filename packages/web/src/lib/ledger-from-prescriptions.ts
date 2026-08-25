import type { LedgerEntry, Prescription } from "@/lib/types";

function monthBoundsIso(now = new Date()): { start: string; end: string } {
  const y = now.getFullYear();
  const m = now.getMonth();
  const start = new Date(y, m, 1, 0, 0, 0);
  const end = new Date(y, m + 1, 0, 23, 59, 59);
  return { start: start.toISOString(), end: end.toISOString() };
}

/** Derive claim-safe ledger rows from L5 prescriptions (ledger_summary fields). */
export function ledgerEntriesFromPrescriptions(
  prescriptions: Prescription[],
  now = new Date(),
): LedgerEntry[] {
  const { start, end } = monthBoundsIso(now);
  return prescriptions.map((rx) => {
    const realised = rx.realisedInr ?? 0;
    const potential = rx.potentialInr ?? rx.impactInrPerMonth ?? 0;
    const status = rx.verificationStatus ?? (realised > 0 ? "ops_confirmed" : "pending");
    return {
      entryId: `led_${rx.id}`,
      plantId: rx.plantId,
      prescriptionId: rx.id,
      title: rx.title,
      entryType:
        realised > 0 ? ("realised_savings" as const) : ("potential_savings" as const),
      periodStart: start,
      periodEnd: end,
      potentialInr: potential,
      realisedInr: realised,
      verificationStatus: status,
      mvMethod: "ledger_summary",
      baselineId: "not_measured_by_stamped",
      emissionFactorRef: null,
    };
  });
}

export function periodLabelForNow(now = new Date()): string {
  return now.toLocaleString("en-IN", { month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}
