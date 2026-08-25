"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { EvidenceDetail } from "@/components/evidence/EvidenceDetail";
import { L2PointsDisclosure } from "@/components/evidence/L2PointsDisclosure";
import { EmptyUpstreamState, SourceIndicator } from "@/components/ui/SourceIndicator";
import { PageHead } from "@/components/ui/primitives";
import { PrescriptionQueueSkeleton } from "@/components/ui/PageSkeletons";
import { DEMO_SHELL_ROLE, connectionFixture } from "@/lib/plant-catalog";
import { bffUrl, type DataSource } from "@/lib/bff";
import { usePlant } from "@/lib/plant-context";
import type { EvidenceSample } from "@/fixtures/evidence-samples";

type CasePayload = {
  source?: string;
  prescription?: { id: string; title: string };
  evidence?: {
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
    missing?: string[];
    pack?: { missing?: string[] };
  };
  links?: {
    prescriptionHref?: string;
    alarmHref?: string;
    evidenceHref?: string;
  };
};

/** Map URL id → prescription id. Legacy eb-* bundle routes are not resolved. */
function rxIdFromEvidenceParam(id: string): string | null {
  if (id.startsWith("evd_")) return id.slice(4);
  if (id.startsWith("rx_")) return id;
  return null;
}

export default function EvidenceDetailPage() {
  const routeParams = useParams<{ id: string }>();
  const evidenceId = typeof routeParams.id === "string" ? routeParams.id : "";
  const { activePlant, plants, setActivePlantId } = usePlant();
  const [source, setSource] = useState<DataSource>("unavailable");
  const [payload, setPayload] = useState<CasePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<string | null>(null);

  const isLegacyBundleId = evidenceId.startsWith("eb-");
  const rxId = rxIdFromEvidenceParam(evidenceId);

  useEffect(() => {
    if (!evidenceId) return;
    if (isLegacyBundleId || !rxId) {
      setLoading(false);
      setSource("unavailable");
      setDetail(
        isLegacyBundleId
          ? "This URL uses an L5 bundle id. Open evidence via the prescription (evd_{rxId})."
          : "Unrecognized evidence id",
      );
      setPayload(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const url = bffUrl(
      `/api/evidence/by-rx?rxId=${encodeURIComponent(rxId)}&plantId=${encodeURIComponent(activePlant.plantId)}`,
    );

    void fetch(url, { credentials: "include", cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`evidence ${res.status}`);
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
  }, [activePlant.plantId, evidenceId, isLegacyBundleId, rxId]);

  const sample = payload?.evidence?.sample;
  const showBaseline = !(payload?.evidence?.pack?.missing ?? []).includes("baseline");

  return (
    <AppShell
      active="evidence"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      plants={plants.map((p) => ({ id: p.plantId, name: p.plantName }))}
      onPlantChange={setActivePlantId}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Evidence"
      contextSummary={[evidenceId, activePlant.plantName]}
      criticalAlarmCount={0}
    >
      <PageHead
        eyebrow="Evidence"
        title={loading ? evidenceId : (sample?.issueTitle ?? evidenceId)}
      />
      <SourceIndicator source={source} loading={loading} detail={detail} />
      {loading ? (
        <PrescriptionQueueSkeleton count={2} />
      ) : sample ? (
        <div className="forge-page-stack">
          <EvidenceDetail sample={sample} showBaselineBand={showBaseline} />
          <L2PointsDisclosure series={payload?.evidence?.series} />
          {payload?.evidence?.downloadHref ? (
            <p style={{ fontSize: 13 }}>
              <a
                href={bffUrl(payload.evidence.downloadHref)}
                target="_blank"
                rel="noreferrer"
              >
                Download L5 evidence ZIP
              </a>
            </p>
          ) : null}
          <p style={{ fontSize: 13, display: "flex", gap: 12, flexWrap: "wrap" }}>
            {payload?.links?.prescriptionHref ? (
              <Link href={payload.links.prescriptionHref}>Open prescription</Link>
            ) : null}
            {payload?.links?.alarmHref ? (
              <Link href={payload.links.alarmHref}>Open alarm</Link>
            ) : null}
            <Link href="/evidence">Evidence index</Link>
          </p>
        </div>
      ) : (
        <EmptyUpstreamState
          title={
            isLegacyBundleId
              ? "Legacy bundle URL"
              : "Evidence sample unavailable"
          }
          detail={
            isLegacyBundleId
              ? "Use /evidence/evd_{prescriptionId} or open Full evidence from the prescription case. Bundle ids are for ZIP download only."
              : "Open from a prescription with evidence_refs, or browse /evidence."
          }
        />
      )}
    </AppShell>
  );
}
