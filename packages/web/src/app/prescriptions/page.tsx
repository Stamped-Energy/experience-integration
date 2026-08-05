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
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fixtureRows = prescriptionsForPlant(activePlant.plantId);
    setRows(fixtureRows);
    setSource("fixture");
    setLoading(true);
    setLoadError(null);

    async function loadLive() {
      try {
        const res = await fetch(
          bffUrl(
            `/api/prescriptions?plantId=${encodeURIComponent(activePlant.plantId)}`,
          ),
          { credentials: "include" },
        );
        if (!res.ok) {
          if (!cancelled) {
            setLoadError(
              res.status === 401
                ? "Sign in to load live prescriptions from L5."
                : "Could not load live prescriptions — showing demo data.",
            );
          }
          return;
        }
        const body = (await res.json()) as {
          items?: Prescription[];
          source?: "fixture" | "l5";
        };
        if (!cancelled) {
          if (Array.isArray(body.items)) {
            setRows(body.items);
            setSource(body.source === "l5" ? "l5" : "fixture");
          }
        }
      } catch {
        if (!cancelled) {
          setLoadError("BFF unreachable — showing demo prescriptions.");
        }
      } finally {
        if (!cancelled) setLoading(false);
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

  const contextLine =
    loading
      ? "Loading prescriptions…"
      : source === "l5"
        ? rows.length === 0
          ? "Live from L5 · no approved prescriptions yet"
          : "Live from L5"
        : "Maintenance & management inbox";

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
        contextLine,
      ]}
      focusEntity={rows[0] ? { type: "prescription", id: rows[0].id } : undefined}
      criticalAlarmCount={criticalAlarmCount}
    >
      <PageHead eyebrow="Plant inbox" title="Prescriptions" />
      <PrescriptionQueue
        key={`${activePlant.plantId}:${source}:${loading}`}
        initial={rows}
        loadError={loadError}
      />
    </AppShell>
  );
}
