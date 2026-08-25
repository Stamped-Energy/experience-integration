"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyUpstreamState, SourceIndicator } from "@/components/ui/SourceIndicator";
import { PageHead } from "@/components/ui/primitives";
import { EnergyBoard, type EnergyBoardData } from "@/components/analytics/EnergyBoard";
import { DEMO_SHELL_ROLE, connectionFixture } from "@/lib/plant-catalog";
import { bffUrl, type DataSource } from "@/lib/bff";
import { usePlant } from "@/lib/plant-context";

export default function EnergyPage() {
  const { activePlant, plants, setActivePlantId } = usePlant();
  const [source, setSource] = useState<DataSource>("unavailable");
  const [loading, setLoading] = useState(true);
  const [board, setBoard] = useState<EnergyBoardData | null>(null);
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setBoard(null);
    setSource("unavailable");
    setDetail(null);
    const plantId = encodeURIComponent(activePlant.plantId);
    fetch(bffUrl(`/api/insights/energy?plantId=${plantId}`), {
      credentials: "include",
      cache: "no-store",
    })
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          setDetail(`insights/energy ${res.status}`);
          setLoading(false);
          return;
        }
        const body = (await res.json()) as EnergyBoardData & {
          source?: string;
          detail?: string | null;
          cmdKva?: number | null;
        };
        if (body.source === "l2") {
          setBoard(body);
          setSource("l2");
          setDetail(body.detail ?? null);
        } else {
          setDetail(body.detail ?? "L2 energy board unavailable");
          setSource("unavailable");
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setSource("unavailable");
          setDetail("BFF unreachable");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activePlant.plantId]);

  return (
    <AppShell
      active="energy"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      plants={plants.map((p) => ({ id: p.plantId, name: p.plantName }))}
      onPlantChange={setActivePlantId}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Energy Analytics"
      contextSummary={[
        source === "l2" ? "Live energy board from L2" : "No L2 energy board",
        activePlant.plantName,
      ]}
      criticalAlarmCount={0}
    >
      <PageHead eyebrow="Analytics" title="Energy Analytics" />
      <SourceIndicator source={source} loading={loading} detail={detail} />
      {source === "l2" && board ? (
        <div className="forge-page-stack">
          <p className="forge-page-lede">
            Charts and KPIs from L2 bills, tariff, and measurements for {activePlant.plantName}.
          </p>
          <EnergyBoard data={board} />
        </div>
      ) : (
        <EmptyUpstreamState
          title="No energy analytics data"
          detail="L2 bills, tariff, or measurement series are required. Fixture EnergyBoard datasets are not used."
        />
      )}
    </AppShell>
  );
}
