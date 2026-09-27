"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyUpstreamState, SourceIndicator } from "@/components/ui/SourceIndicator";
import { PageHead } from "@/components/ui/primitives";
import {
  PlantSectionMap,
  type PlantMapLevels,
} from "@/components/equipment/PlantSectionMap";
import { bffUrl, type DataSource } from "@/lib/bff";
import { DEMO_DATA_SOURCE, getDemoPlantMap } from "@/lib/demo-data";
import { useProductShell } from "@/lib/product-shell";

type PlantMapResponse = {
  plantId: string;
  source?: string;
  detail?: string | null;
  derivedNotes?: string[];
  rootLevelId?: string;
  levels?: PlantMapLevels;
};

export default function PlantMapPage() {
  const {
    activePlant,
    plants,
    onPlantChange,
    role,
    connection,
    isDemoSession,
  } = useProductShell();
  const [source, setSource] = useState<DataSource>("unavailable");
  const [loading, setLoading] = useState(true);
  const [levels, setLevels] = useState<PlantMapLevels | null>(null);
  const [rootLevelId, setRootLevelId] = useState("root");
  const [notes, setNotes] = useState<string[]>([]);
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    if (isDemoSession) {
      const demo = getDemoPlantMap();
      setLevels(demo.levels);
      setRootLevelId(demo.rootLevelId);
      setNotes(demo.notes);
      setSource(DEMO_DATA_SOURCE);
      setLoading(false);
      setDetail(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLevels(null);
    setSource("unavailable");
    setDetail(null);
    setNotes([]);
    void fetch(
      bffUrl(
        `/api/insights/plant-map?plantId=${encodeURIComponent(activePlant.plantId)}`,
      ),
      { credentials: "include", cache: "no-store" },
    )
      .then(async (res) => {
        if (!res.ok) throw new Error(`insights/plant-map ${res.status}`);
        return (await res.json()) as PlantMapResponse;
      })
      .then((body) => {
        if (cancelled) return;
        if (body.source === "l2" && body.levels && Object.keys(body.levels).length > 0) {
          setLevels(body.levels);
          setRootLevelId(body.rootLevelId ?? "root");
          setNotes(body.derivedNotes ?? []);
          setSource("l2");
          setDetail(body.detail ?? null);
        } else {
          setDetail(body.detail ?? "Plant map data is not available yet");
          setSource("unavailable");
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setDetail(err instanceof Error ? err.message : "Plant map unavailable");
          setSource("unavailable");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activePlant.plantId, isDemoSession]);

  const hasData = source === "l2" || source === "preview";

  return (
    <AppShell
      active="plant_map"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      plants={plants}
      onPlantChange={onPlantChange}
      role={role}
      connection={connection}
      screenTitle="Plant Map"
      contextSummary={[
        hasData ? "Plant map loaded" : "Plant map unavailable",
        activePlant.plantName,
      ]}
      criticalAlarmCount={0}
    >
      <PageHead eyebrow="Operations" title="Plant Map" />
      <SourceIndicator source={source} loading={loading} detail={detail} />
      {hasData && levels ? (
        <div className="forge-page-stack">
          <p className="forge-page-lede">
            Hierarchy and live power for {activePlant.plantName}. Card positions are
            auto-laid out from your plant hierarchy.
          </p>
          <PlantSectionMap levels={levels} rootLevelId={rootLevelId} notes={notes} />
        </div>
      ) : (
        <EmptyUpstreamState
          title="No plant map data"
          detail="Connect plant telemetry to see department layout and live load."
        />
      )}
    </AppShell>
  );
}
