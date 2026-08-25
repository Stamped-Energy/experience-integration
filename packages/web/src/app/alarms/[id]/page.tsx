"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { AlarmFullCase } from "@/components/alarms/AlarmFullCase";
import { L2PointsDisclosure } from "@/components/evidence/L2PointsDisclosure";
import { EmptyUpstreamState, SourceIndicator } from "@/components/ui/SourceIndicator";
import { PageHead } from "@/components/ui/primitives";
import { AlarmListSkeleton } from "@/components/ui/PageSkeletons";
import { DEMO_SHELL_ROLE, connectionFixture } from "@/lib/plant-catalog";
import { bffUrl, type DataSource } from "@/lib/bff";
import { usePlant } from "@/lib/plant-context";
import type { Alarm } from "@/lib/types";
import type { EvidencePack } from "@/lib/evidence";
import type { EvidenceSample } from "@/fixtures/evidence-samples";

type CasePayload = {
  source?: string;
  alarm?: Alarm;
  evidence?: {
    pack: EvidencePack;
    sample?: EvidenceSample;
    series?: {
      assetId: string;
      metric: string;
      from: string;
      to: string;
      granularity: string;
      unit: string;
      points: Array<{ ts: string; value: number }>;
    };
  };
  asset?: {
    id: string;
    label: string;
    area?: string;
    loadPct?: number;
    kwhMtd?: number;
    pf?: number;
    mdContributionKva?: number;
  };
  links?: { evidenceHref?: string; prescriptionHref?: string };
};

export default function AlarmDetailPage() {
  const routeParams = useParams<{ id: string }>();
  const alarmId = typeof routeParams.id === "string" ? routeParams.id : "";
  const { activePlant, plants, setActivePlantId } = usePlant();
  const [source, setSource] = useState<DataSource>("unavailable");
  const [payload, setPayload] = useState<CasePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    if (!alarmId) return;
    let cancelled = false;
    setLoading(true);
    void fetch(
      bffUrl(
        `/api/cases/alarm/${encodeURIComponent(alarmId)}?plantId=${encodeURIComponent(activePlant.plantId)}`,
      ),
      { credentials: "include", cache: "no-store" },
    )
      .then(async (res) => {
        if (!res.ok) throw new Error(`case ${res.status}`);
        return (await res.json()) as CasePayload;
      })
      .then((body) => {
        if (cancelled) return;
        setPayload(body);
        setSource(
          body.source === "l5+l2" || body.source === "l5" ? "l5" : "unavailable",
        );
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setDetail(err instanceof Error ? err.message : "Unavailable");
          setSource("unavailable");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activePlant.plantId, alarmId]);

  return (
    <AppShell
      active="alarms"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      plants={plants.map((p) => ({ id: p.plantId, name: p.plantName }))}
      onPlantChange={setActivePlantId}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Alarm"
      contextSummary={[alarmId, activePlant.plantName]}
      criticalAlarmCount={0}
    >
      <PageHead
        eyebrow="Alarm"
        title={loading ? alarmId : (payload?.alarm?.summary ?? alarmId)}
      />
      <SourceIndicator source={source} loading={loading} detail={detail} />
      {loading ? (
        <AlarmListSkeleton />
      ) : payload?.alarm && payload.evidence?.pack ? (
        <div className="forge-page-stack">
          <AlarmFullCase
            alarm={payload.alarm}
            pack={payload.evidence.pack}
            evidenceSample={payload.evidence.sample}
            evidenceHref={payload.links?.evidenceHref}
            prescriptionHref={payload.links?.prescriptionHref}
            asset={
              payload.asset
                ? {
                    id: payload.asset.id,
                    label: payload.asset.label,
                    area: payload.asset.area ?? "Plant",
                    loadPct: payload.asset.loadPct ?? 0,
                    health: "watch" as const,
                    kwhMtd: payload.asset.kwhMtd ?? 0,
                    pf: payload.asset.pf,
                    mdContributionKva: payload.asset.mdContributionKva,
                  }
                : undefined
            }
          />
          <L2PointsDisclosure series={payload.evidence.series} />
        </div>
      ) : (
        <EmptyUpstreamState
          title="Alarm case unavailable"
          detail="Live case requires L5 alarm + linked prescription evidence via GET /api/cases/alarm/:id."
        />
      )}
    </AppShell>
  );
}
