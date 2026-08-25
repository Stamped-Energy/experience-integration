"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyUpstreamState, SourceIndicator } from "@/components/ui/SourceIndicator";
import { PageHead } from "@/components/ui/primitives";
import {
  SustainabilityDashboard,
  type SustainabilityBoardData,
} from "@/components/analytics/SustainabilityDashboard";
import { DEMO_SHELL_ROLE, connectionFixture } from "@/lib/plant-catalog";
import { bffUrl, type DataSource } from "@/lib/bff";
import { usePlant } from "@/lib/plant-context";

export default function IntensityPage() {
  const { activePlant, plants, setActivePlantId } = usePlant();
  const [source, setSource] = useState<DataSource>("unavailable");
  const [loading, setLoading] = useState(true);
  const [board, setBoard] = useState<SustainabilityBoardData | null>(null);
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setBoard(null);
    setSource("unavailable");
    setDetail(null);
    void fetch(
      bffUrl(
        `/api/insights/sustainability?plantId=${encodeURIComponent(activePlant.plantId)}`,
      ),
      { credentials: "include", cache: "no-store" },
    )
      .then(async (res) => {
        if (!res.ok) throw new Error(`insights/sustainability ${res.status}`);
        return (await res.json()) as SustainabilityBoardData & {
          source?: string;
          detail?: string | null;
        };
      })
      .then((body) => {
        if (cancelled) return;
        if (body.source === "l2") {
          setBoard({
            ...body,
            plantName: activePlant.plantName,
            tariffLabel: activePlant.tariff ?? null,
          });
          setSource("l2");
          setDetail(body.detail ?? null);
        } else {
          setDetail(body.detail ?? "Sustainability board unavailable");
          setSource("unavailable");
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setSource("unavailable");
          setDetail(err instanceof Error ? err.message : "SEC unavailable");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activePlant.plantId, activePlant.plantName, activePlant.tariff]);

  return (
    <AppShell
      active="intensity"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      plants={plants.map((p) => ({ id: p.plantId, name: p.plantName }))}
      onPlantChange={setActivePlantId}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Sustainability"
      contextSummary={[
        source === "l2" ? "Live sustainability from L2" : "No sustainability data",
        activePlant.plantName,
      ]}
      criticalAlarmCount={0}
    >
      <PageHead eyebrow="Analytics" title="Sustainability" />
      <SourceIndicator source={source} loading={loading} detail={detail} />
      {source === "l2" && board ? (
        <div className="forge-page-stack">
          <SustainabilityDashboard data={board} />
        </div>
      ) : (
        <EmptyUpstreamState
          title="No SEC / sustainability data"
          detail="L2 SEC features and energy series are required. Fixture intensity dashboard is not used."
        />
      )}
    </AppShell>
  );
}
