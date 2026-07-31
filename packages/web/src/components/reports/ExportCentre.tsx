"use client";

import { useMemo, useState } from "react";
import type { LedgerEntry, Prescription } from "@/lib/types";
import { downloadTextFile, toCsv } from "@/lib/csv-download";
import { downloadDocx } from "@/lib/docx-download";
import { sanitizeClaimStatus } from "@/lib/ledger";
import {
  GhostButton,
  Panel,
  PrimaryButton,
  SecondaryButton,
  StatusChip,
} from "@/components/ui/primitives";

import "./reports.css";

type LocalReport = {
  id: string;
  kind: string;
  state: "pending_approval" | "approved" | "failed" | "running";
  periodLabel: string;
};

function ledgerCsv(rows: readonly LedgerEntry[]): string {
  return toCsv(
    [
      "entry_id",
      "plant_id",
      "prescription_id",
      "entry_type",
      "period_start_ist",
      "period_end_ist",
      "potential_inr",
      "realised_inr",
      "verification_status",
      "mv_method",
      "baseline_id",
      "emission_factor_ref",
      "timezone",
    ],
    rows.map((r) => [
      r.entryId,
      r.plantId,
      r.prescriptionId,
      r.entryType,
      r.periodStart,
      r.periodEnd,
      r.potentialInr,
      r.realisedInr,
      sanitizeClaimStatus(r),
      r.mvMethod,
      r.baselineId,
      r.emissionFactorRef ?? "not_measured_by_stamped",
      "Asia/Kolkata",
    ]),
  );
}

function prescriptionAuditCsv(rows: readonly Prescription[]): string {
  return toCsv(
    [
      "prescription_id",
      "plant_id",
      "title",
      "lane",
      "impact_inr_per_month",
      "confidence",
      "owner_role",
      "due_at_ist",
      "verification_status",
      "realised_inr",
      "timezone",
    ],
    rows.map((r) => [
      r.id,
      r.plantId,
      r.title,
      r.lane,
      r.impactInrPerMonth,
      r.confidence,
      r.ownerRole,
      r.dueAt,
      r.verificationStatus ?? "",
      r.realisedInr ?? "",
      "Asia/Kolkata",
    ]),
  );
}

function sustainabilityLines(periodLabel: string, id: string): string[] {
  return [
    "Stamped Energy - Sustainability pack",
    `Period: ${periodLabel}`,
    `Report id: ${id}`,
    "Status: approved",
  ];
}

function sustainabilityCsv(periodLabel: string, id: string): string {
  return toCsv(
    ["field", "value"],
    [
      ["period", periodLabel],
      ["report_id", id],
      ["status", "approved"],
    ],
  );
}

/** P0 Export Centre - CSV + DOCX after approval (no HTML pack). */
export function ExportCentre({
  ledger,
  prescriptions,
  initialReports,
}: {
  ledger: LedgerEntry[];
  prescriptions: Prescription[];
  initialReports?: LocalReport[];
}) {
  const [reports, setReports] = useState<LocalReport[]>(
    initialReports?.length
      ? initialReports
      : [
          {
            id: "rep_fixture_1",
            kind: "sustainability_monthly",
            state: "pending_approval",
            periodLabel: "Jul 2026",
          },
        ],
  );
  const [status, setStatus] = useState<string | null>(null);

  const pending = useMemo(
    () => reports.filter((r) => r.state === "pending_approval"),
    [reports],
  );

  function generate() {
    const id = `rep_${Date.now()}`;
    setReports((prev) => [
      {
        id,
        kind: "sustainability_monthly",
        state: "pending_approval",
        periodLabel: "Jul 2026",
      },
      ...prev,
    ]);
    setStatus(`Generated ${id} - pending approval before external send`);
  }

  function approve(id: string) {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, state: "approved" as const } : r)),
    );
    setStatus(`Approved ${id} - CSV / DOCX download unlocked`);
  }

  function requireApproved(id: string): LocalReport | null {
    const report = reports.find((r) => r.id === id);
    if (!report || report.state !== "approved") {
      setStatus("Approve before download");
      return null;
    }
    return report;
  }

  function downloadCsvPack(id: string) {
    const report = requireApproved(id);
    if (!report) return;
    downloadTextFile(
      `sustainability_${id}.csv`,
      sustainabilityCsv(report.periodLabel, id),
    );
    setStatus(`Downloaded CSV ${id}`);
  }

  function downloadDocxPack(id: string) {
    const report = requireApproved(id);
    if (!report) return;
    downloadDocx(
      `sustainability_${id}.docx`,
      sustainabilityLines(report.periodLabel, id),
    );
    setStatus(`Downloaded DOCX ${id}`);
  }

  return (
    <div className="reports-stack" data-export-centre>
      <Panel>
        <div className="reports-export-head">
          <div className="reports-export-head__copy">
            <h2
              style={{
                margin: 0,
                fontFamily: "var(--forge-font-display)",
                fontSize: 16,
              }}
            >
              Export centre
            </h2>
            <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
              Generate → review → approve → download. External send is blocked until approved.
            </p>
          </div>
          <div className="reports-export-head__actions">
            <PrimaryButton onClick={generate}>Generate sustainability pack</PrimaryButton>
            <SecondaryButton
              onClick={() => downloadTextFile("ledger_jaipur.csv", ledgerCsv(ledger))}
            >
              Ledger CSV
            </SecondaryButton>
            <GhostButton
              onClick={() =>
                downloadTextFile(
                  "prescription_audit_jaipur.csv",
                  prescriptionAuditCsv(prescriptions),
                )
              }
            >
              Prescription audit CSV
            </GhostButton>
          </div>
        </div>
      </Panel>

      <Panel>
        <h3 style={{ margin: "0 0 12px", fontFamily: "var(--forge-font-display)", fontSize: 15 }}>
          Approval queue ({pending.length})
        </h3>
        {reports.length === 0 ? (
          <p style={{ margin: 0 }}>No report jobs yet.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
            {reports.map((r) => (
              <li key={r.id} className="reports-job">
                <div className="reports-job__meta">
                  <p style={{ margin: 0, fontWeight: 700 }}>
                    {r.kind.replaceAll("_", " ")} · {r.periodLabel}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
                    {r.id}
                  </p>
                </div>
                <div className="reports-job__actions">
                  <StatusChip
                    tone={
                      r.state === "approved"
                        ? "good"
                        : r.state === "failed"
                          ? "critical"
                          : "warning"
                    }
                  >
                    {r.state.replaceAll("_", " ")}
                  </StatusChip>
                  {r.state === "pending_approval" ? (
                    <SecondaryButton onClick={() => approve(r.id)}>Approve</SecondaryButton>
                  ) : null}
                  {r.state === "approved" ? (
                    <>
                      <SecondaryButton onClick={() => downloadCsvPack(r.id)}>
                        Download CSV
                      </SecondaryButton>
                      <GhostButton onClick={() => downloadDocxPack(r.id)}>
                        Download DOCX
                      </GhostButton>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
        {status ? (
          <p role="status" style={{ margin: "12px 0 0", fontSize: 12, color: "var(--forge-info)" }}>
            {status}
          </p>
        ) : null}
      </Panel>
    </div>
  );
}
