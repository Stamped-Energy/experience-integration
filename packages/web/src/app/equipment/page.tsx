"use client";

import { MachineHealthBoard } from "@/components/equipment/MachineHealthBoard";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyUpstreamState, SourceIndicator } from "@/components/ui/SourceIndicator";
import { PageHead } from "@/components/ui/primitives";
import {
  DEMO_SHELL_ROLE,
  connectionFixture,
} from "@/lib/plant-catalog";
import { useL2Assets } from "@/hooks/useL2Data";
import { usePlant } from "@/lib/plant-context";

type HealthAsset = {
  name: string;
  type: string;
  section: string;
  health: number;
  load: number;
  vib: number;
  temp: number;
  rpm: number;
  current: number;
  runtime: number;
  mtbf: number;
  status: "GOOD" | "WARNING" | "CRITICAL";
  next: string;
};

function l2AssetsToHealth(
  assets: Array<{
    asset_id: string;
    name: string;
    level?: string;
    asset_class?: string;
  }>,
): HealthAsset[] {
  const equipment = assets.filter(
    (a) => a.level === "equipment" || a.asset_class === "cnc_machine",
  );
  return equipment.map((a) => {
    const isCnc = a.asset_class === "cnc_machine";
    return {
      name: a.name,
      type: isCnc ? "CNC Machine" : (a.asset_class ?? "Equipment"),
      section: isCnc ? "Machining" : (a.level ?? "Plant"),
      health: 0,
      load: 0,
      vib: 0,
      temp: 0,
      rpm: 0,
      current: 0,
      runtime: 0,
      mtbf: 0,
      status: "GOOD" as const,
      next: "—",
    };
  });
}

export default function EquipmentPage() {
  const { activePlant, plants, setActivePlantId } = usePlant();
  const { assets, source, loading, loadError } = useL2Assets(activePlant.plantId);

  const liveHealthAssets =
    source === "l2" ? l2AssetsToHealth(assets) : undefined;

  const indicatorSource = source === "l2" ? "l2" : "unavailable";

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
        source === "l2" ? `${assets.length} assets from L2` : "No L2 assets",
        "Vibration/FFT not available without L1 sensing",
        activePlant.plantName,
      ]}
      criticalAlarmCount={0}
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
          : "L2 unreachable — no fixture fleet shown"}
      </p>
      {source === "l2" && liveHealthAssets ? (
        <>
          <MachineHealthBoard
            key={`${activePlant.plantId}:${source}`}
            mode="live"
            liveAssets={liveHealthAssets}
          />
          <div style={{ marginTop: 16 }}>
            <EmptyUpstreamState
              title="Vibration / FFT / thermal charts"
              detail="LNM CNC telemetry has machine_state and spindle load — not vibration or bearing temperature. These panels stay empty until L1 sensing exists."
            />
          </div>
        </>
      ) : (
        <EmptyUpstreamState
          title="No equipment data"
          detail="Connect L2 to load the plant asset graph. Fixture health fleets have been removed."
        />
      )}
    </AppShell>
  );
}
