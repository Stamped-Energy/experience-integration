"use client";

import { liveConnectionLabel } from "@/lib/format";
import type { ConnectionStatus } from "@/lib/types";
import { Activity, Clock } from "@/components/ui/icons";
import { Panel } from "@/components/ui/primitives";
import { useCountUp } from "@/hooks/useCountUp";
import { SeverityStrip } from "@/components/ui/indicators";
import type { LiveAnomalies } from "@/lib/live-telemetry";

export function LiveStatusStrip({
  connection,
  syncAgeSec,
  plantMw,
  pollLabel = "Live plant data · 1s refresh",
}: {
  connection: ConnectionStatus;
  syncAgeSec: number;
  plantMw: number;
  pollLabel?: string;
}) {
  const mw = useCountUp(plantMw, 600);
  const live = connection.sse === "live";

  return (
    <Panel className="forge-live-status" style={{ padding: "14px 18px" }}>
      <div className="forge-live-status__row">
        <div className="forge-live-status__left">
          <span className="forge-live-status__live" aria-live="polite">
            <span className={`forge-pulse-dot${live ? "" : " forge-pulse-dot--muted"}`} />
            <span className="forge-live-status__live-label">
              {live ? "LIVE" : liveConnectionLabel(connection.sse).toUpperCase()}
            </span>
          </span>
          <span className="forge-live-status__meta">
            <Activity size={14} aria-hidden />
            {pollLabel}
          </span>
        </div>

        <div className="forge-live-status__metrics">
          <div className="forge-live-status__metric">
            <span className="forge-live-status__metric-label">Plant demand</span>
            <span className="forge-live-status__metric-value tabular">{mw.toFixed(1)} MW</span>
          </div>
          <div className="forge-live-status__metric">
            <span className="forge-live-status__metric-label">
              <Clock size={12} aria-hidden /> Last sync
            </span>
            <span className="forge-live-status__metric-value tabular">{syncAgeSec}s ago</span>
          </div>
        </div>
      </div>
    </Panel>
  );
}

export function LiveAnomalyStrip({ anomalies }: { anomalies: LiveAnomalies }) {
  const total = useCountUp(anomalies.total, 700);

  return (
    <Panel style={{ padding: 18 }}>
      <p className="forge-eyebrow">Live Instrumentation</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h3 className="forge-card-title">Live Anomalies</h3>
          <div className="forge-num-display tabular" style={{ fontSize: "2.4rem", marginTop: 6 }}>
            {Math.round(total)}
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 11.5, color: "var(--forge-on-surface-variant)" }}>
            Last triggered {anomalies.lastTriggered}
          </p>
        </div>
        <SeverityStrip
          items={[
            { tone: "critical", count: anomalies.critical, label: "Critical" },
            { tone: "warning", count: anomalies.warning, label: "Warning" },
            { tone: "info", count: anomalies.info, label: "Info" },
          ]}
        />
      </div>
    </Panel>
  );
}
