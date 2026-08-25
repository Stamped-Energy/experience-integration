"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyUpstreamState, SourceIndicator } from "@/components/ui/SourceIndicator";
import { PageHead } from "@/components/ui/primitives";
import { PrescriptionQueueSkeleton } from "@/components/ui/PageSkeletons";
import { DEMO_SHELL_ROLE, connectionFixture } from "@/lib/plant-catalog";
import { bffUrl, type DataSource } from "@/lib/bff";
import { usePlant } from "@/lib/plant-context";
import type { Prescription } from "@/lib/types";

function EvidenceIndexInner() {
  const { activePlant, plants, setActivePlantId } = usePlant();
  const search = useSearchParams();
  const rxId = search.get("rxId");
  const [source, setSource] = useState<DataSource>("unavailable");
  const [rows, setRows] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    if (rxId) {
      // Redirect-style: load by-rx and send user to evidence detail id
      let cancelled = false;
      setLoading(true);
      void fetch(
        bffUrl(
          `/api/evidence/by-rx?rxId=${encodeURIComponent(rxId)}&plantId=${encodeURIComponent(activePlant.plantId)}`,
        ),
        { credentials: "include", cache: "no-store" },
      )
        .then(async (res) => {
          if (!res.ok) throw new Error(`evidence ${res.status}`);
          return (await res.json()) as {
            evidence?: { sample?: { id: string }; bundleId?: string };
            links?: { evidenceHref?: string };
          };
        })
        .then((body) => {
          if (cancelled) return;
          const href =
            body.links?.evidenceHref ??
            (rxId ? `/evidence/evd_${rxId}` : null) ??
            (body.evidence?.sample?.id?.startsWith("evd_")
              ? `/evidence/${body.evidence.sample.id}`
              : null);
          if (href && !href.includes("/eb-")) {
            window.location.replace(href);
            return;
          }
          if (rxId) {
            window.location.replace(`/evidence/evd_${rxId}`);
            return;
          }
          setDetail("No evidence sample for this prescription");
          setSource("unavailable");
          setLoading(false);
        })
        .catch((err) => {
          if (!cancelled) {
            setDetail(err instanceof Error ? err.message : "Unavailable");
            setLoading(false);
          }
        });
      return () => {
        cancelled = true;
      };
    }

    let cancelled = false;
    setLoading(true);
    void fetch(
      bffUrl(`/api/prescriptions?plantId=${encodeURIComponent(activePlant.plantId)}`),
      { credentials: "include", cache: "no-store" },
    )
      .then(async (res) => {
        if (!res.ok) throw new Error(`prescriptions ${res.status}`);
        return (await res.json()) as { items?: Prescription[]; source?: string };
      })
      .then((body) => {
        if (cancelled) return;
        setRows(Array.isArray(body.items) ? body.items : []);
        setSource(body.source === "l5" ? "l5" : "unavailable");
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
  }, [activePlant.plantId, rxId]);

  const withEvidence = useMemo(
    () => rows.filter((r) => (r.evidenceRefs?.length ?? 0) > 0 || r.id),
    [rows],
  );

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
      contextSummary={["Evidence cases", activePlant.plantName]}
      criticalAlarmCount={0}
    >
      <PageHead eyebrow="Operations" title="Evidence" />
      <SourceIndicator source={source} loading={loading} detail={detail} />
      {loading ? (
        <PrescriptionQueueSkeleton count={3} />
      ) : source === "l5" && withEvidence.length > 0 ? (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
          {withEvidence.map((rx) => (
            <li key={rx.id} className="forge-panel" style={{ padding: 14 }}>
              <Link href={`/evidence/evd_${rx.id}`} style={{ fontWeight: 600 }}>
                {rx.title}
              </Link>
              <p style={{ margin: "6px 0 0", fontSize: 13, opacity: 0.8 }}>{rx.why}</p>
              <p style={{ margin: "8px 0 0", fontSize: 12 }}>
                <Link href={`/prescriptions/${rx.id}`}>Open full case</Link>
                {" · "}
                <Link href={`/evidence/evd_${rx.id}`}>Evidence detail</Link>
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyUpstreamState
          title="No evidence for this plant"
          detail="Prescriptions with evidence will appear here once operations data is connected."
        />
      )}
    </AppShell>
  );
}

export default function EvidencePage() {
  return (
    <Suspense fallback={<div className="forge-page-stack">Loading evidence…</div>}>
      <EvidenceIndexInner />
    </Suspense>
  );
}
