"use client";

import { useEffect, useMemo, useState } from "react";
import type { Alarm } from "@/lib/types";
import { assetsFixture, alarmsFixture, prescriptionsFixture, DEMO_PLANT } from "@/fixtures/demo";
import { resolveEvidenceIdForAlarm } from "@/fixtures/evidence-samples";
import { buildEvidencePack, resolveEvidenceScope } from "@/lib/evidence";
import {
  ForgeButton,
  ForgeButtonGroup,
  Panel,
  StatusChip,
  ToastRegion,
  DataTable,
} from "@/components/ui/primitives";
import { AlertTriangle, CheckCircle, ClipboardList, FileText } from "@/components/ui/icons";
import { RouteStateView } from "@/components/states/RouteStateView";
import { resolveRouteState } from "@/lib/route-state";
import {
  actionsForState,
  applyAlarmAction,
  moveSelection,
  sortAlarms,
  type AlarmAction,
} from "@/lib/alarms";
import { formatAlarmState, formatIstDateTime, formatIstTime } from "@/lib/format";

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
        value: asset ? `${asset.loadPct}%` : "-",
        note: current.summary,
      },
      {
        id: "kwh",
        metric: "MTD energy",
        value: asset ? `${Math.round(asset.kwhMtd / 1000)} MWh` : "-",
        note: pack.lineage.sources.join(", "),
      },
      {
        id: "raised",
        metric: "Raised",
        value: formatIstTime(current.raisedAt),
        note: formatIstDateTime(current.raisedAt),
      },
    ];
  }, [current]);

  function runAction(action: AlarmAction) {
    if (!current) return;
    if (action === "evidence") return;
    setAlarms((rows) =>
      rows.map((a) => (a.id === current.id ? applyAlarmAction(a, action) : a)),
    );
    setToast(`${ACTION_LABEL[action]} - ${current.assetLabel}`);
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
          detail: "Plant looks calm - new alarms will appear here.",
        }}
      />
    );
  }

  const criticalCount = open.filter((a) => a.severity === "critical").length;

  return (
    <div data-alarm-console className="alm-console">
      <Panel className="alm-console__hero">
        <div className="alm-console__hero-grid">
          <div>
            <p className="forge-eyebrow">Open alarms</p>
            <p className="alm-console__summary-value">
              {open.length} open
            </p>
            <p className="alm-console__summary-sub">{criticalCount} critical · j/k move · a acknowledge</p>
          </div>
        </div>
      </Panel>

      <div className="alm-console__grid">
        <Panel className="alm-console__list-panel">
          <ul className="alm-console__list" aria-label="Open alarms">
            {open.map((a, i) => (
              <li key={a.id} className="alm-console__list-item">
                <button
                  type="button"
                  className="alm-console__list-btn"
                  onClick={() => setSelected(i)}
                  aria-current={current?.id === a.id ? "true" : undefined}
                  data-alarm-id={a.id}
                >
                  <div className="alm-console__list-chips">
                    <StatusChip tone={severityTone[a.severity]} compact>
                      {a.severity}
                    </StatusChip>
                    <StatusChip tone="neutral" compact>
                      {formatAlarmState(a.state)}
                    </StatusChip>
                  </div>
                  <p className="alm-console__list-title">{a.assetLabel}</p>
                  <p className="alm-console__list-meta">
                    {a.summary} · {formatIstTime(a.raisedAt)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        {current ? (
          <section data-alarm-detail={current.id}>
            <Panel className="alm-full-case__panel">
              <div className="alm-full-case__chips">
                <StatusChip tone={severityTone[current.severity]}>{current.severity}</StatusChip>
                <StatusChip tone="neutral">{formatAlarmState(current.state)}</StatusChip>
              </div>
              <h2 className="alm-full-case__prose alm-full-case__prose--lead" style={{ marginTop: 10 }}>
                {current.assetLabel}
              </h2>
              <p className="alm-full-case__prose">{current.summary}</p>
              <p className="alm-full-case__raised">Raised {formatIstDateTime(current.raisedAt)}</p>

              <div style={{ marginTop: 16 }}>
                <p className="alm-full-case__block-title">Signal snapshot</p>
                <DataTable
                  caption="Alarm signal"
                  columns={[
                    { key: "metric", header: "Metric" },
                    { key: "value", header: "Value" },
                    { key: "note", header: "Note" },
                  ]}
                  rows={evidenceRows}
                />
              </div>

              <div className="alm-full-case__actions-bar">
                <ForgeButtonGroup
                  className="alarm-actions-desktop alm-full-case__actions-group alm-full-case__actions-group--ops"
                  aria-label="Alarm actions"
                  toolbar
                >
              {actions
                .filter((a): a is Exclude<AlarmAction, "evidence"> => a !== "evidence")
                .map((action) => {
                  const label = ACTION_LABEL[action];
                  const variant =
                    action === "ack"
                      ? "primary"
                      : action === "escalate"
                        ? "secondary"
                        : "ghost";
                  const icon =
                    action === "ack" ? (
                      <CheckCircle size={16} />
                    ) : action === "escalate" ? (
                      <AlertTriangle size={16} />
                    ) : undefined;
                  return (
                    <ForgeButton
                      key={action}
                      variant={variant}
                      icon={icon}
                      onClick={() => runAction(action)}
                    >
                      {label}
                    </ForgeButton>
                  );
                })}
              {current.relatedPrescriptionId ? (
                <ForgeButton
                  variant="ghost"
                  icon={<ClipboardList size={16} />}
                  href={`/prescriptions/${current.relatedPrescriptionId}`}
                >
                  Prescription
                </ForgeButton>
              ) : null}
              {(() => {
                const evidenceId = resolveEvidenceIdForAlarm(current.id);
                if (!evidenceId) return null;
                return (
                  <ForgeButton
                    variant="secondary"
                    icon={<FileText size={16} />}
                    href={`/evidence/${evidenceId}`}
                  >
                    Evidence
                  </ForgeButton>
                );
              })()}
              <ForgeButton variant="ghost" href={`/alarms/${current.id}`}>
                Full detail
              </ForgeButton>
                </ForgeButtonGroup>
              </div>
            </Panel>
          </section>
        ) : null}
      </div>

      <nav aria-label="Mobile alarm actions" className="alarm-mobile-bar" data-mobile-alarm-bar>
        <ForgeButtonGroup aria-label="Mobile alarm actions" toolbar>
          {actions.includes("ack") ? (
            <ForgeButton
              variant="primary"
              icon={<CheckCircle size={16} />}
              onClick={() => runAction("ack")}
            >
              Acknowledge
            </ForgeButton>
          ) : null}
          {actions.includes("unack") ? (
            <ForgeButton variant="ghost" onClick={() => runAction("unack")}>
              Unacknowledge
            </ForgeButton>
          ) : null}
          {actions.includes("escalate") ? (
            <ForgeButton
              variant="secondary"
              icon={<AlertTriangle size={16} />}
              onClick={() => runAction("escalate")}
            >
              Escalate
            </ForgeButton>
          ) : null}
        </ForgeButtonGroup>
      </nav>

      <ToastRegion message={toast} tone="good" />

      <style>{`
        .alarm-mobile-bar { display: none; }
        @media (max-width: 899px) {
          .alarm-actions-desktop { display: none !important; }
          .alarm-mobile-bar {
            display: block;
            position: sticky;
            bottom: calc(72px + env(safe-area-inset-bottom, 0px));
            z-index: 20;
            margin-top: 4px;
            max-width: 100%;
          }
          .alarm-mobile-bar .forge-btn-group,
          .alarm-mobile-bar [role="group"] {
            flex-wrap: wrap;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
