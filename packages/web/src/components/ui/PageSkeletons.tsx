"use client";

import { Skeleton } from "@/components/ui/primitives";

/** Overview: signal strip + KPI strip + trend + queue/side panels. */
export function OverviewBoardSkeleton() {
  return (
    <div className="forge-page-stack" aria-busy="true" aria-label="Loading overview">
      <div className="forge-signal-strip" role="list" aria-label="Loading decision signals">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} role="listitem" className="forge-signal-card-link">
            <div className="forge-panel" style={{ padding: 14, minHeight: 88 }}>
              <Skeleton height={12} width="55%" label="Loading signal" />
              <div style={{ marginTop: 12 }}>
                <Skeleton height={22} width="40%" />
              </div>
              <div style={{ marginTop: 10 }}>
                <Skeleton height={10} width="70%" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="forge-panel" style={{ padding: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ flex: "1 1 140px", minWidth: 120 }}>
              <Skeleton height={12} width="50%" />
              <div style={{ marginTop: 10 }}>
                <Skeleton height={28} width="65%" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="forge-panel" style={{ padding: 16, minHeight: 220 }}>
        <Skeleton height={14} width={160} />
        <div style={{ marginTop: 16 }}>
          <Skeleton height={180} />
        </div>
      </div>

      <div className="forge-grid-38-62">
        <div className="forge-panel" style={{ padding: 16 }}>
          <Skeleton height={14} width={140} />
          <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} height={72} />
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="forge-panel" style={{ padding: 16 }}>
            <Skeleton height={14} width={120} />
            <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} height={28} />
              ))}
            </div>
          </div>
          <div className="forge-panel" style={{ padding: 16, minHeight: 160 }}>
            <Skeleton height={14} width={100} />
            <div style={{ marginTop: 16 }}>
              <Skeleton height={120} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Prescription queue decision-card placeholders. */
export function PrescriptionQueueSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className="forge-page-stack"
      aria-busy="true"
      aria-label="Loading prescriptions"
      style={{ display: "grid", gap: 16 }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="forge-panel" style={{ padding: 16, minHeight: 120 }}>
          <Skeleton height={18} width="75%" />
          <div style={{ marginTop: 12 }}>
            <Skeleton height={40} />
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
            <Skeleton height={14} width={100} />
            <Skeleton height={14} width={80} />
            <Skeleton height={14} width={90} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Alarm console row placeholders. */
export function AlarmListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="forge-panel" aria-busy="true" aria-label="Loading alarms">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            padding: "12px 14px",
            borderBottom:
              i === count - 1 ? "none" : "1px solid var(--forge-outline-variant)",
          }}
        >
          <Skeleton width={10} height={40} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Skeleton height={14} width="55%" />
            <div style={{ marginTop: 8 }}>
              <Skeleton height={12} width="35%" />
            </div>
          </div>
          <Skeleton height={22} width={72} />
        </div>
      ))}
    </div>
  );
}

/** Live board panels while L2 assets/measurements load. */
export function LiveBoardSkeleton() {
  return (
    <div className="forge-page-stack" aria-busy="true" aria-label="Loading live telemetry">
      <div className="forge-panel" style={{ padding: 14 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ flex: "1 1 120px" }}>
              <Skeleton height={12} width="60%" />
              <div style={{ marginTop: 8 }}>
                <Skeleton height={20} width="45%" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="forge-panel" style={{ padding: 16, minHeight: 280 }}>
        <Skeleton height={14} width={140} />
        <div style={{ marginTop: 16 }}>
          <Skeleton height={240} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="forge-panel" style={{ padding: 16, minHeight: 160 }}>
          <Skeleton height={14} width={100} />
          <div style={{ marginTop: 14 }}>
            <Skeleton height={120} />
          </div>
        </div>
        <div className="forge-panel" style={{ padding: 16, minHeight: 160 }}>
          <Skeleton height={14} width={120} />
          <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={24} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
