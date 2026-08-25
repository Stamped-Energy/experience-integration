"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyUpstreamState, SourceIndicator } from "@/components/ui/SourceIndicator";
import { PageHead } from "@/components/ui/primitives";
import { DEMO_SHELL_ROLE, connectionFixture } from "@/lib/plant-catalog";
import { bffUrl, type DataSource } from "@/lib/bff";
import { usePlant } from "@/lib/plant-context";

export default function IntensityPage() {
  const { activePlant, plants, setActivePlantId } = usePlant();
  const [source, setSource] = useState<DataSource>("unavailable");
  const [loading, setLoading] = useState(true);
  const [sec, setSec] = useState<Record<string, unknown> | null>(null);
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSec(null);
    setSource("unavailable");
    setDetail(null);
    void fetch(
      bffUrl(
        `/api/l2/sec?plantId=${encodeURIComponent(activePlant.plantId)}&window=P30D`,
      ),
      { credentials: "include", cache: "no-store" },
    )
      .then(async (res) => {
        if (!res.ok) throw new Error(`sec ${res.status}`);
        return (await res.json()) as { data?: Record<string, unknown>; source?: string };
      })
      .then((body) => {
        if (cancelled) return;
        if (body.source === "l2") {
          setSec(body.data ?? null);
          setSource("l2");
        } else {
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
  }, [activePlant.plantId]);

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
        source === "l2" ? "SEC from L2" : "No SEC feature",
        activePlant.plantName,
      ]}
      criticalAlarmCount={0}
    >
      <PageHead eyebrow="Analytics" title="Sustainability" />
      <SourceIndicator source={source} loading={loading} detail={detail} />
      {source === "l2" && sec ? (
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
            {JSON.stringify(sec, null, 2)}
          </pre>
          <EmptyUpstreamState
            title="Plant CO₂ rollup"
            detail="No grid emission factor in L2/L5 — plant tCO₂e stays empty."
          />
        </div>
      ) : (
        <EmptyUpstreamState
          title="No SEC / sustainability data"
          detail="L2 features/sec is empty for this plant (LNM seed may not include SEC yet). Fixture intensity dashboard removed."
        />
      )}
    </AppShell>
  );
}
