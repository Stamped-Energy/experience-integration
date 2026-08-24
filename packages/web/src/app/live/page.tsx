"use client";

import { useMemo } from "react";
import { LiveBoard } from "@/components/live/LiveBoard";
import { AppShell } from "@/components/shell/AppShell";
import { SourceIndicator } from "@/components/ui/SourceIndicator";
import { PageHead } from "@/components/ui/primitives";
import {
  DEMO_SHELL_ROLE,
  alarmsForPlant,
  connectionFixture,
} from "@/fixtures/demo";
import { useL2Assets, useL2Measurements } from "@/hooks/useL2Data";
import { fixtureAssetsAsL2, liveSnapshotFromL2Assets, resolveLivePageSource } from "@/lib/l2-live";
import { usePlant } from "@/lib/plant-context";

export default function LivePage() {
  const { activePlant, plants, setActivePlantId } = usePlant();
  const critical = alarmsForPlant(activePlant.plantId).filter(
    (a) => a.severity === "critical" && a.state !== "cleared",
  ).length;

  const getFixture = useMemo(() => fixtureAssetsAsL2, []);
  const {
    assets,
    source: assetSource,
    loading: assetsLoading,
    loadError: assetsError,
  } = useL2Assets(activePlant.plantId, getFixture);

  const windowTo = useMemo(() => new Date(), [activePlant.plantId]);
  const windowFrom = useMemo(() => {
    const d = new Date(windowTo);
    d.setHours(d.getHours() - 6);
    return d;
  }, [windowTo]);

  const incomerId =
    assets.find((a) => a.asset_class === "incomer")?.asset_id ?? "incomer_1";

  const {
    points,
    source: measSource,
    loading: measLoading,
    loadError: measError,
  } = useL2Measurements({
    plantId: activePlant.plantId,
    assetId: incomerId,
    metric: "active_power_kw",
    from: windowFrom.toISOString(),
    to: windowTo.toISOString(),
    enabled: assetSource === "l2" || activePlant.plantId === "plant_lnm_faridabad_1",
  });

  const source = resolveLivePageSource(assetSource, measSource);
  const loading = assetsLoading || measLoading;
  const loadError = assetsError ?? measError;

  const overlay = useMemo(() => {
    // Overlay only when assets are live — never paint fixture machines as L2 live.
    if (assetSource !== "l2") return null;
    return liveSnapshotFromL2Assets(assets, {
      measurementPoints: measSource === "l2" ? points : undefined,
    });
  }, [assetSource, measSource, assets, points]);

  const contextLine = loading
    ? "Loading live telemetry…"
    : source === "l2"
      ? `${assets.length} assets from L2`
      : source === "preview"
        ? "Measurements from L2 · assets still fixture"
        : "Demo fixture telemetry";

  return (
    <AppShell
      active="live"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      plants={plants.map((p) => ({ id: p.plantId, name: p.plantName }))}
      onPlantChange={setActivePlantId}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Live"
      contextSummary={[
        source === "l2"
          ? "L2 measurements · plant-scoped"
          : source === "preview"
            ? "Hybrid · measurements live"
            : "Modbus / OPC-UA · demo poll",
        contextLine,
        activePlant.shift,
      ]}
      criticalAlarmCount={critical}
    >
      <PageHead eyebrow="Operations" title="Live" />
      <SourceIndicator
        source={source}
        loading={loading}
        detail={loadError}
      />
      <p className="forge-page-lede">
        Real-time plant instrumentation · load dials, health map, demand profile, and anomaly feed ·{" "}
        {activePlant.shift}
      </p>
      <LiveBoard
        key={`${activePlant.plantId}:${source}`}
        connection={connectionFixture}
        overlay={overlay}
        jitter={source !== "l2"}
      />
    </AppShell>
  );
}
