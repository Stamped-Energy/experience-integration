"use client";

import { useEffect, useState } from "react";
import {
  MachineHealthBoard,
  type MachineHealthBoardData,
} from "@/components/equipment/MachineHealthBoard";
import { PlantHealthMap } from "@/components/today/overview/PlantHealthMap";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyUpstreamState, SourceIndicator } from "@/components/ui/SourceIndicator";
import { PageHead } from "@/components/ui/primitives";
import { DEMO_SHELL_ROLE, connectionFixture } from "@/lib/plant-catalog";
import { bffUrl, type DataSource } from "@/lib/bff";
import { usePlant } from "@/lib/plant-context";

type EquipmentApi = MachineHealthBoardData & {
  source?: string;
  detail?: string | null;
  mapMachines?: Array<{
    name: string;
    status: "CRITICAL" | "WARNING" | "GOOD" | "OPTIMIZED" | "OFFLINE" | "INFO";
    load: number;
    kwh: number | null;
    reason: string;
  }>;
  assets?: Array<{
    name: string;
    type: string;
    section: string;
    health: number | null;
    load: number | null;
    kwh30d: number | null;
    vib: null;
    temp: null;
    rpm: null;
    current: null;
    runtime: null;
    mtbf: null;
    status: MachineHealthBoardData["assets"][number]["status"];
    next: null;
  }>;
};

export default function EquipmentPage() {
  const { activePlant, plants, setActivePlantId } = usePlant();
  const [source, setSource] = useState<DataSource>("unavailable");
  const [loading, setLoading] = useState(true);
  const [board, setBoard] = useState<MachineHealthBoardData | null>(null);
  const [mapMachines, setMapMachines] = useState<
    NonNullable<EquipmentApi["mapMachines"]>
  >([]);
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setBoard(null);
    setMapMachines([]);
    setSource("unavailable");
    setDetail(null);
    void fetch(
      bffUrl(
        `/api/insights/equipment?plantId=${encodeURIComponent(activePlant.plantId)}`,
      ),
      { credentials: "include", cache: "no-store" },
    )
      .then(async (res) => {
        if (!res.ok) throw new Error(`insights/equipment ${res.status}`);
        return (await res.json()) as EquipmentApi;
      })
      .then((body) => {
        if (cancelled) return;
        if (body.source === "l2" && body.assets?.length) {
          setBoard({
            assets: body.assets.map((a) => ({
              name: a.name,
              type: a.type,
              section: a.section,
              health: a.health,
              load: a.load,
              kwh30d: a.kwh30d,
              vib: a.vib,
              temp: a.temp,
              rpm: a.rpm,
              current: a.current,
              runtime: a.runtime,
              mtbf: a.mtbf,
              status: a.status,
              next: a.next,
            })),
            kpis: body.kpis,
            healthDistribution: body.healthDistribution,
            derivedNotes: body.derivedNotes,
          });
          setMapMachines(body.mapMachines ?? []);
          setSource("l2");
          setDetail(body.detail ?? null);
        } else {
          setDetail(body.detail ?? "Equipment board unavailable");
          setSource("unavailable");
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setSource("unavailable");
          setDetail(err instanceof Error ? err.message : "Equipment unavailable");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activePlant.plantId]);

  return (
    <AppShell
      active="equipment"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      plants={plants.map((p) => ({ id: p.plantId, name: p.plantName }))}
      onPlantChange={setActivePlantId}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Machine Health"
      contextSummary={[
        source === "l2" ? "Live energy-derived health from L2" : "No equipment data",
        "Vibration/FFT Class D empty",
        activePlant.plantName,
      ]}
      criticalAlarmCount={0}
    >
      <PageHead eyebrow="Operations" title="Machine Health" />
      <SourceIndicator source={source} loading={loading} detail={detail} />
      {source === "l2" && board ? (
        <div className="forge-page-stack">
          {mapMachines.length > 0 ? (
            <PlantHealthMap machines={mapMachines} />
          ) : null}
          <MachineHealthBoard
            key={`${activePlant.plantId}:equipment`}
            data={board}
          />
        </div>
      ) : (
        <EmptyUpstreamState
          title="No equipment data"
          detail="Connect L2 to load the plant asset graph and power series. Fixture health fleets are not used."
        />
      )}
    </AppShell>
  );
}
