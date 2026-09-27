"use client";

import Link from "next/link";
import type { TodaySignal } from "@/lib/types";
import type { RouteStateModel } from "@/lib/route-state";
import { Gauge } from "@/components/charts/Gauge";
import { Panel } from "@/components/ui/primitives";
import { RouteStateView } from "@/components/states/RouteStateView";
import { TODAY_SIGNAL_CAP } from "@/lib/today-signals";
import { SignalCard } from "@/components/today/SignalCard";

export function TodayBoard({
  signals,
  closurePct,
  state = { kind: "default" },
  onRetry,
}: {
  signals: TodaySignal[];
  closurePct: number;
  state?: RouteStateModel;
  onRetry?: () => void;
}) {
  const capped = signals.slice(0, TODAY_SIGNAL_CAP);

  return (
    <RouteStateView state={state} onRetry={onRetry}>
      <div
        data-today-board
        data-signal-count={capped.length}
        style={{ display: "flex", flexDirection: "column", gap: 20 }}
      >
        <div className="forge-signal-strip" role="list" aria-label="Decision signals">
          {capped.map((s) => (
            <Link
              key={s.id}
              href={s.href}
              role="listitem"
              className="forge-signal-card-link"
              data-signal-id={s.id}
            >
              <SignalCard
                label={s.label}
                value={s.value}
                hint={s.hint}
                tone={s.tone === "good" ? "good" : s.tone}
              />
            </Link>
          ))}
        </div>

        <Panel style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
          <Gauge label="Closure rate" value={closurePct} valueText={`${closurePct}%`} />
          <div>
            <h2 style={{ margin: 0, fontFamily: "var(--forge-font-display)", fontSize: 18 }}>
              Closure health
            </h2>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 14,
                color: "var(--forge-on-surface-variant)",
              }}
            >
              Target ≥60% high-priority Rx acted in a billing cycle. Open Alarms and Prescriptions
              to clear the queue.
            </p>
          </div>
        </Panel>
      </div>
    </RouteStateView>
  );
}
