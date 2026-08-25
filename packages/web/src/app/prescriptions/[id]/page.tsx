"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { PrescriptionFullCase } from "@/components/prescriptions/PrescriptionFullCase";
import { L2PointsDisclosure } from "@/components/evidence/L2PointsDisclosure";
import { EmptyUpstreamState, SourceIndicator } from "@/components/ui/SourceIndicator";
import { PageHead } from "@/components/ui/primitives";
import { OverviewBoardSkeleton } from "@/components/ui/PageSkeletons";
import { DEMO_SHELL_ROLE, connectionFixture } from "@/lib/plant-catalog";
import { bffUrl, type DataSource } from "@/lib/bff";
import { usePlant } from "@/lib/plant-context";
import type { Alarm, Prescription, PrescriptionCaseDetail } from "@/lib/types";
import type { EvidencePack } from "@/lib/evidence";
import type { EvidenceSample } from "@/fixtures/evidence-samples";

type CasePayload = {
  source?: string;
  prescription?: Prescription;
  alarm?: Alarm;
  caseDetail?: PrescriptionCaseDetail;
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
    downloadHref?: string;
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
  links?: { evidenceHref?: string };
};

export default function PrescriptionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { activePlant, plants, setActivePlantId } = usePlant();
  const [source, setSource] = useState<DataSource>("unavailable");
  const [payload, setPayload] = useState<CasePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetch(
      bffUrl(
        `/api/cases/prescription/${encodeURIComponent(params.id)}?plantId=${encodeURIComponent(activePlant.plantId)}`,
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
  }, [activePlant.plantId, params.id]);

  const rx = payload?.prescription
    ? {
        ...payload.prescription,
        caseDetail: payload.caseDetail ?? payload.prescription.caseDetail,
        actions:
          payload.prescription.actions ??
          payload.caseDetail?.commissioning ??
          undefined,
      }
    : null;

  return (
    <AppShell
      active="prescriptions"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      plants={plants.map((p) => ({ id: p.plantId, name: p.plantName }))}
      onPlantChange={setActivePlantId}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Prescription"
      contextSummary={[params.id, activePlant.plantName]}
      criticalAlarmCount={0}
    >
      <PageHead
        eyebrow="Prescription"
        title={loading ? params.id : (rx?.title ?? params.id)}
      />
      <SourceIndicator source={source} loading={loading} detail={detail} />
      {loading ? (
        <OverviewBoardSkeleton />
      ) : rx && payload?.evidence?.pack ? (
        <div className="forge-page-stack">
          <PrescriptionFullCase
            rx={rx}
            pack={payload.evidence.pack}
            alarm={payload.alarm}
            evidenceSample={payload.evidence.sample}
            evidenceHref={payload.links?.evidenceHref}
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
          {payload.evidence.downloadHref ? (
            <p style={{ fontSize: 13 }}>
              <a href={bffUrl(payload.evidence.downloadHref)} target="_blank" rel="noreferrer">
                Download L5 evidence ZIP
              </a>
            </p>
          ) : null}
        </div>
      ) : (
        <EmptyUpstreamState
          title="Prescription case unavailable"
          detail="Live case requires L5 detail + optional L2 series via GET /api/cases/prescription/:id."
        />
      )}
    </AppShell>
  );
}
