"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyUpstreamState, SourceIndicator } from "@/components/ui/SourceIndicator";
import { PageHead, Skeleton } from "@/components/ui/primitives";
import { DEMO_SHELL_ROLE, connectionFixture } from "@/lib/plant-catalog";
import { bffUrl, type DataSource } from "@/lib/bff";
import { formatInr } from "@/lib/format";
import { usePlant } from "@/lib/plant-context";

function asString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}

function asNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function narrativeFrom(item: Record<string, unknown>) {
  const impact =
    item.impact && typeof item.impact === "object"
      ? (item.impact as Record<string, unknown>)
      : {};
  const evidence = Array.isArray(item.evidence_refs)
    ? item.evidence_refs.filter((x): x is string => typeof x === "string")
    : Array.isArray(item.evidenceRefs)
      ? item.evidenceRefs.filter((x): x is string => typeof x === "string")
      : [];
  return {
    title:
      asString(item.what) ??
      asString(item.title) ??
      asString(item.action) ??
      asString(item.id) ??
      "Prescription",
    why: asString(item.why) ?? asString(item.reason) ?? asString(item.description) ?? "",
    who:
      asString(item.who_label) ??
      asString(item.whoLabel) ??
      asString(item.who) ??
      asString(item.owner_role) ??
      "—",
    when: asString(item.due_label) ?? asString(item.dueLabel) ?? asString(item.when) ?? "—",
    effort: asString(item.effort) ?? "—",
    billLine: asString(item.bill_line) ?? asString(item.billLine) ?? "—",
    status: asString(item.status) ?? "—",
    impactInr:
      asNumber(item.impact_inr_per_month) ??
      asNumber(item.impactInrPerMonth) ??
      asNumber(impact.inr_monthly) ??
      null,
    evidence,
  };
}

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
  const [showRaw, setShowRaw] = useState(false);

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

  const narrative = useMemo(
    () => (item ? narrativeFrom(item) : null),
    [item],
  );

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
      <PageHead
        eyebrow="Prescription"
        title={loading ? params.id : (narrative?.title ?? params.id)}
      />
      <SourceIndicator source={source} loading={loading} detail={detail} />
      {loading ? (
        <div className="forge-page-stack" aria-busy="true" aria-label="Loading prescription">
          <Skeleton height={28} width="70%" />
          <Skeleton height={72} />
          <Skeleton height={48} />
          <Skeleton height={120} />
        </div>
      ) : source === "l5" && narrative ? (
        <div className="forge-page-stack">
          <section className="forge-panel" style={{ padding: 16 }}>
            <p className="forge-page-lede" style={{ marginBottom: 12 }}>
              {narrative.why || "No why narrative on this prescription yet."}
            </p>
            <dl
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 12,
                margin: 0,
              }}
            >
              <div>
                <dt style={{ fontSize: 12, opacity: 0.7 }}>Who</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>{narrative.who}</dd>
              </div>
              <div>
                <dt style={{ fontSize: 12, opacity: 0.7 }}>When</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>{narrative.when}</dd>
              </div>
              <div>
                <dt style={{ fontSize: 12, opacity: 0.7 }}>Effort</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>{narrative.effort}</dd>
              </div>
              <div>
                <dt style={{ fontSize: 12, opacity: 0.7 }}>Status</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>{narrative.status}</dd>
              </div>
              <div>
                <dt style={{ fontSize: 12, opacity: 0.7 }}>Impact</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>
                  {narrative.impactInr != null
                    ? `${formatInr(narrative.impactInr)}/mo`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt style={{ fontSize: 12, opacity: 0.7 }}>Bill line</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>{narrative.billLine}</dd>
              </div>
            </dl>
          </section>

          <section className="forge-panel" style={{ padding: 16 }}>
            <h2 style={{ fontSize: 14, margin: "0 0 8px" }}>Evidence refs</h2>
            {narrative.evidence.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {narrative.evidence.map((ref) => (
                  <li key={ref} style={{ fontSize: 13, fontFamily: "var(--forge-font-mono, monospace)" }}>
                    {ref}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0, fontSize: 13, opacity: 0.75 }}>
                No evidence_refs on this snapshot. ZIP download still available from the evidence API when a bundle exists.
              </p>
            )}
          </section>

          <button
            type="button"
            className="forge-btn forge-btn--ghost"
            onClick={() => setShowRaw((v) => !v)}
          >
            {showRaw ? "Hide raw JSON" : "Show raw JSON"}
          </button>
          {showRaw && item ? (
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
          ) : null}
        </div>
      ) : (
        <EmptyUpstreamState
          title="Prescription case fixtures removed"
          detail="Live case data comes from L5 GET /api/prescriptions/:id. Seed Vinayak via scripts/seed_vinayak_l5_prescriptions.py."
        />
      )}
    </AppShell>
  );
}
