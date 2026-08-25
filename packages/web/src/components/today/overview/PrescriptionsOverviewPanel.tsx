"use client";

import Link from "next/link";
import { useState } from "react";
import type { Prescription } from "@/lib/types";
import { Panel } from "@/components/ui/primitives";
import { IconBadge, StatusBadgeByStatus } from "@/components/ui/indicators";
import { AlertTriangle, Sparkles, Zap } from "@/components/ui/icons";
import { formatInr } from "@/lib/format";

const LANE_ICON = {
  needs_review: { icon: AlertTriangle, tone: "critical" as const },
  active: { icon: Zap, tone: "warning" as const },
  verifying: { icon: Sparkles, tone: "good" as const },
};

export function PrescriptionsOverviewPanel({
  prescriptions,
}: {
  prescriptions: Prescription[];
}) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const top = prescriptions
    .filter((p) => p.lane === "needs_review" || p.lane === "active")
    .slice(0, 3);

  const needsReview = prescriptions.filter((p) => p.lane === "needs_review");
  const pending = Math.max(0, needsReview.length - Object.keys(done).length);
  const totalImpact = needsReview.reduce((s, p) => s + p.impactInrPerMonth, 0);

  return (
    <Panel style={{ display: "flex", flexDirection: "column", overflow: "hidden", padding: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "20px 20px 14px" }}>
        <div>
          <p className="forge-eyebrow">Action Intelligence</p>
          <h3 className="forge-card-title">AI Prescriptions</h3>
        </div>
        <span
          style={{
            color: "var(--forge-primary)",
            fontFamily: "var(--forge-font-display)",
            fontWeight: 700,
            fontSize: 13,
            textAlign: "right",
          }}
        >
          {pending} pending · {formatInr(totalImpact)} impact
        </span>
      </div>

      <div style={{ background: "var(--forge-secondary)", padding: 16 }}>
        <div style={{ color: "rgba(255,255,255,0.82)", fontSize: 13, lineHeight: 1.5 }}>
          Based on your last 30 days of plant data, Stamped AI has identified {pending} high-value actions.
        </div>
        <div
          style={{
            color: "var(--forge-inverse-primary)",
            fontFamily: "var(--forge-font-display)",
            fontWeight: 700,
            fontSize: 14,
            marginTop: 6,
          }}
        >
          Total addressable savings: {formatInr(totalImpact)}/month
        </div>
      </div>

      <div className="forge-scroll-thin" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        {top.length === 0 ? (
          <div
            style={{
              minHeight: 160,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--forge-on-surface-variant)",
              fontSize: 13,
              textAlign: "center",
              padding: 12,
            }}
          >
            No prescriptions yet
          </div>
        ) : null}
        {top.map((rx) => {
          const lane = LANE_ICON[rx.lane as keyof typeof LANE_ICON] ?? LANE_ICON.active!;
          const isDone = done[rx.id];
          const borderColor = lane.tone === "critical" ? "var(--forge-error)" : lane.tone === "warning" ? "var(--forge-warning)" : "var(--forge-primary)";
          return (
            <div
              key={rx.id}
              className="forge-rx-card"
              style={{
                borderLeft: `4px solid ${borderColor}`,
                background: "var(--forge-surface-container-lowest)",
                border: "1px solid var(--forge-outline-variant)",
                borderLeftWidth: 4,
                borderLeftColor: borderColor,
                opacity: isDone ? 0.6 : 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <IconBadge icon={lane.icon} tone={lane.tone} size={28} iconSize={14} />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "var(--forge-font-display)",
                    textDecoration: isDone ? "line-through" : "none",
                    flex: 1,
                  }}
                >
                  {rx.title}
                </span>
                <StatusBadgeByStatus status={rx.lane === "needs_review" ? "HIGH" : rx.lane === "active" ? "MEDIUM" : "GOOD"} variant="dot" />
              </div>

              <p style={{ fontSize: 12.5, lineHeight: 1.45, margin: "0 0 10px", color: "var(--forge-on-surface-variant)" }}>{rx.why}</p>

              <div style={{ marginBottom: 10, display: "flex", alignItems: "baseline", gap: 8 }}>
                <IconBadge icon={Sparkles} tone="primary" size={24} iconSize={12} />
                <div>
                  <div
                    className="tabular"
                    style={{ fontFamily: "var(--forge-font-display)", fontWeight: 700, fontSize: 16, color: borderColor }}
                  >
                    {formatInr(rx.impactInrPerMonth)}
                    <span style={{ fontSize: 10, fontWeight: 600, color: "var(--forge-on-surface-variant)" }}> /mo</span>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--forge-tertiary)", marginTop: 2 }}>
                    {Math.round(rx.confidence * 100)}% confidence
                  </div>
                </div>
              </div>

              {rx.dueAt ? (
                <div style={{ display: "flex", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "var(--forge-on-surface-variant)", minWidth: 44 }}>
                    DUE
                  </span>
                  <span style={{ fontSize: 12.5 }}>{new Date(rx.dueAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                </div>
              ) : null}

              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setDone((d) => ({ ...d, [rx.id]: true }))}
                  disabled={isDone}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    background: isDone ? "var(--forge-surface-container-low)" : "var(--forge-tertiary)",
                    color: isDone ? "var(--forge-on-surface-variant)" : "#fff",
                    padding: "6px 12px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {isDone ? "Done" : "Mark Done"}
                </button>
                <Link
                  href={`/prescriptions/${rx.id}`}
                  style={{
                    border: "1px solid var(--forge-outline-variant)",
                    color: "var(--forge-on-surface-variant)",
                    padding: "6px 12px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Details →
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          background: "var(--forge-surface-container-low)",
          padding: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid var(--forge-outline-variant)",
        }}
      >
        <span style={{ color: "var(--forge-on-surface-variant)", fontSize: 12 }}>
          {prescriptions.length - top.length} more prescriptions available
        </span>
        <Link href="/prescriptions" style={{ color: "var(--forge-primary)", fontSize: 13, fontWeight: 600 }}>
          View All →
        </Link>
      </div>
    </Panel>
  );
}
