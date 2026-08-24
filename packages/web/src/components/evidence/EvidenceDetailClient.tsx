"use client";

import { AppShell } from "@/components/shell/AppShell";
import { PageHead } from "@/components/ui/primitives";
import { EvidenceDetail } from "@/components/evidence/EvidenceDetail";
import {
  DEMO_SHELL_ROLE,
  alarmsForPlant,
  connectionFixture,
} from "@/fixtures/demo";
import type { EvidenceSample } from "@/fixtures/evidence-samples";
import { usePlant } from "@/lib/plant-context";

export function EvidenceDetailClient({ sample }: { sample: EvidenceSample }) {
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
      screenTitle={`Evidence · ${sample.assetLabel}`}
      contextSummary={[sample.categoryBadge.label, sample.chartTitle, activePlant.plantName]}
      focusEntity={
        sample.rxId
          ? { type: "prescription", id: sample.rxId }
          : sample.alarmId
            ? { type: "alarm", id: sample.alarmId }
            : undefined
      }
      criticalAlarmCount={critical}
    >
      <PageHead
        eyebrow="Evidence"
        title={`${sample.assetLabel} · ${sample.categoryBadge.label}`}
      />
      <EvidenceDetail sample={sample} showBaselineBand={false} />
    </AppShell>
  );
}
