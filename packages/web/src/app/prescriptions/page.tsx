"use client";

import { useEffect, useState } from "react";
import { PrescriptionQueue } from "@/components/prescriptions/PrescriptionQueue";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyUpstreamState, SourceIndicator } from "@/components/ui/SourceIndicator";
import { PrescriptionQueueSkeleton } from "@/components/ui/PageSkeletons";
import { PageHead } from "@/components/ui/primitives";
import { bffUrl, type DataSource } from "@/lib/bff";
import { DEMO_DATA_SOURCE, getDemoPrescriptions } from "@/lib/demo-data";
import { formatInr } from "@/lib/format";
import { useProductShell } from "@/lib/product-shell";
import type { Prescription } from "@/lib/types";

export default function PrescriptionsPage() {
  const {
    activePlant,
    plants,
    onPlantChange,
    role,
    connection,
    isDemoSession,
  } = useProductShell();
  const [rows, setRows] = useState<Prescription[]>([]);
  const [source, setSource] = useState<DataSource>("unavailable");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (isDemoSession) {
      setRows(getDemoPrescriptions());
      setSource(DEMO_DATA_SOURCE);
      setLoading(false);
      setLoadError(null);
      return;
    }

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
          { credentials: "include", cache: "no-store" },
        );
        if (!res.ok) {
          if (!cancelled) {
            setLoadError(
              res.status === 401
                ? "Sign in to load prescriptions."
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
          setLoadError(body.detail ?? "Prescription data unavailable");
        } else {
          setRows([]);
          setSource("unavailable");
          setLoadError("Connect operations workflow to load prescriptions");
        }
      } catch {
        if (!cancelled) {
          setLoadError("Unable to reach server.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadLive();
    return () => {
      cancelled = true;
    };
  }, [activePlant.plantId, isDemoSession]);

  const needsReview = rows.filter((p) => p.lane === "needs_review");
  const needsReviewInr = needsReview.reduce(
    (s, p) => s + p.impactInrPerMonth,
    0,
  );
  const hasData = source === "l5" || source === "preview";

  const contextLine = loading
    ? "Loading prescriptions…"
    : hasData
      ? rows.length === 0
        ? "Prescriptions · none yet"
        : "Prescriptions loaded"
      : "No prescription data";

  return (
    <AppShell
      active="prescriptions"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      plants={plants}
      onPlantChange={onPlantChange}
      role={role}
      connection={connection}
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
      {loading ? (
        <PrescriptionQueueSkeleton />
      ) : hasData ? (
        rows.length > 0 ? (
          <PrescriptionQueue
            key={`${activePlant.plantId}:${source}:${loading}`}
            initial={rows}
            loadError={loadError}
          />
        ) : (
          <EmptyUpstreamState
            title="No prescriptions for this plant"
            detail="No prescriptions queued for this plant right now."
          />
        )
      ) : (
        <EmptyUpstreamState
          title="No prescription data"
          detail="Prescription data is not available. Check your plant connection or sign in again."
        />
      )}
    </AppShell>
  );
}
