"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Alarm } from "@/lib/types";
import { assetsFixture, alarmsFixture, prescriptionsFixture, DEMO_PLANT } from "@/fixtures/demo";
import { resolveEvidenceIdForAlarm } from "@/fixtures/evidence-samples";
import { buildEvidencePack, resolveEvidenceScope } from "@/lib/evidence";
import {
  GhostButton,
  Panel,
  PrimaryButton,
  SecondaryButton,
  StatusChip,
  ToastRegion,
  DataTable,
} from "@/components/ui/primitives";
import { RouteStateView } from "@/components/states/RouteStateView";
import { resolveRouteState } from "@/lib/route-state";
import {
  actionsForState,
  applyAlarmAction,
  moveSelection,
  sortAlarms,
  type AlarmAction,
} from "@/lib/alarms";

const severityTone = {
  critical: "critical",
  warning: "warning",
  info: "info",
} as const;

const ACTION_LABEL: Record<Exclude<AlarmAction, "evidence">, string> = {
  ack: "Acknowledge",
  unack: "Unacknowledge",
  escalate: "Escalate",
  silence: "Silence",
  unsilence: "Unsilence",
};

export function AlarmConsole({ initial }: { initial: Alarm[] }) {
  const [alarms, setAlarms] = useState(initial);
  const [selected, setSelected] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const open = useMemo(
    () => sortAlarms(alarms.filter((a) => a.state !== "cleared")),
    [alarms],
  );
  const current = open[selected] ?? open[0];
  const actions = current ? actionsForState(current.state) : [];

  const evidenceRows = useMemo(() => {
    if (!current) return [];
    const asset = assetsFixture.find((a) => a.id === current.assetId);
    const scope = resolveEvidenceScope({
      plantId: DEMO_PLANT.plantId,
      alarmId: current.id,
      alarms: alarmsFixture,
      prescriptions: prescriptionsFixture,
    });
    const pack = buildEvidencePack(scope, { baselineAvailable: true });
    return [
      {
        id: "load",
        metric: "Load",
        value: asset ? `${asset.loadPct}%` : "—",
        note: current.summary,
      },
      {
        id: "kwh",
        metric: "MTD energy",
        value: asset ? `${Math.round(asset.kwhMtd / 1000)} MWh` : "—",
        note: pack.lineage.sources.join(", "),
      },
      {
        id: "raised",
        metric: "Raised",
        value: current.raisedAt.slice(11, 16),
        note: `Finding ${current.findingId ?? "n/a"}`,
      },
    ];
  }, [current]);

  function runAction(action: AlarmAction) {
    if (!current) return;
    if (action === "evidence") return;
    setAlarms((rows) =>
      rows.map((a) => (a.id === current.id ? applyAlarmAction(a, action) : a)),
    );
    setToast(`${ACTION_LABEL[action]} — ${current.assetLabel}`);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "j") {
        e.preventDefault();
        setSelected((i) => moveSelection(i, 1, open.length));
      } else if (e.key === "k") {
        e.preventDefault();
        setSelected((i) => moveSelection(i, -1, open.length));
      } else if (e.key === "a" && current && actions.includes("ack")) {
        e.preventDefault();
        runAction("ack");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    if (selected >= open.length) setSelected(Math.max(0, open.length - 1));
  }, [open.length, selected]);

  if (open.length === 0) {
    return (
      <RouteStateView
        state={{
          ...resolveRouteState({ empty: true }),
          title: "No open alarms",
          detail: "Plant looks calm — new EMS raises will appear here.",
        }}
      />
    );
  }

  return (
    <div data-alarm-console>
      <div
        style={{ display: "grid", gridTemplateColumns: "minmax(260px, 1fr) 1.5fr", gap: 16 }}
        className="alarm-grid"
      >
        <Panel style={{ padding: 0, overflow: "hidden" }}>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }} aria-label="Open alarms">
            {open.map((a, i) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => setSelected(i)}
                  aria-current={current?.id === a.id ? "true" : undefined}
                  data-alarm-id={a.id}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "12px 14px",
                    borderBottom: "1px solid var(--forge-outline-variant)",
                    background:
                      current?.id === a.id ? "var(--forge-primary-dim)" : "transparent",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <strong style={{ fontSize: 13 }}>{a.assetLabel}</strong>
                    <StatusChip tone={severityTone[a.severity]} />
                  </div>
                  <p
                    style={{
                      margin: "6px 0 0",
                      fontSize: 12,
                      color: "var(--forge-on-surface-variant)",
                    }}
                  >
                    {a.state} · {a.summary}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        {current ? (
          <Panel data-alarm-detail={current.id} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <h2 style={{ margin: 0, fontFamily: "var(--forge-font-display)", fontSize: 20 }}>
                  {current.assetLabel}
                </h2>
                <p style={{ margin: "6px 0 0", fontSize: 14 }}>{current.summary}</p>
                <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
                  Raised {current.raisedAt}
                </p>
              </div>
              <StatusChip tone={severityTone[current.severity]}>{current.state}</StatusChip>
            </div>

            <div>
              <p className="forge-eyebrow">Signal snapshot</p>
              <DataTable
                caption="Alarm evidence"
                columns={[
                  { key: "metric", header: "Metric" },
                  { key: "value", header: "Value" },
                  { key: "note", header: "Note" },
                ]}
                rows={evidenceRows}
              />
            </div>

            <div
              className="alarm-actions-desktop"
              style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
            >
              {actions
                .filter((a): a is Exclude<AlarmAction, "evidence"> => a !== "evidence")
                .map((action) => {
                  const label = ACTION_LABEL[action];
                  if (action === "ack") {
                    return (
                      <PrimaryButton key={action} onClick={() => runAction(action)}>
                        {label}
                      </PrimaryButton>
                    );
                  }
                  if (action === "escalate") {
                    return (
                      <SecondaryButton key={action} onClick={() => runAction(action)}>
                        {label}
                      </SecondaryButton>
                    );
                  }
                  return (
                    <GhostButton key={action} onClick={() => runAction(action)}>
                      {label}
                    </GhostButton>
                  );
                })}
              {current.relatedPrescriptionId ? (
                <Link
                  href={`/prescriptions/${current.relatedPrescriptionId}`}
                  style={{
                    minHeight: 48,
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "0 18px",
                    borderRadius: "var(--forge-radius-md)",
                    border: "1px solid var(--forge-outline-variant)",
                    fontWeight: 700,
                  }}
                >
                  Open prescription
                </Link>
              ) : null}
              {(() => {
                const evidenceId = resolveEvidenceIdForAlarm(current.id);
                if (!evidenceId) return null;
                return (
                  <Link
                    href={`/evidence/${evidenceId}`}
                    style={{
                      minHeight: 48,
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "0 18px",
                      borderRadius: "var(--forge-radius-md)",
                      border: "1px solid var(--forge-outline-variant)",
                      fontWeight: 700,
                    }}
                  >
                    Open evidence
                  </Link>
                );
              })()}
              <Link
                href={`/alarms/${current.id}`}
                style={{
                  minHeight: 48,
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0 18px",
                  borderRadius: "var(--forge-radius-md)",
                  border: "1px solid var(--forge-outline-variant)",
                  fontWeight: 700,
                }}
              >
                Full detail
              </Link>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
              Keyboard: j/k move · a acknowledge. Lifecycle truth lives in L5.
            </p>
          </Panel>
        ) : null}
      </div>

      <nav aria-label="Mobile alarm actions" className="alarm-mobile-bar" data-mobile-alarm-bar>
        {actions.includes("ack") ? (
          <PrimaryButton onClick={() => runAction("ack")}>Acknowledge</PrimaryButton>
        ) : null}
        {actions.includes("unack") ? (
          <GhostButton onClick={() => runAction("unack")}>Unacknowledge</GhostButton>
        ) : null}
        {actions.includes("escalate") ? (
          <SecondaryButton onClick={() => runAction("escalate")}>Escalate</SecondaryButton>
        ) : null}
      </nav>

      <ToastRegion message={toast} tone="good" />

      <style>{`
        .alarm-mobile-bar { display: none; }
        @media (max-width: 899px) {
          .alarm-grid { grid-template-columns: 1fr !important; }
          .alarm-actions-desktop { display: none !important; }
          .alarm-mobile-bar {
            display: flex;
            position: sticky;
            bottom: 72px;
            z-index: 20;
            gap: 8px;
            padding: 12px;
            margin-top: 12px;
            background: var(--forge-surface-container-lowest);
            border: 1px solid var(--forge-outline-variant);
            border-radius: 12px;
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
}
