"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { OverviewBoard } from "@/components/today/OverviewBoard";
import { EmptyUpstreamState, SourceIndicator } from "@/components/ui/SourceIndicator";
import { PageHead } from "@/components/ui/primitives";
import { DEMO_SHELL_ROLE, connectionFixture } from "@/lib/plant-catalog";
import { bffUrl, type DataSource } from "@/lib/bff";
import { formatInr } from "@/lib/format";
import { usePlant } from "@/lib/plant-context";
import type { OverviewLiveKpis } from "@/components/today/overview/KpiHeroStrip";

type OverviewResponse = {
  plantId: string;
  source: { l2: "l2" | "unavailable"; l5: "l5" | "unavailable" };
  generatedAt: string;
  confirmedSavingsMtdInr: number | null;
  closureRate30d: number | null;
  criticalAlarmCount: number | null;
  needsReviewCount: number | null;
  needsReviewInr: number | null;
  mdHeadroomPct: number | null;
  mdPeakKva: number | null;
  mdCmdKva: number | null;
  vsBaseline7dPct: number | null;
  telemetryFreshnessSec: number | null;
  totalEnergyKwhMtd: number | null;
  stampedSavingsMonthInr: number | null;
  aiScore: number | null;
  co2Tco2e: number | null;
  prescriptions: Array<{
    id: string;
    plantId: string;
    title: string;
    why: string;
    impactInrPerMonth: number;
    confidence: number;
    lane: string;
    ownerRole: string;
    dueAt: string;
  }>;
  detail: { l2?: string; l5?: string };
};

function overviewSource(data: OverviewResponse | null): DataSource {
  if (!data) return "unavailable";
  if (data.source.l2 === "l2" || data.source.l5 === "l5") {
    return data.source.l5 === "l5" ? "l5" : "l2";
  }
  return "unavailable";
}

export default function OverviewPage() {
  const { activePlant, plants, setActivePlantId } = usePlant();
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const url = bffUrl(
      `/api/overview?plantId=${encodeURIComponent(activePlant.plantId)}`,
    );
    void fetch(url, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`overview ${res.status}`);
        return (await res.json()) as OverviewResponse;
      })
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setData(null);
          setError(err instanceof Error ? err.message : "Overview unavailable");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activePlant.plantId]);

  const critical = data?.criticalAlarmCount ?? 0;
  const needsReviewInr = data?.needsReviewInr ?? 0;
  const source = overviewSource(data);

  const liveKpis: OverviewLiveKpis = {
    stampedSavingsMonthInr: data?.stampedSavingsMonthInr ?? null,
    totalEnergyKwhMtd: data?.totalEnergyKwhMtd ?? null,
    aiScore: data?.aiScore ?? null,
    co2Tco2e: data?.co2Tco2e ?? null,
    confirmedSavingsMtdInr: data?.confirmedSavingsMtdInr ?? null,
    closureRate30d: data?.closureRate30d ?? null,
    mdHeadroomPct: data?.mdHeadroomPct ?? null,
    mdPeakKva: data?.mdPeakKva ?? null,
    mdCmdKva: data?.mdCmdKva ?? null,
    vsBaseline7dPct: data?.vsBaseline7dPct ?? null,
    telemetryFreshnessSec: data?.telemetryFreshnessSec ?? null,
    needsReviewCount: data?.needsReviewCount ?? null,
    needsReviewInr: data?.needsReviewInr ?? null,
    criticalAlarmCount: data?.criticalAlarmCount ?? null,
  };

  return (
    <AppShell
      active="today"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      plants={plants.map((p) => ({ id: p.plantId, name: p.plantName }))}
      onPlantChange={setActivePlantId}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Overview"
      contextSummary={[
        `${critical} critical alarms`,
        `${formatInr(needsReviewInr)} open prescriptions`,
        activePlant.shift,
      ]}
      criticalAlarmCount={critical}
    >
      <PageHead eyebrow={activePlant.plantName} title="Overview" />
      <p className="forge-page-lede">
        {activePlant.contractDemandNote} · {activePlant.tariff}
      </p>
      <SourceIndicator
        source={source}
        loading={loading}
        detail={
          error ??
          ([data?.detail.l2, data?.detail.l5].filter(Boolean).join(" · ") || null)
        }
      />
      {source === "unavailable" && !loading ? (
        <EmptyUpstreamState
          title="No upstream data for overview"
          detail="Connect L2 and L5, then refresh. KPI tiles stay empty until live data arrives."
        />
      ) : (
        <OverviewBoard
          liveKpis={liveKpis}
          closurePct={data?.closureRate30d ?? null}
          alarms={[]}
          prescriptions={(data?.prescriptions ?? []) as never}
          assets={[]}
        />
      )}
    </AppShell>
  );
}
