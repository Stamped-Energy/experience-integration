"use client";

import { useEffect, useState } from "react";
import { AlarmConsole } from "@/components/alarms/AlarmConsole";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyUpstreamState, SourceIndicator } from "@/components/ui/SourceIndicator";
import { AlarmListSkeleton } from "@/components/ui/PageSkeletons";
import { PageHead } from "@/components/ui/primitives";
import { DEMO_SHELL_ROLE, connectionFixture } from "@/lib/plant-catalog";
import { bffUrl, type DataSource } from "@/lib/bff";
import { usePlant } from "@/lib/plant-context";
import type { Alarm } from "@/lib/types";

export default function AlarmsPage() {
  const { activePlant, plants, setActivePlantId } = usePlant();
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [source, setSource] = useState<DataSource>("unavailable");
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setAlarms([]);
    setSource("unavailable");
    setLoading(true);
    setDetail(null);

    async function loadLive() {
      try {
        const res = await fetch(
          bffUrl(`/api/alarms?plantId=${encodeURIComponent(activePlant.plantId)}`),
          { credentials: "include", cache: "no-store" },
        );
        if (!res.ok) {
          if (!cancelled) {
            setDetail(
              res.status === 401
                ? "Sign in to load alarms from L5."
                : `Alarms unavailable (${res.status})`,
            );
            setLoading(false);
          }
          return;
        }
        const body = (await res.json()) as {
          items?: Alarm[];
          source?: string;
          detail?: string;
        };
        if (cancelled) return;
        if (body.source === "l5") {
          setAlarms(Array.isArray(body.items) ? body.items : []);
          setSource("l5");
        } else if (body.source === "unavailable") {
          setAlarms([]);
          setSource("unavailable");
          setDetail(body.detail ?? "L5 unavailable");
        } else {
          // Strict live: ignore fixture payloads
          setAlarms([]);
          setSource("unavailable");
          setDetail("Fixture alarms suppressed — connect L5");
        }
        setLoading(false);
      } catch {
        if (!cancelled) {
          setDetail("BFF unreachable");
          setLoading(false);
        }
      }
    }
    void loadLive();
    return () => {
      cancelled = true;
    };
  }, [activePlant.plantId]);

  const critical = alarms.filter(
    (a) => a.severity === "critical" && a.state !== "cleared",
  ).length;
  const open = alarms.filter((a) => a.state !== "cleared").length;

  return (
    <AppShell
      active="alarms"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      plants={plants.map((p) => ({ id: p.plantId, name: p.plantName }))}
      onPlantChange={setActivePlantId}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Alarm console"
      contextSummary={[
        `${open} open · ${critical} critical`,
        source === "l5" ? "Live from L5" : "No L5 alarms",
      ]}
      focusEntity={alarms[0] ? { type: "alarm", id: alarms[0].id } : undefined}
      criticalAlarmCount={critical}
    >
      <PageHead eyebrow="Operations" title="Alarm console" />
      <SourceIndicator source={source} loading={loading} detail={detail} />
      {loading ? (
        <AlarmListSkeleton />
      ) : source === "l5" ? (
        alarms.length > 0 ? (
          <AlarmConsole key={`${activePlant.plantId}:${source}`} initial={alarms} />
        ) : (
          <EmptyUpstreamState
            title="No alarms for this plant"
            detail="L5 returned an empty list — run the L3→L4→L5 pipeline for LNM to raise alarms."
          />
        )
      ) : (
        <EmptyUpstreamState
          title="No alarm data"
          detail="L5 unreachable or strict-live empty. Fixture alarm console seed removed."
        />
      )}
    </AppShell>
  );
}
