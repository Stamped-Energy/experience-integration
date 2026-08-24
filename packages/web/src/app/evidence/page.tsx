import { redirect } from "next/navigation";
import { EvidenceIndexClient } from "@/components/evidence/EvidenceIndexClient";
import { alarmsFixture } from "@/fixtures/demo";
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

  return <EvidenceIndexClient samples={evidenceSamplesFixture} />;
}
