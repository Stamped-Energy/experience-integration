"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyUpstreamState, SourceIndicator } from "@/components/ui/SourceIndicator";
import { PageHead } from "@/components/ui/primitives";
import { DEMO_SHELL_ROLE, connectionFixture } from "@/lib/plant-catalog";
import { bffUrl, type DataSource } from "@/lib/bff";
import { usePlant } from "@/lib/plant-context";

export default function EnergyPage() {
  const { activePlant, plants, setActivePlantId } = usePlant();
  const [source, setSource] = useState<DataSource>("unavailable");
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState<unknown[]>([]);
  const [tariff, setTariff] = useState<Record<string, unknown> | null>(null);
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const plantId = encodeURIComponent(activePlant.plantId);
    Promise.all([
      fetch(bffUrl(`/api/l2/bills?plantId=${plantId}`), { credentials: "include" }),
      fetch(bffUrl(`/api/l2/tariff?plantId=${plantId}`), { credentials: "include" }),
    ])
      .then(async ([billsRes, tariffRes]) => {
        if (cancelled) return;
        let ok = false;
        if (billsRes.ok) {
          const body = (await billsRes.json()) as {
            data?: { bills?: unknown[] };
            source?: string;
          };
          if (body.source === "l2") {
            setBills(body.data?.bills ?? []);
            ok = true;
          }
        }
        if (tariffRes.ok) {
          const body = (await tariffRes.json()) as {
            data?: Record<string, unknown>;
            source?: string;
          };
          if (body.source === "l2") {
            setTariff(body.data ?? null);
            ok = true;
          }
        }
        setSource(ok ? "l2" : "unavailable");
        if (!ok) setDetail("L2 bills/tariff unavailable");
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setSource("unavailable");
          setDetail("BFF unreachable");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activePlant.plantId]);

  return (
    <AppShell
      active="energy"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      plants={plants.map((p) => ({ id: p.plantId, name: p.plantName }))}
      onPlantChange={setActivePlantId}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Energy Analytics"
      contextSummary={[
        source === "l2" ? `${bills.length} bills from L2` : "No L2 bills",
        tariff ? "Tariff loaded" : "No tariff",
        activePlant.plantName,
      ]}
      criticalAlarmCount={0}
    >
      <PageHead eyebrow="Analytics" title="Energy Analytics" />
      <SourceIndicator source={source} loading={loading} detail={detail} />
      {source === "l2" ? (
        <div className="forge-page-stack">
          <p className="forge-page-lede">
            {bills.length} bill(s) from L2
            {tariff?.cmd_kva != null ? ` · CMD ${String(tariff.cmd_kva)} kVA` : ""}
          </p>
          <EmptyUpstreamState
            title="Source mix / renewable share"
            detail="No generation or source-mix table in L2 — chart stays empty."
          />
          <EmptyUpstreamState
            title="Full analytics charts"
            detail="PF trend, heatmap, and feeder charts will render from L2 measurements once series widgets are wired. Fixture EnergyBoard datasets have been removed."
          />
        </div>
      ) : (
        <EmptyUpstreamState
          title="No energy analytics data"
          detail="L2 bills and tariff are required. Fixture EnergyBoard has been removed."
        />
      )}
    </AppShell>
  );
}
