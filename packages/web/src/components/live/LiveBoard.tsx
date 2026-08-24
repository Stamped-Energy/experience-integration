"use client";

import { useLiveTelemetry } from "@/hooks/useLiveTelemetry";
import type { ConnectionStatus } from "@/lib/types";
import type { LiveTelemetrySnapshot } from "@/lib/live-telemetry";
import { LiveAnomalyStrip, LiveStatusStrip } from "@/components/live/LiveStatusStrip";
import { DialBank } from "@/components/today/overview/DialBank";
import { PlantHealthMap } from "@/components/today/overview/PlantHealthMap";
import { AlertFeedPanel } from "@/components/today/overview/AlertFeedPanel";
import { DemandProfilePanel } from "@/components/today/overview/DemandProfilePanel";

export function LiveBoard({
  connection,
  overlay,
  jitter = true,
}: {
  connection: ConnectionStatus;
  /** When set (L2 live), replaces jittered fixture telemetry. */
  overlay?: LiveTelemetrySnapshot | null;
  jitter?: boolean;
}) {
  const live = useLiveTelemetry(connection.sse === "live" && jitter && !overlay);
  const snapshot = overlay ?? live;

  return (
    <div data-live-board className="forge-page-stack">
      <LiveStatusStrip
        connection={connection}
        syncAgeSec={snapshot.syncAgeSec}
        plantMw={snapshot.plantMw}
      />

      <LiveAnomalyStrip anomalies={snapshot.anomalies} />

      <DialBank dials={snapshot.dials} />

      <div className="forge-grid-60-40">
        <PlantHealthMap machines={snapshot.machines} />
        <DemandProfilePanel
          profile={snapshot.demandProfile}
          plantMw={snapshot.plantMw}
          peakMw={snapshot.peakMw}
          peakHour={snapshot.peakHour}
        />
      </div>

      <AlertFeedPanel alerts={snapshot.alerts} />
    </div>
  );
}
