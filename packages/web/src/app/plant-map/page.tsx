"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyUpstreamState, SourceIndicator } from "@/components/ui/SourceIndicator";
import { PageHead } from "@/components/ui/primitives";
import { DEMO_SHELL_ROLE, connectionFixture } from "@/lib/plant-catalog";
import { bffUrl, type DataSource } from "@/lib/bff";
import { usePlant } from "@/lib/plant-context";

export default function PlantMapPage() {
  const { activePlant, plants, setActivePlantId } = usePlant();
  const [source, setSource] = useState<DataSource>("unavailable");
  const [loading, setLoading] = useState(true);
  const [graph, setGraph] = useState<Record<string, unknown> | null>(null);
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setGraph(null);
    setSource("unavailable");
    setDetail(null);
    void fetch(
      bffUrl(
        `/api/l2/department-graph?plantId=${encodeURIComponent(activePlant.plantId)}`,
      ),
      { credentials: "include", cache: "no-store" },
    )
      .then(async (res) => {
        if (!res.ok) throw new Error(`department-graph ${res.status}`);
        return (await res.json()) as {
          data?: Record<string, unknown>;
          source?: string;
        };
      })
      .then((body) => {
        if (cancelled) return;
        if (body.source === "l2") {
          setGraph(body.data ?? null);
          setSource("l2");
        } else {
          setSource("unavailable");
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setDetail(err instanceof Error ? err.message : "Graph unavailable");
          setSource("unavailable");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activePlant.plantId]);

  return (
    <AppShell
      active="plant_map"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      plants={plants.map((p) => ({ id: p.plantId, name: p.plantName }))}
      onPlantChange={setActivePlantId}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Plant Map"
      contextSummary={[
        source === "l2" ? "Department graph from L2" : "No department graph",
        activePlant.plantName,
      ]}
      criticalAlarmCount={0}
    >
      <PageHead eyebrow="Operations" title="Plant Map" />
      <SourceIndicator source={source} loading={loading} detail={detail} />
      {source === "l2" && graph ? (
        <div className="forge-page-stack">
          <pre
            style={{
              fontSize: 12,
              overflow: "auto",
              padding: 12,
              background: "var(--forge-surface-container)",
              borderRadius: 8,
            }}
          >
            {JSON.stringify(graph, null, 2)}
          </pre>
          <EmptyUpstreamState
            title="Geometry / flow edges"
            detail="L2 has hierarchy only — no x/y layout. Fixture PlantSectionMap removed."
          />
        </div>
      ) : (
        <EmptyUpstreamState
          title="No plant map data"
          detail="L2 department-graph is empty for this plant. Fixture section map removed."
        />
      )}
    </AppShell>
  );
}
