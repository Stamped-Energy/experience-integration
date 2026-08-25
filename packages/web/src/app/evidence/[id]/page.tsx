"use client";

import { AppShell } from "@/components/shell/AppShell";
import { EmptyUpstreamState, SourceIndicator } from "@/components/ui/SourceIndicator";
import { PageHead } from "@/components/ui/primitives";
import { DEMO_SHELL_ROLE, connectionFixture } from "@/lib/plant-catalog";
import { usePlant } from "@/lib/plant-context";

export default function EvidenceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { activePlant, plants, setActivePlantId } = usePlant();
  const id = params.id;

  return (
    <AppShell
      active="evidence"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      plants={plants.map((p) => ({ id: p.plantId, name: p.plantName }))}
      onPlantChange={setActivePlantId}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Evidence"
      contextSummary={[`Bundle ${id}`, activePlant.plantName]}
      criticalAlarmCount={0}
    >
      <PageHead eyebrow="Evidence" title={id} />
      <SourceIndicator source="unavailable" />
      <EmptyUpstreamState
        title="Evidence sample fixtures removed"
        detail={`Download live L5 bundles via /api/evidence/${id}/download when a prescription exposes evidence_bundle_id.`}
      />
    </AppShell>
  );
}
