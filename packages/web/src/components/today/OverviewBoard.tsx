"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import type { Alarm, Prescription, TodaySignal } from "@/lib/types";
import type { DemoAsset } from "@/fixtures/demo";
import { RouteStateView } from "@/components/states/RouteStateView";
import type { RouteStateModel } from "@/lib/route-state";
import {
  TODAY_SIGNAL_CAP,
  filterMobileEssentialSignals,
} from "@/lib/today-signals";
import { SignalCard } from "@/components/today/SignalCard";
import { KpiHeroStrip } from "@/components/today/overview/KpiHeroStrip";
import { EnergyTrendPanel } from "@/components/today/overview/EnergyTrendPanel";
import { PrescriptionsOverviewPanel } from "@/components/today/overview/PrescriptionsOverviewPanel";
import { TopConsumersTable } from "@/components/today/overview/TopConsumersTable";
import { SectionDonut } from "@/components/today/overview/SectionDonut";

const PHONE_MQ = "(max-width: 899px)";

function subscribePhone(onChange: () => void) {
  const mq = window.matchMedia(PHONE_MQ);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getPhoneSnapshot() {
  return window.matchMedia(PHONE_MQ).matches;
}

function getPhoneServerSnapshot() {
  return false;
}

export function OverviewBoard({
  signals,
  alarms: _alarms,
  prescriptions,
  assets: _assets,
  state = { kind: "default" },
  onRetry,
}: {
  signals: TodaySignal[];
  closurePct?: number;
  alarms: Alarm[];
  prescriptions: Prescription[];
  assets: DemoAsset[];
  state?: RouteStateModel;
  onRetry?: () => void;
}) {
  const isPhone = useSyncExternalStore(
    subscribePhone,
    getPhoneSnapshot,
    getPhoneServerSnapshot,
  );
  const visible = isPhone ? filterMobileEssentialSignals(signals) : signals;
  const capped = visible.slice(0, TODAY_SIGNAL_CAP);

  return (
    <RouteStateView state={state} onRetry={onRetry}>
      <div
        data-today-board
        data-overview-board
        data-signal-count={capped.length}
        data-phone-signals={isPhone ? "essentials" : "role"}
        className="forge-page-stack"
      >
        <div className="forge-signal-strip" role="list" aria-label="Decision signals">
          {capped.map((s) => (
            <Link
              key={s.id}
              href={s.href}
              role="listitem"
              data-signal-id={s.id}
              className="forge-signal-card-link"
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

        <KpiHeroStrip />

        <EnergyTrendPanel />
        <div className="forge-grid-38-62">
          <PrescriptionsOverviewPanel prescriptions={prescriptions} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              minWidth: 0,
              maxWidth: "100%",
            }}
          >
            <TopConsumersTable />
            <SectionDonut />
          </div>
        </div>
      </div>
    </RouteStateView>
  );
}
