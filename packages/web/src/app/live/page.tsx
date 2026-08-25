"use client";

import { useMemo } from "react";
import { LiveBoard } from "@/components/live/LiveBoard";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyUpstreamState, SourceIndicator } from "@/components/ui/SourceIndicator";
import { LiveBoardSkeleton } from "@/components/ui/PageSkeletons";
import { PageHead } from "@/components/ui/primitives";
import {
  DEMO_SHELL_ROLE,
  connectionFixture,
} from "@/lib/plant-catalog";
import { useL2Assets, useL2Measurements } from "@/hooks/useL2Data";
import { liveSnapshotFromL2Assets, resolveLivePageSource } from "@/lib/l2-live";
import { usePlant } from "@/lib/plant-context";

export default function LivePage() {
  const { activePlant, plants, setActivePlantId } = usePlant();

  const {
    assets,
    source: assetSource,
    loading: assetsLoading,
    loadError: assetsError,
  } = useL2Assets(activePlant.plantId);

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
    enabled: assetSource === "l2",
  });

  const source = resolveLivePageSource(assetSource, measSource);
  const loading = assetsLoading || measLoading;
  const loadError = assetsError ?? measError;

  const overlay = useMemo(() => {
    if (assetSource !== "l2") return null;
    return liveSnapshotFromL2Assets(assets, {
      measurementPoints: measSource === "l2" ? points : undefined,
    });
  }, [assetSource, measSource, assets, points]);

  const indicatorSource =
    source === "l2" || source === "preview" ? source : "unavailable";

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
          : "No live telemetry",
        source === "l2" ? `${assets.length} assets from L2` : "Waiting for L2",
        activePlant.shift,
      ]}
      criticalAlarmCount={0}
    >
      <PageHead eyebrow="Operations" title="Live" />
      <SourceIndicator
        source={indicatorSource}
        loading={loading}
        detail={loadError}
      />
      <p className="forge-page-lede">
        Real-time plant instrumentation from L2 · {activePlant.shift}
      </p>
      {loading ? (
        <LiveBoardSkeleton />
      ) : source === "l2" && overlay ? (
        <LiveBoard
          key={`${activePlant.plantId}:${source}`}
          connection={connectionFixture}
          overlay={overlay}
          jitter={false}
        />
      ) : (
        <EmptyUpstreamState
          title="No live telemetry"
          detail="L2 assets/measurements unavailable. Demo jitter baseline has been removed."
        />
      )}
    </AppShell>
  );
}
