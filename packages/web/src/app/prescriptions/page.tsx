"use client";

import { useEffect, useState } from "react";
import { PrescriptionQueue } from "@/components/prescriptions/PrescriptionQueue";
import { AppShell } from "@/components/shell/AppShell";
import { PageHead } from "@/components/ui/primitives";
import {
  DEMO_SHELL_ROLE,
  alarmsForPlant,
  connectionFixture,
  prescriptionsForPlant,
} from "@/fixtures/demo";
import { formatInr } from "@/lib/format";
import { usePlant } from "@/lib/plant-context";
import type { Prescription } from "@/lib/types";

function bffUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_BFF_URL;
  return base ? `${base}${path}` : path;
}

export default function PrescriptionsPage() {
  const { activePlant, plants, setActivePlantId } = usePlant();
  const [rows, setRows] = useState<Prescription[]>(() =>
    prescriptionsForPlant(activePlant.plantId),
  );
  const [source, setSource] = useState<"fixture" | "l5">("fixture");

  useEffect(() => {
    let cancelled = false;
    setRows(prescriptionsForPlant(activePlant.plantId));
    setSource("fixture");

    // Prefer the live BFF when a session cookie is present; offline/unauthenticated
    // requests fall through to the plant-scoped fixture set above.
    async function loadLive() {
      try {
        const res = await fetch(
          bffUrl(
            `/api/prescriptions?plantId=${encodeURIComponent(activePlant.plantId)}`,
          ),
          { credentials: "include" },
        );
        if (!res.ok) return;
        const body = (await res.json()) as { items?: Prescription[] };
        if (!cancelled && Array.isArray(body.items) && body.items.length > 0) {
          setRows(body.items);
          setSource("l5");
        }
      } catch {
        // BFF unreachable — keep fixture data
      }
    }
    void loadLive();
    return () => {
      cancelled = true;
    };
  }, [activePlant.plantId]);

  const needsReview = rows.filter((p) => p.lane === "needs_review");
  const needsReviewInr = needsReview.reduce(
    (s, p) => s + p.impactInrPerMonth,
    0,
  );
  const criticalAlarmCount = alarmsForPlant(activePlant.plantId).filter(
    (a) => a.severity === "critical" && a.state !== "cleared",
  ).length;

  return (
    <AppShell
      active="prescriptions"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      plants={plants.map((p) => ({ id: p.plantId, name: p.plantName }))}
      onPlantChange={setActivePlantId}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Prescription queue"
      contextSummary={[
        `${needsReview.length} need attention · ${formatInr(needsReviewInr)}/mo`,
        source === "l5" ? "Live from L5" : "Maintenance & management inbox",
      ]}
      focusEntity={rows[0] ? { type: "prescription", id: rows[0].id } : undefined}
      criticalAlarmCount={criticalAlarmCount}
    >
      <PageHead eyebrow="Plant inbox" title="Prescriptions" />
      <PrescriptionQueue key={`${activePlant.plantId}:${source}`} initial={rows} />
    </AppShell>
  );
}
