"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Panel } from "@/components/ui/primitives";
import { FilterIconBtn, SeverityTag } from "@/components/ui/indicators";
import { EmptyState } from "@/components/ui/empty";
import { EmptyUpstreamState } from "@/components/ui/SourceIndicator";
import { AlertTriangle, CheckCircle, Filter } from "@/components/ui/icons";

export type AlertSeverity = "CRITICAL" | "WARNING" | "INFO" | "RESOLVED";

export type AlertRow = {
  id: string;
  time: string;
  severity: AlertSeverity;
  machine: string;
  message: string;
  action?: string;
  alarmId?: string;
  live?: boolean;
};

function alertHref(alert: AlertRow): string {
  return alert.alarmId ? `/alarms/${encodeURIComponent(alert.alarmId)}` : "/alarms";
}

const BAR: Record<AlertSeverity, string> = {
  CRITICAL: "var(--forge-error)",
  WARNING: "var(--forge-warning)",
  INFO: "var(--forge-outline)",
  RESOLVED: "var(--forge-tertiary)",
};

const SEV_LABEL: Record<AlertSeverity, string> = {
  CRITICAL: "Critical",
  WARNING: "Warning",
  INFO: "Info",
  RESOLVED: "Resolved",
};

const FILTERS = [
  { key: "All", icon: Filter, tone: "neutral" as const },
  { key: "Critical", icon: AlertTriangle, tone: "critical" as const },
  { key: "Warning", icon: AlertTriangle, tone: "warning" as const },
  { key: "Resolved", icon: CheckCircle, tone: "good" as const },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export function AlertFeedPanel({ alerts }: { alerts: AlertRow[] }) {
  const [filter, setFilter] = useState<FilterKey>("All");

  const rows = useMemo(() => {
    if (filter === "All") return alerts;
    return alerts.filter((a) => a.severity === filter.toUpperCase());
  }, [filter, alerts]);

  if (!alerts.length) {
    return (
      <EmptyUpstreamState
        title="No live alerts"
        detail="Alarm feed will appear here when operations data is connected."
      />
    );
  }

  return (
    <Panel style={{ display: "flex", flexDirection: "column", padding: 0 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          padding: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <p className="forge-eyebrow">Operational Intelligence</p>
          <h3 className="forge-card-title">Live Anomaly &amp; Alert Feed</h3>
        </div>
        <div
          style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
          role="group"
          aria-label="Filter alerts"
        >
          {FILTERS.map((f) => (
            <FilterIconBtn
              key={f.key}
              active={filter === f.key}
              onClick={() => setFilter(f.key)}
              icon={f.icon}
              label={f.key}
              tone={f.tone}
            />
          ))}
        </div>
      </div>

      <div className="forge-scroll-thin" style={{ maxHeight: 240, overflowY: "auto" }}>
        {rows.map((a) => (
          <Link
            key={a.id}
            href={alertHref(a)}
            className="forge-alert-feed__row"
            aria-label={`Open alarm for ${a.machine}`}
          >
            <span className="forge-alert-feed__bar" style={{ background: BAR[a.severity] }} />
            <div className="forge-alert-feed__meta">
              <div className="forge-alert-feed__time">
                {a.time === "Now" ? (
                  <span
                    className="forge-pulse-dot"
                    style={{ background: "var(--forge-error)", display: "inline-block" }}
                    title="Live"
                  />
                ) : (
                  a.time
                )}
              </div>
              <SeverityTag status={a.severity} label={SEV_LABEL[a.severity]} />
            </div>
            <div className="forge-alert-feed__body">
              <span className="forge-alert-feed__machine">{a.machine}</span>
              <span className="forge-alert-feed__message">{a.message}</span>
            </div>
            <span className="forge-alert-feed__arrow" aria-hidden>
              →
            </span>
          </Link>
        ))}
        {rows.length === 0 ? (
          <EmptyState
            icon={Filter}
            title={`No ${filter.toLowerCase()} alerts`}
            description="Nothing in the current window matches this filter."
          />
        ) : null}
      </div>
    </Panel>
  );
}
