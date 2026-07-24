import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import {
  DataTable,
  ForgeButton,
  ForgeButtonGroup,
  PageHead,
  Panel,
  StatusChip,
} from "@/components/ui/primitives";
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
    {
      id: "signal",
      unit: "Signal",
      value: pack.lineage.ruleId ?? "Rule",
      comment: pack.lineage.sources.slice(0, 2).join(", "),
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
          <ForgeButton variant="link" href="/prescriptions">
            Back to queue
          </ForgeButton>
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
          <p className="forge-eyebrow">Signal teaser</p>
          <h2 className="forge-card-title" style={{ marginBottom: 12 }}>
            Proof entry
          </h2>
          <DataTable
            caption="Prescription signal"
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
            <div style={{ marginTop: 16 }}>
              <ForgeButton variant="secondary" href={`/evidence?rxId=${rx.id}`}>
                Show proof
              </ForgeButton>
            </div>
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
          <div style={{ marginTop: 20 }}>
            <ForgeButtonGroup>
              <ForgeButton variant="ghost" href="/settings/assignments">
                Assignments matrix
              </ForgeButton>
            </ForgeButtonGroup>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
