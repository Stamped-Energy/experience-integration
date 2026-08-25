"use client";

import { useEffect, useState } from "react";
import { PrescriptionQueue } from "@/components/prescriptions/PrescriptionQueue";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyUpstreamState, SourceIndicator } from "@/components/ui/SourceIndicator";
import { PageHead } from "@/components/ui/primitives";
import { DEMO_SHELL_ROLE, connectionFixture } from "@/lib/plant-catalog";
import { bffUrl, type DataSource } from "@/lib/bff";
import { formatInr } from "@/lib/format";
import { usePlant } from "@/lib/plant-context";
import type { Prescription } from "@/lib/types";

export default function PrescriptionsPage() {
  const { activePlant, plants, setActivePlantId } = usePlant();
  const [rows, setRows] = useState<Prescription[]>([]);
  const [source, setSource] = useState<DataSource>("unavailable");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRows([]);
    setSource("unavailable");
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
                : `Could not load prescriptions (${res.status}).`,
            );
          }
          return;
        }
        const body = (await res.json()) as {
          items?: Prescription[];
          source?: string;
          detail?: string;
        };
        if (cancelled) return;
        if (body.source === "l5") {
          setRows(Array.isArray(body.items) ? body.items : []);
          setSource("l5");
        } else if (body.source === "unavailable") {
          setRows([]);
          setSource("unavailable");
          setLoadError(body.detail ?? "L5 unavailable");
        } else {
          setRows([]);
          setSource("unavailable");
          setLoadError("Fixture prescriptions suppressed — connect L5");
        }
      } catch {
        if (!cancelled) {
          setLoadError("BFF unreachable.");
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

  const contextLine = loading
    ? "Loading prescriptions…"
    : source === "l5"
      ? rows.length === 0
        ? "Live from L5 · no prescriptions yet"
        : "Live from L5"
      : "No L5 prescriptions";

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
      criticalAlarmCount={0}
    >
      <PageHead eyebrow="Plant inbox" title="Prescriptions" />
      <SourceIndicator source={source} loading={loading} detail={loadError} />
      {source === "l5" ? (
        rows.length > 0 ? (
          <PrescriptionQueue
            key={`${activePlant.plantId}:${source}:${loading}`}
            initial={rows}
            loadError={loadError}
          />
        ) : (
          <EmptyUpstreamState
            title="No prescriptions for this plant"
            detail="L5 returned an empty list — run L3→L4→L5 for LNM to create prescriptions."
          />
        )
      ) : (
        <EmptyUpstreamState
          title="No prescription data"
          detail="L5 unreachable or strict-live empty. Fixture queue seed removed."
        />
      )}
    </AppShell>
  );
}
