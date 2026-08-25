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
import { EmptyUpstreamState } from "@/components/ui/SourceIndicator";
import "@/components/reports/reports.css";

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

  if (!rows.length) {
    return (
      <EmptyUpstreamState
        title="No ledger rows"
        detail="Prescriptions with savings summaries are required to populate the ledger."
      />
    );
  }

  return (
    <div className="reports-stack" data-ledger>
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
              <div className="reports-ledger-row">
                <div className="reports-ledger-row__main">
                  <h3 style={{ margin: 0, fontFamily: "var(--forge-font-display)", fontSize: 17 }}>
                    <Link href={`/prescriptions/${entry.prescriptionId}`}>{entry.title}</Link>
                  </h3>
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
                    {entry.entryType.replaceAll("_", " ")} · {entry.mvMethod} · baseline{" "}
                    {formatBaselineLabel(entry.baselineId)}
                  </p>
                </div>
                <div className="reports-ledger-row__side">
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
              {claim.disclosure ? (
                <p style={{ margin: "12px 0 0", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
                  {claim.disclosure}
                </p>
              ) : null}
              <div className="reports-ledger-row__footer">
                {(() => {
                  const factor = formatEmissionFactorRef(claim.emissionFactor);
                  return factor ? (
                    <p style={{ margin: 0, fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
                      Emission factor: {factor}
                    </p>
                  ) : (
                    <span />
                  );
                })()}
                <Link
                  href={`/prescriptions/${entry.prescriptionId}`}
                  className="reports-ledger-evidence"
                >
                  Open Rx
                </Link>
              </div>
            </Panel>
          );
        })
      )}
    </div>
  );
}
