"use client";

import { useState } from "react";
import { Panel, PanelHeader } from "@/components/ui/primitives";
import { StatusDotByStatus, StatusLegend, SeverityTag } from "@/components/ui/indicators";
import type { MachineStatus, OverviewMachine } from "@/lib/overview-machines";
import { formatIndianNum } from "@/lib/format";

export type { MachineStatus, OverviewMachine };

const STYLE: Record<
  MachineStatus,
  { border: string; bg: string; label: string; color: string }
> = {
  CRITICAL: {
    border: "rgba(186,26,26,0.5)",
    bg: "rgba(186,26,26,0.1)",
    label: "Critical",
    color: "var(--forge-error)",
  },
  WARNING: {
    border: "rgba(201,122,0,0.4)",
    bg: "rgba(201,122,0,0.09)",
    label: "Warning",
    color: "var(--forge-warning)",
  },
  GOOD: {
    border: "rgba(0,102,107,0.3)",
    bg: "rgba(0,102,107,0.07)",
    label: "Good",
    color: "var(--forge-tertiary)",
  },
  OPTIMIZED: {
    border: "rgba(247,84,64,0.25)",
    bg: "var(--forge-primary-dim)",
    label: "Optimized",
    color: "var(--forge-primary)",
  },
  OFFLINE: {
    border: "var(--forge-outline-variant)",
    bg: "var(--forge-surface-container-low)",
    label: "Offline",
    color: "var(--forge-outline-variant)",
  },
  INFO: {
    border: "var(--forge-outline)",
    bg: "rgba(143,112,107,0.1)",
    label: "Info",
    color: "var(--forge-outline)",
  },
};

const LEGEND: MachineStatus[] = [
  "CRITICAL",
  "WARNING",
  "GOOD",
  "OPTIMIZED",
  "INFO",
  "OFFLINE",
];

function summarize(machines: OverviewMachine[]): string {
  const counts: Record<string, number> = {};
  for (const m of machines) counts[m.status] = (counts[m.status] ?? 0) + 1;
  return [
    counts.CRITICAL ? `${counts.CRITICAL} Critical` : null,
    counts.WARNING ? `${counts.WARNING} Warning` : null,
    counts.GOOD ? `${counts.GOOD} Good` : null,
    counts.OFFLINE ? `${counts.OFFLINE} Offline` : null,
    counts.INFO ? `${counts.INFO} Info` : null,
    counts.OPTIMIZED ? `${counts.OPTIMIZED} Optimized` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function PlantHealthMap({ machines }: { machines: OverviewMachine[] }) {
  const [hover, setHover] = useState<{
    m: OverviewMachine;
    x: number;
    y: number;
  } | null>(null);

  if (!machines.length) {
    return (
      <Panel style={{ padding: 20 }}>
        <PanelHeader
          eyebrow="Real-Time Health Map"
          title="Plant Equipment Status"
          meta="No assets"
        />
        <p style={{ margin: 0, fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
          No live machines to map.
        </p>
      </Panel>
    );
  }

  return (
    <Panel style={{ padding: 20, position: "relative" }}>
      <PanelHeader
        eyebrow="Real-Time Health Map"
        title="Plant Equipment Status"
        meta={`${machines.length} assets`}
      />

      <div className="forge-plant-health-grid">
        {machines.map((m) => {
          const s = STYLE[m.status];
          return (
            <div
              key={m.name}
              className={m.status === "CRITICAL" ? "forge-pulse-border" : undefined}
              onMouseEnter={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setHover({ m, x: r.left + r.width / 2, y: r.top });
              }}
              onMouseLeave={() => setHover(null)}
              style={{
                position: "relative",
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderRadius: 6,
                padding: "6px 7px",
                minHeight: 54,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                cursor: "pointer",
                transition: "transform 0.12s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 4,
                }}
              >
                <div style={{ fontSize: 9, fontWeight: 600, lineHeight: 1.1, flex: 1 }}>
                  {m.name}
                </div>
                <StatusDotByStatus
                  status={m.status}
                  size={7}
                  pulse={m.status === "CRITICAL"}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginTop: 4,
                }}
              >
                <span
                  className="tabular"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: "var(--forge-font-display)",
                  }}
                >
                  {m.load}%
                </span>
                <span style={{ fontSize: 8.5, color: "var(--forge-on-surface-variant)" }}>
                  {m.kwh == null ? "-" : formatIndianNum(m.kwh)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 14 }}>
        <StatusLegend
          items={LEGEND.map((status) => ({
            label: STYLE[status].label,
            color: STYLE[status].color,
          }))}
        />
      </div>

      <div
        style={{
          marginTop: 12,
          padding: "8px 12px",
          background: "var(--forge-surface-container-low)",
          borderRadius: 8,
          fontSize: 11.5,
          fontWeight: 500,
          color: "var(--forge-on-surface-variant)",
          textAlign: "center",
        }}
      >
        {summarize(machines)}
      </div>

      {hover ? (
        <div
          className="forge-tooltip"
          style={{
            position: "fixed",
            left: hover.x,
            top: hover.y - 8,
            transform: "translate(-50%, -100%)",
            pointerEvents: "none",
            zIndex: 100,
            maxWidth: 220,
          }}
        >
          <div className="forge-tooltip__title">{hover.m.name}</div>
          <div className="forge-tooltip__row">
            <span>Status</span>
            <SeverityTag status={hover.m.status} label={STYLE[hover.m.status].label} />
          </div>
          <div className="forge-tooltip__row">
            <span>Load</span>
            <span>{hover.m.load}%</span>
          </div>
          <div className="forge-tooltip__row">
            <span>Energy</span>
            <span>
              {hover.m.kwh == null ? "-" : `${formatIndianNum(hover.m.kwh)} kWh`}
            </span>
          </div>
          <div style={{ marginTop: 5, fontSize: 11, opacity: 0.85, lineHeight: 1.4 }}>
            {hover.m.reason}
          </div>
        </div>
      ) : null}
    </Panel>
  );
}
