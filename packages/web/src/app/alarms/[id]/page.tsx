"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyUpstreamState, SourceIndicator } from "@/components/ui/SourceIndicator";
import { PageHead } from "@/components/ui/primitives";
import { DEMO_SHELL_ROLE, connectionFixture } from "@/lib/plant-catalog";
import { bffUrl, type DataSource } from "@/lib/bff";
import { usePlant } from "@/lib/plant-context";

export default function AlarmDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { activePlant, plants, setActivePlantId } = usePlant();
  const [source, setSource] = useState<DataSource>("unavailable");
  const [alarm, setAlarm] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetch(
      bffUrl(`/api/alarms?plantId=${encodeURIComponent(activePlant.plantId)}`),
      { credentials: "include" },
    )
      .then(async (res) => {
        if (!res.ok) throw new Error(`alarms ${res.status}`);
        return (await res.json()) as { items?: Array<Record<string, unknown>>; source?: string };
      })
      .then((body) => {
        if (cancelled) return;
        const found = (body.items ?? []).find((a) => a.id === params.id) ?? null;
        setAlarm(found);
        setSource(body.source === "l5" ? "l5" : "unavailable");
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
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
      active="alarms"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      plants={plants.map((p) => ({ id: p.plantId, name: p.plantName }))}
      onPlantChange={setActivePlantId}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Alarm"
      contextSummary={[params.id, activePlant.plantName]}
      criticalAlarmCount={0}
    >
      <PageHead eyebrow="Alarm" title={params.id} />
      <SourceIndicator source={source} loading={loading} />
      {source === "l5" && alarm ? (
        <pre
          style={{
            fontSize: 12,
            overflow: "auto",
            padding: 12,
            background: "var(--forge-surface-container)",
            borderRadius: 8,
          }}
        >
          {JSON.stringify(alarm, null, 2)}
        </pre>
      ) : (
        <EmptyUpstreamState
          title="Alarm case fixtures removed"
          detail="Load alarms from L5. Full-case evidence packs require L5 evidence_bundle_id."
        />
      )}
    </AppShell>
  );
}
