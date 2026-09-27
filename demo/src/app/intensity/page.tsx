"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyUpstreamState, SourceIndicator } from "@/components/ui/SourceIndicator";
import { PageHead } from "@/components/ui/primitives";
import {
  SustainabilityDashboard,
  type SustainabilityBoardData,
} from "@/components/analytics/SustainabilityDashboard";
import { bffUrl, type DataSource } from "@/lib/bff";
import { DEMO_DATA_SOURCE, getDemoSustainabilityBoard } from "@/lib/demo-data";
import { useProductShell } from "@/lib/product-shell";

export default function IntensityPage() {
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
  const [board, setBoard] = useState<SustainabilityBoardData | null>(null);
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    if (isDemoSession) {
      setBoard(
        getDemoSustainabilityBoard(activePlant.plantName, activePlant.tariff ?? ""),
      );
      setSource(DEMO_DATA_SOURCE);
      setLoading(false);
      setDetail(null);
      return;
    }

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
  }, [activePlant.plantId, activePlant.plantName, activePlant.tariff, isDemoSession]);

  const hasData = source === "l2" || source === "preview";

  return (
    <AppShell
      active="intensity"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      plants={plants}
      onPlantChange={onPlantChange}
      role={role}
      connection={connection}
      screenTitle="Sustainability"
      contextSummary={[
        hasData ? "Sustainability metrics loaded" : "No sustainability data",
        activePlant.plantName,
      ]}
      criticalAlarmCount={0}
    >
      <PageHead eyebrow="Analytics" title="Sustainability" />
      <SourceIndicator source={source} loading={loading} detail={detail} />
      {hasData && board ? (
        <div className="forge-page-stack">
          <SustainabilityDashboard data={board} />
        </div>
      ) : (
        <EmptyUpstreamState
          title="No SEC / sustainability data"
          detail="Connect production and energy data to see specific energy consumption."
        />
      )}
    </AppShell>
  );
}
