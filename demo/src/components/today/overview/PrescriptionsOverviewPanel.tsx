"use client";

import Link from "next/link";
import type { Prescription } from "@/lib/types";
import { ForgeButton, Panel } from "@/components/ui/primitives";
import { IconBadge, StatusBadgeByStatus } from "@/components/ui/indicators";
import { AlertTriangle, Sparkles, Zap } from "@/components/ui/icons";
import { formatInr, formatValueSignal } from "@/lib/format";
import { outcomeLabel } from "@/lib/prescriptions";

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
    <Panel className="forge-overview-actions">
      <div className="forge-overview-actions__header">
        <div>
          <p className="forge-eyebrow">Decision queue</p>
          <h3 className="forge-card-title">Next operating actions</h3>
          <p className="forge-overview-actions__subtitle">
            Start with the action that has an owner, a due window, and proof one click away.
          </p>
        </div>
        <div className="forge-overview-actions__count">
          <span className="forge-overview-actions__count-value tabular">{pending}</span>
          <span>need review</span>
        </div>
      </div>

      <div className="forge-overview-actions__summary">
        <span>{prescriptions.length} linked prescriptions</span>
        <span>Impact remains attached to each action</span>
      </div>

      <div className="forge-overview-actions__list">
        {top.length === 0 ? (
          <div className="forge-overview-actions__empty">No prescriptions yet</div>
        ) : null}
        {top.map((rx) => {
          const lane = LANE_ICON[rx.lane as keyof typeof LANE_ICON] ?? LANE_ICON.active!;
          return (
            <article key={rx.id} className="forge-overview-action">
              <div className="forge-overview-action__head">
                <div className="forge-overview-action__title">
                  <IconBadge icon={lane.icon} tone={lane.tone} size={32} iconSize={15} />
                  <div>
                    <p className="forge-overview-action__state">
                      {rx.lane === "needs_review" ? "Needs review" : "Active"}
                    </p>
                    <h4>{rx.title}</h4>
                  </div>
                </div>
                <StatusBadgeByStatus
                  status={rx.lane === "needs_review" ? "HIGH" : rx.lane === "active" ? "MEDIUM" : "GOOD"}
                  variant="dot"
                />
              </div>

              {rx.outcome ? (
                <p className="forge-overview-action__outcome">{outcomeLabel(rx.outcome)}</p>
              ) : null}
              <p className="forge-overview-action__why">{rx.why}</p>

              <div className="forge-overview-action__impact">
                <IconBadge icon={Sparkles} tone="primary" size={24} iconSize={12} />
                <div>
                  <div className="forge-overview-action__impact-value tabular">
                    {rx.valueSignal
                      ? formatValueSignal(rx.valueSignal)
                      : `${formatInr(rx.impactInrPerMonth)} /mo modeled`}
                    <span>{rx.valueSignal ? ` · ${rx.valueSignal.label}` : " impact"}</span>
                  </div>
                  <div className="forge-overview-action__confidence">
                    {Math.round(rx.confidence * 100)}% confidence
                  </div>
                </div>
              </div>

              <dl className="forge-overview-action__details">
                <div>
                  <dt>Owner</dt>
                  <dd>{rx.whoLabel ?? rx.ownerRole.replaceAll("_", " ")}</dd>
                </div>
                {rx.dueAt ? (
                  <div>
                    <dt>Due</dt>
                    <dd>
                      {new Date(rx.dueAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </dd>
                  </div>
                ) : null}
              </dl>

              <div className="forge-overview-action__actions">
                <ForgeButton variant="primary" size="sm" href={`/prescriptions/${rx.id}`}>
                  Review action
                </ForgeButton>
                <ForgeButton
                  variant="ghost"
                  size="sm"
                  href={`/evidence?rxId=${encodeURIComponent(rx.id)}`}
                >
                  Show proof
                </ForgeButton>
              </div>
            </article>
          );
        })}
      </div>

      <div className="forge-overview-actions__footer">
        <span>{prescriptions.length - top.length} more prescriptions available</span>
        <Link href="/prescriptions" className="forge-overview__section-link">
          View all →
        </Link>
      </div>
    </Panel>
  );
}
