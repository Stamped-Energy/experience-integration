"use client";

import { AlarmDetailClient } from "@/components/alarms/AlarmDetailClient";
import { AppShell } from "@/components/shell/AppShell";
import { ForgeButton, PageHead } from "@/components/ui/primitives";
import {
  DEMO_SHELL_ROLE,
  alarmsForPlant,
  connectionFixture,
} from "@/fixtures/demo";
import type { EvidenceSample } from "@/fixtures/evidence-samples";
import type { EvidencePack } from "@/lib/evidence";
import { usePlant } from "@/lib/plant-context";
import type { Alarm } from "@/lib/types";
import type { DemoAsset } from "@/fixtures/demo";

export function AlarmDetailShell({
  alarm,
  asset,
  pack,
  evidenceSample,
  evidenceHref,
  prescriptionHref,
}: {
  alarm: Alarm;
  asset: DemoAsset | undefined;
  pack: EvidencePack;
  evidenceSample: EvidenceSample | undefined;
  evidenceHref?: string;
  prescriptionHref?: string;
}) {
  const { activePlant, plants, setActivePlantId } = usePlant();
  const critical = alarmsForPlant(activePlant.plantId).filter(
    (a) => a.severity === "critical" && a.state !== "cleared",
  ).length;

  return (
    <AppShell
      active="alarms"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      plants={plants.map((p) => ({ id: p.plantId, name: p.plantName }))}
      onPlantChange={setActivePlantId}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle={`Alarm ${alarm.assetLabel}`}
      contextSummary={[alarm.summary, activePlant.plantName]}
      focusEntity={{ type: "alarm", id: alarm.id }}
      criticalAlarmCount={critical}
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
        evidenceHref={evidenceHref}
        prescriptionHref={prescriptionHref}
      />
    </AppShell>
  );
}
