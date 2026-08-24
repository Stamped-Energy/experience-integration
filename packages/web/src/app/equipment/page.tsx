"use client";

import { useMemo } from "react";
import { MachineHealthBoard } from "@/components/equipment/MachineHealthBoard";
import { AppShell } from "@/components/shell/AppShell";
import { SourceIndicator } from "@/components/ui/SourceIndicator";
import { PageHead } from "@/components/ui/primitives";
import {
  DEMO_SHELL_ROLE,
  alarmsForPlant,
  connectionFixture,
} from "@/fixtures/demo";
import { useL2Assets } from "@/hooks/useL2Data";
import type { HealthAsset } from "@/fixtures/machine-health";
import { fixtureAssetsAsL2 } from "@/lib/l2-live";
import { usePlant } from "@/lib/plant-context";

function l2AssetsToHealth(assets: ReturnType<typeof fixtureAssetsAsL2>): HealthAsset[] {
  const equipment = assets.filter(
    (a) => a.level === "equipment" || a.asset_class === "cnc_machine",
  );
  return equipment.map((a) => {
    const isCnc = a.asset_class === "cnc_machine";
    return {
      name: a.name,
      type: isCnc ? "CNC Machine" : (a.asset_class ?? "Equipment"),
      section: isCnc ? "Machining" : (a.level ?? "Plant"),
      health: isCnc ? 78 : 72,
      load: 0,
      vib: 0,
      temp: 0,
      rpm: 0,
      current: 0,
      runtime: 0,
      mtbf: 0,
      status: isCnc ? "GOOD" : "WARNING",
      next: "—",
    };
  });
}

export default function EquipmentPage() {
  const { activePlant, plants, setActivePlantId } = usePlant();
  const critical = alarmsForPlant(activePlant.plantId).filter(
    (a) => a.severity === "critical" && a.state !== "cleared",
  ).length;

  const getFixture = useMemo(() => fixtureAssetsAsL2, []);
  const { assets, source, loading, loadError } = useL2Assets(
    activePlant.plantId,
    getFixture,
  );

  const liveHealthAssets =
    source === "l2" ? l2AssetsToHealth(assets) : undefined;

  /** Preview when not on live L2 — never silent fixture (Phase E commit 30). */
  const boardMode = source === "l2" ? "live" : "preview";
  const indicatorSource = source === "l2" ? "l2" : "preview";

  const contextLine = loading
    ? "Loading equipment…"
    : source === "l2"
      ? `${assets.length} assets from L2`
      : "Preview · fixture condition monitoring";

  return (
    <AppShell
      active="equipment"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      plants={plants.map((p) => ({ id: p.plantId, name: p.plantName }))}
      onPlantChange={setActivePlantId}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Machine Health"
      contextSummary={[
        contextLine,
        source === "l2" ? "CNC asset graph" : "Predictive preview",
        activePlant.plantName,
      ]}
      criticalAlarmCount={critical}
    >
      <PageHead eyebrow="Operations" title="Machine Health" />
      <SourceIndicator
        source={indicatorSource}
        loading={loading}
        detail={loadError}
      />
      <p style={{ margin: "0 0 8px", fontSize: 14, color: "var(--forge-on-surface-variant)" }}>
        {source === "l2"
          ? `Live L2 asset graph · ${assets.length} assets · ${activePlant.plantName}`
          : "Preview condition monitoring — not live plant instrumentation"}
      </p>
      <MachineHealthBoard
        key={`${activePlant.plantId}:${source}`}
        mode={boardMode}
        liveAssets={liveHealthAssets}
      />
    </AppShell>
  );
}
