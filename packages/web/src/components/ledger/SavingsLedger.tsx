"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { LedgerEntry } from "@/lib/types";
import { formatBaselineLabel, formatEmissionFactorRef, formatInr } from "@/lib/format";
import {
  CLAIM_BUCKETS,
  displayClaim,
  filterBucket,
  sumOpsConfirmedInr,
  sumPotentialInr,
  type ClaimBucket,
} from "@/lib/ledger";
import { Panel, StatusChip } from "@/components/ui/primitives";
import { resolveEvidenceIdForRx } from "@/fixtures/evidence-samples";

const bucketLabel: Record<ClaimBucket | "all", string> = {
  all: "All",
  pending: "Potential",
  modeled: "Modeled",
  ops_confirmed: "Confirmed",
  disputed: "Disputed",
};

export function SavingsLedger({ rows }: { rows: LedgerEntry[] }) {
  const [bucket, setBucket] = useState<ClaimBucket | "all">("all");
  const visible = useMemo(() => filterBucket(rows, bucket), [rows, bucket]);
  const opsTotal = sumOpsConfirmedInr(rows);
  const potentialTotal = sumPotentialInr(rows);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }} data-ledger>
      <Panel style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
            Confirmed savings (MTD)
          </p>
          <p
            className="tabular"
            style={{
              margin: "4px 0 0",
              fontFamily: "var(--forge-font-display)",
              fontWeight: 800,
              fontSize: 28,
            }}
          >
            {formatInr(opsTotal)}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--forge-warning)" }}>
            Pending utility bill verification
          </p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
            Addressable potential
          </p>
          <p
            className="tabular"
            style={{
              margin: "4px 0 0",
              fontFamily: "var(--forge-font-display)",
              fontWeight: 800,
              fontSize: 28,
            }}
          >
            {formatInr(potentialTotal)}
          </p>
        </div>
      </Panel>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }} role="tablist" aria-label="Claim buckets">
        {(["all", ...CLAIM_BUCKETS] as const).map((b) => (
          <button
            key={b}
            type="button"
            role="tab"
            aria-selected={bucket === b}
            onClick={() => setBucket(b)}
            style={{
              minHeight: 40,
              padding: "0 12px",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 13,
              background: bucket === b ? "var(--forge-secondary)" : "var(--forge-surface-container)",
              color: bucket === b ? "#fff" : "var(--forge-on-surface)",
            }}
          >
            {bucketLabel[b]}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Panel>
          <p style={{ margin: 0 }}>No ledger rows in this bucket.</p>
        </Panel>
      ) : (
        visible.map((entry) => {
          const claim = displayClaim(entry);
          return (
            <Panel key={entry.entryId} as="article" data-ledger-id={entry.entryId}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <h3 style={{ margin: 0, fontFamily: "var(--forge-font-display)", fontSize: 17 }}>
                    <Link href={`/prescriptions/${entry.prescriptionId}`}>{entry.title}</Link>
                  </h3>
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
                    {entry.entryType.replaceAll("_", " ")} · {entry.mvMethod} · baseline{" "}
                    {formatBaselineLabel(entry.baselineId)}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p
                    className="tabular"
                    style={{
                      margin: 0,
                      fontFamily: "var(--forge-font-display)",
                      fontWeight: 800,
                      fontSize: 20,
                    }}
                  >
                    {formatInr(
                      claim.status === "ops_confirmed" || claim.status === "disputed"
                        ? entry.realisedInr
                        : entry.potentialInr,
                    )}
                  </p>
                  <StatusChip tone={claim.badge.tone}>{claim.badge.label}</StatusChip>
                </div>
              </div>
              <p style={{ margin: "12px 0 0", fontSize: 13 }}>{claim.disclosure}</p>
              <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
                Emission factor: {formatEmissionFactorRef(claim.emissionFactor)}
                {claim.showBillVerified ? " · Matched to bill line items" : ""}
              </p>
              <div style={{ marginTop: 12 }}>
                {(() => {
                  const evidenceId = resolveEvidenceIdForRx(entry.prescriptionId);
                  if (!evidenceId) return null;
                  return (
                    <Link
                      href={`/evidence/${evidenceId}`}
                      style={{ fontWeight: 700, fontSize: 13 }}
                    >
                      Evidence
                    </Link>
                  );
                })()}
              </div>
            </Panel>
          );
        })
      )}
    </div>
  );
}
