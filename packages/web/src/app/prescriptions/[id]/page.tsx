import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { PrescriptionFullCase } from "@/components/prescriptions/PrescriptionFullCase";
import { ForgeButton, PageHead } from "@/components/ui/primitives";
import {
  DEMO_PLANT,
  DEMO_SHELL_ROLE,
  alarmsFixture,
  assetById,
  connectionFixture,
  demoCriticalAlarmCount,
  ledgerFixture,
  prescriptionsFixture,
} from "@/fixtures/demo";
import { resolveEvidenceIdForRx, findEvidenceSample } from "@/fixtures/evidence-samples";
import { buildEvidencePack, resolveEvidenceScope } from "@/lib/evidence";
import { formatInr } from "@/lib/format";

export default async function PrescriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rx = prescriptionsFixture.find((r) => r.id === id);
  if (!rx) notFound();

  const scope = resolveEvidenceScope({
    plantId: DEMO_PLANT.plantId,
    rxId: rx.id,
    alarms: alarmsFixture,
    prescriptions: prescriptionsFixture,
  });
  const pack = buildEvidencePack(scope, { baselineAvailable: true });
  const evidenceId = resolveEvidenceIdForRx(rx.id);
  const evidenceSample = evidenceId ? findEvidenceSample(evidenceId) : undefined;
  const evidenceHref = evidenceId ? `/evidence/${evidenceId}` : undefined;
  const ledger = ledgerFixture.find((e) => e.prescriptionId === rx.id);
  const alarm = rx.relatedAlarmId
    ? alarmsFixture.find((a) => a.id === rx.relatedAlarmId)
    : alarmsFixture.find((a) => a.relatedPrescriptionId === rx.id);
  const asset = alarm ? assetById(alarm.assetId) : assetById(scope.assetId);

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
        eyebrow="Prescription · Full case"
        title={rx.title}
        actions={
          <ForgeButton variant="link" href="/prescriptions">
            Back to queue
          </ForgeButton>
        }
      />
      <PrescriptionFullCase
        rx={rx}
        pack={pack}
        ledger={ledger}
        alarm={alarm}
        asset={asset}
        evidenceSample={evidenceSample}
        evidenceHref={evidenceHref}
      />
    </AppShell>
  );
}
