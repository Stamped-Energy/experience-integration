"use client";

import { AppShell } from "@/components/shell/AppShell";
import { PageHead } from "@/components/ui/primitives";
import { EvidenceIndex } from "@/components/evidence/EvidenceIndex";
import {
  DEMO_SHELL_ROLE,
  alarmsForPlant,
  connectionFixture,
} from "@/fixtures/demo";
import type { EvidenceSample } from "@/fixtures/evidence-samples";
import { usePlant } from "@/lib/plant-context";

export function EvidenceIndexClient({ samples }: { samples: EvidenceSample[] }) {
  const { activePlant, plants, setActivePlantId } = usePlant();
  const critical = alarmsForPlant(activePlant.plantId).filter(
    (a) => a.severity === "critical" && a.state !== "cleared",
  ).length;

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
      contextSummary={[`${samples.length} evidence packs`, activePlant.plantName]}
      criticalAlarmCount={critical}
    >
      <PageHead eyebrow="Proof" title="Evidence index" />
      <EvidenceIndex samples={samples} />
    </AppShell>
  );
}
