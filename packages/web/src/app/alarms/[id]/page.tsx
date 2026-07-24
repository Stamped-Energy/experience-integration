import { notFound } from "next/navigation";
import { AlarmDetailClient } from "@/components/alarms/AlarmDetailClient";
import { AppShell } from "@/components/shell/AppShell";
import { ForgeButton, PageHead } from "@/components/ui/primitives";
import {
  DEMO_PLANT,
  DEMO_SHELL_ROLE,
  alarmsFixture,
  assetById,
  connectionFixture,
  demoCriticalAlarmCount,
  prescriptionsFixture,
} from "@/fixtures/demo";
import { findEvidenceSample, resolveEvidenceIdForAlarm } from "@/fixtures/evidence-samples";
import { buildEvidencePack, resolveEvidenceScope } from "@/lib/evidence";

export default async function AlarmDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const alarm = alarmsFixture.find((a) => a.id === id);
  if (!alarm) notFound();

  const asset = assetById(alarm.assetId);
  const evidenceId = resolveEvidenceIdForAlarm(alarm.id);
  const evidenceSample = evidenceId ? findEvidenceSample(evidenceId) : undefined;
  const scope = resolveEvidenceScope({
    plantId: DEMO_PLANT.plantId,
    alarmId: alarm.id,
    alarms: alarmsFixture,
    prescriptions: prescriptionsFixture,
  });
  const pack = buildEvidencePack(scope, { baselineAvailable: true });
  const prescriptionHref = alarm.relatedPrescriptionId
    ? `/prescriptions/${alarm.relatedPrescriptionId}`
    : undefined;

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
        eyebrow="Alarm · Full detail"
        title={alarm.assetLabel}
        actions={
          <ForgeButton variant="link" href="/alarms">
            Back to console
          </ForgeButton>
        }
      />
      <AlarmDetailClient
        initial={alarm}
        asset={asset}
        pack={pack}
        evidenceSample={evidenceSample}
        evidenceHref={evidenceId ? `/evidence/${evidenceId}` : undefined}
        prescriptionHref={prescriptionHref}
      />
    </AppShell>
  );
}
