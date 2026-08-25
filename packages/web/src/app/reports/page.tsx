"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyUpstreamState, SourceIndicator } from "@/components/ui/SourceIndicator";
import { PageHead } from "@/components/ui/primitives";
import { KpiCard } from "@/components/ui/kpi-card";
import { DEMO_SHELL_ROLE, connectionFixture } from "@/lib/plant-catalog";
import { bffUrl, type DataSource } from "@/lib/bff";
import { formatInr } from "@/lib/format";
import { usePlant } from "@/lib/plant-context";

type OverviewLite = {
  confirmedSavingsMtdInr: number | null;
  stampedSavingsMonthInr: number | null;
  source: { l2: string; l5: string };
};

export default function ReportsPage() {
  const { activePlant, plants, setActivePlantId } = usePlant();
  const [overview, setOverview] = useState<OverviewLite | null>(null);
  const [source, setSource] = useState<DataSource>("unavailable");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetch(
      bffUrl(`/api/overview?plantId=${encodeURIComponent(activePlant.plantId)}`),
      { credentials: "include" },
    )
      .then(async (res) => {
        if (!res.ok) throw new Error(`overview ${res.status}`);
        return (await res.json()) as OverviewLite;
      })
      .then((body) => {
        if (cancelled) return;
        setOverview(body);
        setSource(
          body.source.l5 === "l5" || body.source.l2 === "l2" ? "l5" : "unavailable",
        );
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
  }, [activePlant.plantId]);

  const ops = overview?.confirmedSavingsMtdInr ?? null;

  return (
    <AppShell
      active="reports"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      plants={plants.map((p) => ({ id: p.plantId, name: p.plantName }))}
      onPlantChange={setActivePlantId}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Reports and ledger"
      contextSummary={[
        ops != null ? `Confirmed savings MTD ${formatInr(ops)}` : "No confirmed savings",
        activePlant.plantName,
      ]}
      criticalAlarmCount={0}
    >
      <PageHead eyebrow="Value" title="Reports & ledger" />
      <SourceIndicator source={source} loading={loading} />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="forge-kpi-strip">
          <KpiCard
            eyebrow="Confirmed savings (MTD)"
            value={ops != null ? formatInr(ops) : "—"}
            accent="primary"
          />
          <KpiCard
            eyebrow="Stamped savings (month)"
            value={
              overview?.stampedSavingsMonthInr != null
                ? formatInr(overview.stampedSavingsMonthInr)
                : "—"
            }
          />
        </div>
        <EmptyUpstreamState
          title="Report artifact HTML"
          detail="Report jobs use Postgres rows, but generated HTML is still fixture sustainability content — empty until a real template exists."
        />
        <EmptyUpstreamState
          title="Plant-level ledger table"
          detail="Per-Rx ledger_summary is on L5 detail; plant ledger list lands in Phase 3. Fixture SavingsLedger removed."
        />
      </div>
    </AppShell>
  );
}
