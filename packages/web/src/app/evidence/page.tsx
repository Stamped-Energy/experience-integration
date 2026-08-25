"use client";

import { AppShell } from "@/components/shell/AppShell";
import { EmptyUpstreamState, SourceIndicator } from "@/components/ui/SourceIndicator";
import { PageHead } from "@/components/ui/primitives";
import { DEMO_SHELL_ROLE, connectionFixture } from "@/lib/plant-catalog";
import { usePlant } from "@/lib/plant-context";

/** Evidence index — live bundles come from L5 prescription evidence refs. */
export default function EvidencePage() {
  const { activePlant, plants, setActivePlantId } = usePlant();

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
      contextSummary={["L5 evidence bundles", activePlant.plantName]}
      criticalAlarmCount={0}
    >
      <PageHead eyebrow="Operations" title="Evidence" />
      <SourceIndicator source="unavailable" />
      <EmptyUpstreamState
        title="No evidence samples"
        detail="Open a prescription case and use its evidence_bundle_id (L5). Fixture evidenceSamplesFixture index removed. Download via /api/evidence/:bundleId/download when a bundle exists."
      />
    </AppShell>
  );
}
