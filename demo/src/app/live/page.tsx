"use client";

import { useMemo } from "react";
import { LiveBoard } from "@/components/live/LiveBoard";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyUpstreamState, SourceIndicator } from "@/components/ui/SourceIndicator";
import { LiveBoardSkeleton } from "@/components/ui/PageSkeletons";
import { PageHead } from "@/components/ui/primitives";
import { DEMO_DATA_SOURCE, getDemoLiveSnapshot } from "@/lib/demo-data";
import { useL2Assets, useL2Measurements } from "@/hooks/useL2Data";
import { liveSnapshotFromL2Assets, resolveLivePageSource } from "@/lib/l2-live";
import { useProductShell } from "@/lib/product-shell";

export default function LivePage() {
  const {
    activePlant,
    plants,
    onPlantChange,
    role,
    connection,
    isDemoSession,
  } = useProductShell();

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
    enabled: !isDemoSession && assetSource === "l2",
  });

  const demoOverlay = isDemoSession ? getDemoLiveSnapshot() : null;
  const source = isDemoSession
    ? DEMO_DATA_SOURCE
    : resolveLivePageSource(assetSource, measSource);
  const loading = isDemoSession ? false : assetsLoading || measLoading;
  const loadError = isDemoSession ? null : assetsError ?? measError;

  const overlay = useMemo(() => {
    if (isDemoSession) return demoOverlay;
    if (assetSource !== "l2") return null;
    return liveSnapshotFromL2Assets(assets, {
      measurementPoints: measSource === "l2" ? points : undefined,
    });
  }, [isDemoSession, demoOverlay, assetSource, measSource, assets, points]);

  const hasData = source === "l2" || source === "preview";

  return (
    <AppShell
      active="live"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      plants={plants}
      onPlantChange={onPlantChange}
      role={role}
      connection={connection}
      screenTitle="Live"
      contextSummary={[
        hasData ? "Live telemetry" : "No live telemetry",
        hasData ? `${overlay?.machines.length ?? 0} assets tracked` : "Waiting for connection",
        activePlant.shift,
      ]}
      criticalAlarmCount={0}
    >
      <PageHead eyebrow="Operations" title="Live" />
      <SourceIndicator source={source} loading={loading} detail={loadError} />
      <p className="forge-page-lede">
        Real-time plant instrumentation · {activePlant.shift}
      </p>
      {loading ? (
        <LiveBoardSkeleton />
      ) : hasData && overlay ? (
        <LiveBoard
          key={`${activePlant.plantId}:${source}`}
          connection={connection}
          overlay={overlay}
          jitter={!isDemoSession}
        />
      ) : (
        <EmptyUpstreamState
          title="No live telemetry"
          detail="Live asset and measurement data is not available for this plant."
        />
      )}
    </AppShell>
  );
}
