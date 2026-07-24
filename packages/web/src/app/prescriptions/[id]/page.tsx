import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { DataTable, PageHead, Panel, StatusChip } from "@/components/ui/primitives";
import {
  DEMO_PLANT,
  DEMO_SHELL_ROLE,
  alarmsFixture,
  connectionFixture,
  demoCriticalAlarmCount,
  prescriptionsFixture,
} from "@/fixtures/demo";
import { resolveEvidenceIdForRx } from "@/fixtures/evidence-samples";
import { buildEvidencePack, resolveEvidenceScope } from "@/lib/evidence";
import { claimBadgeLabel, formatInr } from "@/lib/format";

const linkBtn: CSSProperties = {
  minHeight: 48,
  display: "inline-flex",
  alignItems: "center",
  padding: "0 18px",
  borderRadius: "var(--forge-radius-md)",
  border: "1px solid var(--forge-outline-variant)",
  fontWeight: 700,
};

export default async function PrescriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rx = prescriptionsFixture.find((r) => r.id === id);
  if (!rx) notFound();
  const badge = claimBadgeLabel(rx.verificationStatus);
  const scope = resolveEvidenceScope({
    plantId: DEMO_PLANT.plantId,
    rxId: rx.id,
    alarms: alarmsFixture,
    prescriptions: prescriptionsFixture,
  });
  const pack = buildEvidencePack(scope, { baselineAvailable: true });
  const evidenceId = resolveEvidenceIdForRx(rx.id);
  const evidenceRows = [
    { id: "why", unit: "Finding", value: rx.why, comment: pack.lineage.ruleId },
    {
      id: "conf",
      unit: "Confidence",
      value: `${Math.round(rx.confidence * 100)}%`,
      comment: pack.lineage.sources.slice(0, 2).join(", "),
    },
    {
      id: "impact",
      unit: "Potential savings",
      value: `${formatInr(rx.impactInrPerMonth)}/mo`,
      comment: badge.label,
    },
  ];

  return (
    <AppShell
      active="prescriptions"
      plantName={DEMO_PLANT.plantName}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle={rx.title}
      contextSummary={[rx.why, formatInr(rx.impactInrPerMonth) + "/mo"]}
      focusEntity={{ type: "prescription", id: rx.id }}
      criticalAlarmCount={demoCriticalAlarmCount()}
    >
      <PageHead
        eyebrow="Prescription"
        title={rx.title}
        actions={
          <Link href="/prescriptions" style={{ fontWeight: 600 }}>
            Back to queue
          </Link>
        }
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Panel>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <p className="forge-eyebrow">Case</p>
              <p style={{ margin: "8px 0 0", fontSize: 15, lineHeight: 1.5 }}>{rx.why}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p className="forge-eyebrow">Potential savings</p>
              <p className="forge-num-display tabular" style={{ color: "var(--forge-tertiary)" }}>
                {formatInr(rx.impactInrPerMonth)}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
            <StatusChip tone="info">{Math.round(rx.confidence * 100)}% confidence</StatusChip>
            <StatusChip tone="neutral">{rx.lane.replaceAll("_", " ")}</StatusChip>
            {rx.verificationStatus ? (
              <StatusChip tone={badge.tone}>{badge.label}</StatusChip>
            ) : null}
          </div>
        </Panel>

        <Panel>
          <p className="forge-eyebrow">Case description & data evidence</p>
          <h2 className="forge-card-title" style={{ marginBottom: 12 }}>
            Evidence
          </h2>
          <DataTable
            caption="Prescription evidence"
            columns={[
              { key: "unit", header: "Unit" },
              { key: "value", header: "Value" },
              { key: "comment", header: "Comment" },
            ]}
            rows={evidenceRows}
          />
          <p style={{ margin: "12px 0 0", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
            Sources: {pack.lineage.sources.join(" · ")}.
          </p>
          {evidenceId ? (
            <Link href={`/evidence?rxId=${rx.id}`} style={{ ...linkBtn, marginTop: 16 }}>
              Show proof
            </Link>
          ) : null}
        </Panel>

        <Panel>
          <p className="forge-eyebrow">Recommended actions</p>
          <ol style={{ margin: "8px 0 0", paddingLeft: 20, fontSize: 14, lineHeight: 1.6 }}>
            <li>Confirm finding against live load for the named assets.</li>
            <li>Assign an owner from the Assignments matrix (WhatsApp notify on assign).</li>
            <li>Mark done when ops confirm; claim status stays separate from bill verification.</li>
          </ol>
          <p style={{ margin: "12px 0 0", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
            Owner {rx.ownerRole.replaceAll("_", " ")} · Due {rx.dueAt}
          </p>
          {rx.opportunityCost ? (
            <p style={{ margin: "12px 0 0", fontSize: 13, color: "var(--forge-warning)" }}>
              Opportunity cost {formatInr(rx.opportunityCost.modeledInr)} (
              {rx.opportunityCost.delayDays} days) — modeled, not bill-verified.
            </p>
          ) : null}
          <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
            <Link href="/settings/assignments" style={linkBtn}>
              Assignments matrix
            </Link>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
