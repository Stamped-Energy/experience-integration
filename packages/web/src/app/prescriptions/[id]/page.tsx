"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyUpstreamState, SourceIndicator } from "@/components/ui/SourceIndicator";
import { PageHead } from "@/components/ui/primitives";
import { DEMO_SHELL_ROLE, connectionFixture } from "@/lib/plant-catalog";
import { bffUrl, type DataSource } from "@/lib/bff";
import { usePlant } from "@/lib/plant-context";

export default function PrescriptionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { activePlant, plants, setActivePlantId } = usePlant();
  const [source, setSource] = useState<DataSource>("unavailable");
  const [item, setItem] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetch(
      bffUrl(
        `/api/prescriptions/${encodeURIComponent(params.id)}?plantId=${encodeURIComponent(activePlant.plantId)}`,
      ),
      { credentials: "include", cache: "no-store" },
    )
      .then(async (res) => {
        if (!res.ok) throw new Error(`prescription ${res.status}`);
        return (await res.json()) as {
          item?: Record<string, unknown>;
          raw?: Record<string, unknown>;
          source?: string;
        };
      })
      .then((body) => {
        if (cancelled) return;
        setItem(body.raw ?? body.item ?? null);
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
  }, [activePlant.plantId, params.id]);

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
      <PageHead eyebrow="Prescription" title={params.id} />
      <SourceIndicator source={source} loading={loading} detail={detail} />
      {source === "l5" && item ? (
        <pre
          style={{
            fontSize: 12,
            overflow: "auto",
            padding: 12,
            background: "var(--forge-surface-container)",
            borderRadius: 8,
          }}
        >
          {JSON.stringify(item, null, 2)}
        </pre>
      ) : (
        <EmptyUpstreamState
          title="Prescription case fixtures removed"
          detail="Live case data comes from L5 GET /api/prescriptions/:id. Seed LNM via scripts/seed_lnm_l5_prescriptions.py."
        />
      )}
    </AppShell>
  );
}
