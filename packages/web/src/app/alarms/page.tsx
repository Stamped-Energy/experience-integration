"use client";

import { useEffect, useState } from "react";
import { AlarmConsole } from "@/components/alarms/AlarmConsole";
import { AppShell } from "@/components/shell/AppShell";
import { PageHead } from "@/components/ui/primitives";
import { DEMO_SHELL_ROLE, alarmsForPlant, connectionFixture } from "@/fixtures/demo";
import { usePlant } from "@/lib/plant-context";
import type { Alarm } from "@/lib/types";

function bffUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_BFF_URL;
  return base ? `${base}${path}` : path;
}

export default function AlarmsPage() {
  const { activePlant, plants, setActivePlantId } = usePlant();
  const [alarms, setAlarms] = useState<Alarm[]>(() =>
    alarmsForPlant(activePlant.plantId),
  );
  const [source, setSource] = useState<"fixture" | "l5">("fixture");

  useEffect(() => {
    let cancelled = false;
    setAlarms(alarmsForPlant(activePlant.plantId));
    setSource("fixture");

    // Prefer the live BFF when a session cookie is present; offline/unauthenticated
    // requests fall through to the plant-scoped fixture set above.
    async function loadLive() {
      try {
        const res = await fetch(
          bffUrl(`/api/alarms?plantId=${encodeURIComponent(activePlant.plantId)}`),
          { credentials: "include" },
        );
        if (!res.ok) return;
        const body = (await res.json()) as { items?: Alarm[] };
        if (!cancelled && Array.isArray(body.items) && body.items.length > 0) {
          setAlarms(body.items);
          setSource("l5");
        }
      } catch {
        // BFF unreachable - keep fixture data
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
        source === "l5" ? "Live from L5" : "Severity-first triage",
      ]}
      focusEntity={alarms[0] ? { type: "alarm", id: alarms[0].id } : undefined}
      criticalAlarmCount={critical}
    >
      <PageHead eyebrow="Operations" title="Alarm console" />
      <AlarmConsole key={`${activePlant.plantId}:${source}`} initial={alarms} />
    </AppShell>
  );
}
