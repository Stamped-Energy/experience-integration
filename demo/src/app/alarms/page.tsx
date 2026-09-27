"use client";

import { useEffect, useState } from "react";
import { AlarmConsole } from "@/components/alarms/AlarmConsole";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyUpstreamState, SourceIndicator } from "@/components/ui/SourceIndicator";
import { AlarmListSkeleton } from "@/components/ui/PageSkeletons";
import { PageHead } from "@/components/ui/primitives";
import { bffUrl, type DataSource } from "@/lib/bff";
import { DEMO_DATA_SOURCE, getDemoAlarms } from "@/lib/demo-data";
import { useProductShell } from "@/lib/product-shell";
import type { Alarm } from "@/lib/types";

export default function AlarmsPage() {
  const {
    activePlant,
    plants,
    onPlantChange,
    role,
    connection,
    isDemoSession,
  } = useProductShell();
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [source, setSource] = useState<DataSource>("unavailable");
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    if (isDemoSession) {
      setAlarms(getDemoAlarms());
      setSource(DEMO_DATA_SOURCE);
      setLoading(false);
      setDetail(null);
      return;
    }

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
                ? "Sign in to load alarms."
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
          setDetail(body.detail ?? "Alarm data unavailable");
        } else {
          setAlarms([]);
          setSource("unavailable");
          setDetail("Connect operations workflow to load alarms");
        }
        setLoading(false);
      } catch {
        if (!cancelled) {
          setDetail("Unable to reach server");
          setLoading(false);
        }
      }
    }
    void loadLive();
    return () => {
      cancelled = true;
    };
  }, [activePlant.plantId, isDemoSession]);

  const critical = alarms.filter(
    (a) => a.severity === "critical" && a.state !== "cleared",
  ).length;
  const open = alarms.filter((a) => a.state !== "cleared").length;
  const hasData = source === "l5" || source === "preview";

  return (
    <AppShell
      active="alarms"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      plants={plants}
      onPlantChange={onPlantChange}
      role={role}
      connection={connection}
      screenTitle="Alarm console"
      contextSummary={[
        `${open} open · ${critical} critical`,
        hasData ? "Alarms loaded" : "No alarm data",
      ]}
      focusEntity={alarms[0] ? { type: "alarm", id: alarms[0].id } : undefined}
      criticalAlarmCount={critical}
    >
      <PageHead eyebrow="Operations" title="Alarm console" />
      <SourceIndicator source={source} loading={loading} detail={detail} />
      {loading ? (
        <AlarmListSkeleton />
      ) : hasData ? (
        alarms.length > 0 ? (
          <AlarmConsole key={`${activePlant.plantId}:${source}`} initial={alarms} />
        ) : (
          <EmptyUpstreamState
            title="No alarms for this plant"
            detail="No open alarms for this plant right now."
          />
        )
      ) : (
        <EmptyUpstreamState
          title="No alarm data"
          detail="Alarm data is not available. Check your plant connection or sign in again."
        />
      )}
    </AppShell>
  );
}
