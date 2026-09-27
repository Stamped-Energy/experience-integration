"use client";

import Link from "next/link";
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
  const top = prescriptions
    .filter((p) => p.lane === "needs_review" || p.lane === "active")
    .slice(0, 3);

  const needsReview = prescriptions.filter((p) => p.lane === "needs_review");
  const pending = needsReview.length;

  return (
    <Panel style={{ display: "flex", flexDirection: "column", overflow: "hidden", padding: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "18px 18px 14px" }}>
        <div>
          <p className="forge-eyebrow">Next decision</p>
          <h3 className="forge-card-title">Next operating actions</h3>
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
          {pending} need review
        </span>
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
          const borderColor = lane.tone === "critical" ? "var(--forge-error)" : lane.tone === "warning" ? "var(--forge-warning)" : "var(--forge-primary)";
          return (
            <div
              key={rx.id}
              className="forge-rx-card"
              style={{
                borderLeft: `4px solid ${borderColor}`,
                background: "var(--forge-surface-container-lowest)",
                border: "1px solid var(--forge-outline-variant)",
                borderTopWidth: 2,
                borderLeftWidth: 1,
                borderTopColor: borderColor,
                borderLeftColor: borderColor,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <IconBadge icon={lane.icon} tone={lane.tone} size={28} iconSize={14} />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "var(--forge-font-display)",
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
                    <span style={{ fontSize: 10, fontWeight: 600, color: "var(--forge-on-surface-variant)" }}> /mo modeled impact</span>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--forge-tertiary)", marginTop: 2 }}>
                    {Math.round(rx.confidence * 100)}% confidence
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "var(--forge-on-surface-variant)", minWidth: 44 }}>
                  OWNER
                </span>
                <span style={{ fontSize: 12.5 }}>{rx.whoLabel ?? rx.ownerRole.replaceAll("_", " ")}</span>
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
                <Link
                  href={`/prescriptions/${rx.id}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    background: "var(--forge-primary)",
                    color: "var(--forge-on-primary)",
                    padding: "6px 12px",
                    borderRadius: "var(--forge-radius-sm)",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Review action
                </Link>
                <Link
                  href={`/evidence?rxId=${encodeURIComponent(rx.id)}`}
                  style={{
                    border: "1px solid var(--forge-outline-variant)",
                    color: "var(--forge-on-surface-variant)",
                    padding: "6px 12px",
                    borderRadius: "var(--forge-radius-sm)",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Show proof
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
