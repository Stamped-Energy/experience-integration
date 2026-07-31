import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { PrescriptionFullCase } from "@/components/prescriptions/PrescriptionFullCase";
import { PrescriptionDetailNav } from "@/components/prescriptions/PrescriptionDetailNav";
import { PageHead } from "@/components/ui/primitives";
import {
  DEMO_SHELL_ROLE,
  alarmsForPlant,
  assetById,
  connectionFixture,
  findPrescription,
  ledgerFixture,
  plantForId,
  prescriptionsForPlant,
} from "@/fixtures/demo";
import { resolveEvidenceIdForRx, findEvidenceSample } from "@/fixtures/evidence-samples";
import { buildEvidencePack, resolveEvidenceScope } from "@/lib/evidence";
import { formatInr } from "@/lib/format";
import {
  navForPrescription,
  parseClassFacet,
  parseInboxSection,
} from "@/lib/prescription-nav";

export default async function PrescriptionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ section?: string; class?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const rx = findPrescription(id);
  if (!rx) notFound();

  const plant = plantForId(rx.plantId);
  const plantRx = prescriptionsForPlant(rx.plantId);
  const plantAlarms = alarmsForPlant(rx.plantId);

  const section = parseInboxSection(sp.section, rx);
  const facet = parseClassFacet(sp.class);
  const nav = navForPrescription(plantRx, rx.id, section, facet, {
    includeDone: section === "acknowledged" && rx.lane === "closed",
  });

  const scope = resolveEvidenceScope({
    plantId: plant.plantId,
    rxId: rx.id,
    alarms: plantAlarms,
    prescriptions: plantRx,
  });
  const pack = buildEvidencePack(scope, { baselineAvailable: true });
  const evidenceId = resolveEvidenceIdForRx(rx.id);
  const evidenceSample = evidenceId ? findEvidenceSample(evidenceId) : undefined;
  const evidenceHref = evidenceId ? `/evidence/${evidenceId}` : undefined;
  const ledger = ledgerFixture.find((e) => e.prescriptionId === rx.id);
  const alarm = rx.relatedAlarmId
    ? plantAlarms.find((a) => a.id === rx.relatedAlarmId)
    : plantAlarms.find((a) => a.relatedPrescriptionId === rx.id);
  const asset = alarm ? assetById(alarm.assetId) : assetById(scope.assetId);
  const criticalAlarmCount = plantAlarms.filter(
    (a) => a.severity === "critical" && a.state !== "cleared",
  ).length;

  return (
    <AppShell
      active="prescriptions"
      plantName={plant.plantName}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle={rx.title}
      contextSummary={[rx.why, formatInr(rx.impactInrPerMonth) + "/mo"]}
      focusEntity={{ type: "prescription", id: rx.id }}
      criticalAlarmCount={criticalAlarmCount}
    >
      <PageHead
        eyebrow="Prescription · Full case"
        title={rx.title}
        actions={
          <PrescriptionDetailNav
            prevHref={nav.prevHref}
            nextHref={nav.nextHref}
            label={nav.label}
          />
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
