"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { LedgerEntry, Prescription } from "@/lib/types";
import { downloadTextFile, toCsv } from "@/lib/csv-download";
import { downloadDocx } from "@/lib/docx-download";
import { sanitizeClaimStatus } from "@/lib/ledger";
import { bffUrl } from "@/lib/bff";
import { periodLabelForNow } from "@/lib/ledger-from-prescriptions";
import {
  GhostButton,
  Panel,
  PrimaryButton,
  SecondaryButton,
  StatusChip,
} from "@/components/ui/primitives";
import { EmptyUpstreamState } from "@/components/ui/SourceIndicator";

import "./reports.css";

type ReportJob = {
  id: string;
  kind: string;
  state: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  periodLabel?: string;
  approvedAt?: string | null;
  hasArtifact?: boolean;
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

function periodLabelFromJob(r: ReportJob): string {
  if (r.periodLabel) return r.periodLabel;
  if (r.periodStart) {
    const d = new Date(r.periodStart);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString("en-IN", {
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      });
    }
  }
  return periodLabelForNow();
}

function monthBounds(): { periodStart: string; periodEnd: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { periodStart: start.toISOString(), periodEnd: end.toISOString() };
}

/** Export centre — live `/api/reports` jobs; CSV from live ledger/Rx props. */
export function ExportCentre({
  plantId,
  plantName,
  ledger,
  prescriptions,
}: {
  plantId: string;
  plantName: string;
  ledger: LedgerEntry[];
  prescriptions: Prescription[];
}) {
  const [reports, setReports] = useState<ReportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        bffUrl(`/api/reports?plantId=${encodeURIComponent(plantId)}`),
        { credentials: "include", cache: "no-store" },
      );
      if (!res.ok) throw new Error(`reports ${res.status}`);
      const body = (await res.json()) as { items?: ReportJob[] };
      setReports(body.items ?? []);
      setStatus(null);
    } catch (err) {
      setReports([]);
      setStatus(err instanceof Error ? err.message : "Failed to load report jobs");
    } finally {
      setLoading(false);
    }
  }, [plantId]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const pending = useMemo(
    () => reports.filter((r) => r.state === "pending_approval"),
    [reports],
  );

  async function generate() {
    setBusy(true);
    try {
      const bounds = monthBounds();
      const res = await fetch(bffUrl("/api/reports"), {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "sustainability_monthly",
          periodStart: bounds.periodStart,
          periodEnd: bounds.periodEnd,
          plantId,
        }),
      });
      if (!res.ok) throw new Error(`create report ${res.status}`);
      const body = (await res.json()) as { id: string; created?: boolean };
      setStatus(
        body.created
          ? `Generated ${body.id} — pending approval`
          : `Existing job ${body.id} (deduped)`,
      );
      await loadJobs();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Generate failed");
    } finally {
      setBusy(false);
    }
  }

  async function approve(id: string) {
    setBusy(true);
    try {
      const res = await fetch(bffUrl(`/api/reports/${encodeURIComponent(id)}/approve`), {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`approve ${res.status}`);
      setStatus(`Approved ${id}`);
      await loadJobs();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setBusy(false);
    }
  }

  async function downloadArtifact(id: string) {
    const report = reports.find((r) => r.id === id);
    if (!report || report.state !== "approved") {
      setStatus("Approve before download");
      return;
    }
    try {
      const res = await fetch(
        bffUrl(`/api/reports/${encodeURIComponent(id)}/artifact`),
        { credentials: "include" },
      );
      if (!res.ok) throw new Error(`artifact ${res.status}`);
      const html = await res.text();
      downloadTextFile(`sustainability_${id}.html`, html);
      setStatus(`Downloaded HTML artifact ${id}`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Artifact download failed");
    }
  }

  function downloadCsvPack(id: string) {
    const report = reports.find((r) => r.id === id);
    if (!report || report.state !== "approved") {
      setStatus("Approve before download");
      return;
    }
    const label = periodLabelFromJob(report);
    downloadTextFile(
      `sustainability_${id}.csv`,
      toCsv(
        ["field", "value"],
        [
          ["period", label],
          ["report_id", id],
          ["plant_id", plantId],
          ["plant_name", plantName],
          ["status", "approved"],
          ["ledger_rows", String(ledger.length)],
        ],
      ),
    );
    setStatus(`Downloaded CSV ${id}`);
  }

  function downloadDocxPack(id: string) {
    const report = reports.find((r) => r.id === id);
    if (!report || report.state !== "approved") {
      setStatus("Approve before download");
      return;
    }
    const label = periodLabelFromJob(report);
    downloadDocx(`sustainability_${id}.docx`, [
      "Stamped Energy - Sustainability pack",
      `Plant: ${plantName} (${plantId})`,
      `Period: ${label}`,
      `Report id: ${id}`,
      "Status: approved",
      `Ledger rows: ${ledger.length}`,
      "Metrics marked not_measured_by_stamped were not invented.",
    ]);
    setStatus(`Downloaded DOCX ${id}`);
  }

  const slug = plantId.replace(/[^\w-]+/g, "_");

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
              Generate → review → approve → download. Jobs are stored in L6 Postgres for {plantName}.
            </p>
          </div>
          <div className="reports-export-head__actions">
            <PrimaryButton onClick={() => void generate()} disabled={busy}>
              Generate sustainability pack
            </PrimaryButton>
            <SecondaryButton
              onClick={() =>
                downloadTextFile(`ledger_${slug}.csv`, ledgerCsv(ledger))
              }
              disabled={!ledger.length}
            >
              Ledger CSV
            </SecondaryButton>
            <GhostButton
              onClick={() =>
                downloadTextFile(
                  `prescription_audit_${slug}.csv`,
                  prescriptionAuditCsv(prescriptions),
                )
              }
              disabled={!prescriptions.length}
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
        {loading ? (
          <p style={{ margin: 0 }}>Loading report jobs…</p>
        ) : reports.length === 0 ? (
          <EmptyUpstreamState
            title="No report jobs yet"
            detail="Generate a sustainability pack for this plant. Fixture report rows are not seeded."
          />
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
            {reports.map((r) => (
              <li key={r.id} className="reports-job">
                <div className="reports-job__meta">
                  <p style={{ margin: 0, fontWeight: 700 }}>
                    {r.kind.replaceAll("_", " ")} · {periodLabelFromJob(r)}
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
                    <SecondaryButton onClick={() => void approve(r.id)} disabled={busy}>
                      Approve
                    </SecondaryButton>
                  ) : null}
                  {r.state === "approved" ? (
                    <>
                      <SecondaryButton onClick={() => void downloadArtifact(r.id)}>
                        Download HTML
                      </SecondaryButton>
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
