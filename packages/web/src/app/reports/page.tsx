"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyUpstreamState, SourceIndicator } from "@/components/ui/SourceIndicator";
import { PageHead } from "@/components/ui/primitives";
import { KpiCard } from "@/components/ui/kpi-card";
import { ExportCentre } from "@/components/reports/ExportCentre";
import { SavingsLedger } from "@/components/ledger/SavingsLedger";
import { DEMO_SHELL_ROLE, connectionFixture } from "@/lib/plant-catalog";
import { bffUrl, type DataSource } from "@/lib/bff";
import { formatInr } from "@/lib/format";
import { ledgerEntriesFromPrescriptions } from "@/lib/ledger-from-prescriptions";
import { usePlant } from "@/lib/plant-context";
import type { Prescription } from "@/lib/types";

type OverviewLite = {
  confirmedSavingsMtdInr: number | null;
  stampedSavingsMonthInr: number | null;
  source: { l2: string; l5: string };
};

export default function ReportsPage() {
  const { activePlant, plants, setActivePlantId } = usePlant();
  const [overview, setOverview] = useState<OverviewLite | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [source, setSource] = useState<DataSource>("unavailable");
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setOverview(null);
    setPrescriptions([]);
    setSource("unavailable");
    setDetail(null);

    const plantQ = encodeURIComponent(activePlant.plantId);

    void Promise.all([
      fetch(bffUrl(`/api/overview?plantId=${plantQ}`), {
        credentials: "include",
        cache: "no-store",
      }).then(async (res) => {
        if (!res.ok) throw new Error(`overview ${res.status}`);
        return (await res.json()) as OverviewLite;
      }),
      fetch(bffUrl(`/api/prescriptions?plantId=${plantQ}`), {
        credentials: "include",
        cache: "no-store",
      }).then(async (res) => {
        if (!res.ok) throw new Error(`prescriptions ${res.status}`);
        const body = (await res.json()) as {
          items?: Prescription[];
          source?: string;
        };
        return body;
      }),
    ])
      .then(([ov, rxBody]) => {
        if (cancelled) return;
        setOverview(ov);
        const items = rxBody.items ?? [];
        setPrescriptions(items);
        const live =
          ov.source.l5 === "l5" ||
          ov.source.l2 === "l2" ||
          rxBody.source === "l5";
        setSource(live ? (ov.source.l5 === "l5" || rxBody.source === "l5" ? "l5" : "l2") : "unavailable");
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setSource("unavailable");
          setDetail(err instanceof Error ? err.message : "Reports unavailable");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activePlant.plantId]);

  const ledger = useMemo(
    () => ledgerEntriesFromPrescriptions(prescriptions),
    [prescriptions],
  );

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
        `${ledger.length} ledger rows from L5`,
        activePlant.plantName,
      ]}
      criticalAlarmCount={0}
    >
      <PageHead eyebrow="Value" title="Reports & ledger" />
      <SourceIndicator source={source} loading={loading} detail={detail} />
      <div className="forge-page-stack" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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

        {source === "unavailable" && !loading ? (
          <EmptyUpstreamState
            title="Reports unavailable"
            detail="Sign in with L2/L5 reachability to load ledger and report jobs."
          />
        ) : (
          <>
            <ExportCentre
              plantId={activePlant.plantId}
              plantName={activePlant.plantName}
              ledger={ledger}
              prescriptions={prescriptions}
            />
            <SavingsLedger rows={ledger} />
          </>
        )}
      </div>
    </AppShell>
  );
}
