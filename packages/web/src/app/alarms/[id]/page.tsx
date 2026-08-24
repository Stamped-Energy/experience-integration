import { notFound } from "next/navigation";
import { AlarmDetailShell } from "@/components/alarms/AlarmDetailShell";
import {
  alarmsFixture,
  assetById,
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
    plantId: alarm.plantId,
    alarmId: alarm.id,
    alarms: alarmsFixture,
    prescriptions: prescriptionsFixture,
  });
  const pack = buildEvidencePack(scope, { baselineAvailable: true });
  const prescriptionHref = alarm.relatedPrescriptionId
    ? `/prescriptions/${alarm.relatedPrescriptionId}`
    : undefined;

  return (
    <AlarmDetailShell
      alarm={alarm}
      asset={asset}
      pack={pack}
      evidenceSample={evidenceSample}
      evidenceHref={evidenceId ? `/evidence/${evidenceId}` : undefined}
      prescriptionHref={prescriptionHref}
    />
  );
}
