"use client";

import { useEffect, useMemo, useState } from "react";
import type { Alarm } from "@/lib/types";
import { assetsFixture, alarmsFixture, prescriptionsFixture, DEMO_PLANT } from "@/fixtures/demo";
import { resolveEvidenceIdForAlarm } from "@/fixtures/evidence-samples";
import { buildEvidencePack, resolveEvidenceScope } from "@/lib/evidence";
import {
  ForgeButton,
  ForgeButtonGroup,
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

  const criticalCount = open.filter((a) => a.severity === "critical").length;

  return (
    <div data-alarm-console className="forge-ops-queue">
      <div className="forge-ops-summary">
        <div>
          <p className="forge-eyebrow">Open EMS queue</p>
          <p className="forge-ops-summary__value">
            {open.length} open
            <span
              style={{
                marginLeft: 10,
                fontSize: 14,
                fontWeight: 600,
                color: "var(--forge-on-surface-variant)",
              }}
            >
              {criticalCount} critical
            </span>
          </p>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
          Keyboard: j/k move · a acknowledge
        </p>
      </div>

      <div className="forge-alarm-console alarm-grid">
        <div className="forge-alarm-list-panel">
          <ul className="forge-ops-list" style={{ border: "none", borderRadius: 0 }} aria-label="Open alarms">
            {open.map((a, i) => (
              <li key={a.id}>
                <button
                  type="button"
                  className="forge-ops-row"
                  onClick={() => setSelected(i)}
                  aria-current={current?.id === a.id ? "true" : undefined}
                  data-alarm-id={a.id}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <p className="forge-ops-row__title">{a.assetLabel}</p>
                      <StatusChip tone={severityTone[a.severity]} compact>
                        {a.severity}
                      </StatusChip>
                    </div>
                    <p className="forge-ops-row__meta">
                      {a.state} · {a.summary}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {current ? (
          <section className="forge-alarm-detail" data-alarm-detail={current.id}>
            <div className="forge-alarm-detail__head">
              <div>
                <h2 className="forge-alarm-detail__title">{current.assetLabel}</h2>
                <p style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.45 }}>{current.summary}</p>
                <p className="forge-ops-row__meta">Raised {current.raisedAt}</p>
              </div>
              <StatusChip tone={severityTone[current.severity]}>{current.state}</StatusChip>
            </div>

            <div>
              <p className="forge-eyebrow">Signal snapshot</p>
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

            <ForgeButtonGroup
              className="alarm-actions-desktop"
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
            bottom: 72px;
            z-index: 20;
            margin-top: 4px;
          }
        }
      `}</style>
    </div>
  );
}
