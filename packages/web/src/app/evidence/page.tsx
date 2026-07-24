import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { PageHead } from "@/components/ui/primitives";
import { EvidenceIndex } from "@/components/evidence/EvidenceIndex";
import {
  DEMO_SHELL_ROLE,
  DEMO_PLANT,
  alarmsFixture,
  connectionFixture,
  demoCriticalAlarmCount,
} from "@/fixtures/demo";
import {
  evidenceSamplesFixture,
  resolvePrimaryEvidenceId,
} from "@/fixtures/evidence-samples";

export default async function EvidencePage({
  searchParams,
}: {
  searchParams: Promise<{ alarmId?: string; rxId?: string }>;
}) {
  const sp = await searchParams;

  const evidenceId = resolvePrimaryEvidenceId({
    alarmId: sp.alarmId,
    rxId: sp.rxId,
  });

  if (evidenceId) {
    redirect(`/evidence/${evidenceId}`);
  }

  if (sp.alarmId) {
    const alarm = alarmsFixture.find((a) => a.id === sp.alarmId);
    const fallbackId = resolvePrimaryEvidenceId({
      findingId: alarm?.findingId,
      rxId: alarm?.relatedPrescriptionId,
    });
    if (fallbackId) redirect(`/evidence/${fallbackId}`);
  }

  if (sp.rxId) {
    const rxEvidenceId = resolvePrimaryEvidenceId({ rxId: sp.rxId });
    if (rxEvidenceId) redirect(`/evidence/${rxEvidenceId}`);
  }

  return (
    <AppShell
      active="evidence"
      plantName={DEMO_PLANT.plantName}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Evidence"
      contextSummary={[`${evidenceSamplesFixture.length} evidence packs`]}
      criticalAlarmCount={demoCriticalAlarmCount()}
    >
      <PageHead eyebrow="Proof" title="Evidence index" />
      <EvidenceIndex samples={evidenceSamplesFixture} />
    </AppShell>
  );
}
