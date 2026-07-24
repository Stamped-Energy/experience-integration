import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import {
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
  assetById,
  connectionFixture,
  demoCriticalAlarmCount,
} from "@/fixtures/demo";
import { resolveEvidenceIdForAlarm } from "@/fixtures/evidence-samples";
import { actionsForState } from "@/lib/alarms";
import { formatIndianNum } from "@/lib/format";

export default async function AlarmDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const alarm = alarmsFixture.find((a) => a.id === id);
  if (!alarm) notFound();

  const actions = actionsForState(alarm.state);
  const asset = assetById(alarm.assetId);
  const evidenceId = resolveEvidenceIdForAlarm(alarm.id);

  return (
    <AppShell
      active="alarms"
      plantName={DEMO_PLANT.plantName}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle={`Alarm ${alarm.assetLabel}`}
      contextSummary={[alarm.summary]}
      focusEntity={{ type: "alarm", id: alarm.id }}
      criticalAlarmCount={demoCriticalAlarmCount()}
    >
      <PageHead
        eyebrow="EMS detail"
        title={alarm.assetLabel}
        actions={
          <ForgeButton variant="link" href="/alarms">
            Back to console
          </ForgeButton>
        }
      />
      <Panel>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <StatusChip
            tone={
              alarm.severity === "critical"
                ? "critical"
                : alarm.severity === "warning"
                  ? "warning"
                  : "info"
            }
          >
            {alarm.severity}
          </StatusChip>
          <StatusChip tone="neutral">{alarm.state}</StatusChip>
          {alarm.findingId ? (
            <StatusChip tone="info">Finding · {alarm.findingId}</StatusChip>
          ) : null}
        </div>
        <p style={{ margin: "16px 0 0", fontSize: 16 }}>{alarm.summary}</p>
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
          Raised {alarm.raisedAt} · Asset {alarm.assetId}
          {alarm.ownerRole ? ` · Owner ${alarm.ownerRole.replaceAll("_", " ")}` : ""}
        </p>
        {asset ? (
          <p
            className="tabular"
            style={{ margin: "8px 0 0", fontSize: 13, color: "var(--forge-on-surface-variant)" }}
          >
            {asset.area} · Load {asset.loadPct}% · {formatIndianNum(asset.kwhMtd)} kWh MTD
            {asset.pf != null ? ` · PF ${formatIndianNum(asset.pf, 2)}` : ""}
          </p>
        ) : null}
        <div style={{ marginTop: 20 }}>
          <ForgeButtonGroup aria-label="Alarm detail actions">
            {actions.includes("ack") ? (
              <ForgeButton variant="primary">Acknowledge</ForgeButton>
            ) : null}
            {evidenceId ? (
              <ForgeButton variant="ghost" href={`/evidence/${evidenceId}`}>
                Evidence
              </ForgeButton>
            ) : null}
            {alarm.relatedPrescriptionId ? (
              <ForgeButton
                variant="ghost"
                href={`/prescriptions/${alarm.relatedPrescriptionId}`}
              >
                Prescription
              </ForgeButton>
            ) : null}
          </ForgeButtonGroup>
        </div>
      </Panel>
    </AppShell>
  );
}
