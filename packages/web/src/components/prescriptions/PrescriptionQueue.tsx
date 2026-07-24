"use client";

import { useMemo, useState } from "react";
import type { Prescription, PrescriptionLane } from "@/lib/types";
import { claimBadgeLabel, formatInr, formatIstDate, formatRuleLabel } from "@/lib/format";
import { assetsFixture, alarmsFixture, prescriptionsFixture, DEMO_PLANT } from "@/fixtures/demo";
import { buildEvidencePack, resolveEvidenceScope } from "@/lib/evidence";
import { resolveEvidenceIdForRx } from "@/fixtures/evidence-samples";
import type { NotifyPerson } from "@/fixtures/assignments";
import { AssignAssigneeSheet } from "@/components/assignments/AssignAssigneeSheet";
import { ChevronDown, ChevronRight, CheckCircle, FileText, Users } from "@/components/ui/icons";
import {
  ForgeButton,
  ForgeButtonGroup,
  Panel,
  StatusChip,
  ToastRegion,
} from "@/components/ui/primitives";
import {
  emphasizeLead,
  emphasizeNumbers,
} from "@/components/prescriptions/prescription-formatting";
import {
  filterLane,
  optimisticRxUpdate,
  requiresReason,
  type RxAction,
} from "@/lib/prescriptions";
import "./prescription-queue.css";

const LANES: PrescriptionLane[] = ["needs_review", "active", "verifying", "closed"];

const laneLabel: Record<PrescriptionLane, string> = {
  needs_review: "Needs review",
  active: "Active",
  verifying: "Verifying",
  closed: "Closed",
};

const priorityTone = {
  high: "critical",
  med: "warning",
  low: "info",
} as const;

function areaForRx(rx: Prescription): { area?: string; assetId?: string } {
  const hit = assetsFixture.find(
    (a) =>
      rx.title.toLowerCase().includes(a.label.toLowerCase().split(" ")[0]!) ||
      rx.why.toLowerCase().includes(a.label.toLowerCase()),
  );
  return { area: hit?.area, assetId: hit?.id };
}

function laneCount(rows: Prescription[], lane: PrescriptionLane): number {
  return filterLane(rows, lane).length;
}

function ownerLabel(role: string): string {
  return role.replaceAll("_", " ");
}

function CompactMeta({ rows }: { rows: Array<{ label: string; value: string }> }) {
  return (
    <dl className="rx-queue__compact-meta">
      {rows.map((row) => (
        <div key={row.label} className="rx-queue__compact-meta-row">
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function NumberedActions({ items }: { items: string[] }) {
  return (
    <ol className="rx-queue__action-list">
      {items.map((item, i) => (
        <li key={item} className="rx-queue__action-item">
          <span className="rx-queue__action-num" aria-hidden>
            {i + 1}
          </span>
          <span className="rx-queue__action-text">{emphasizeLead(item)}</span>
        </li>
      ))}
    </ol>
  );
}

export function PrescriptionQueue({ initial }: { initial: Prescription[] }) {
  const [rows, setRows] = useState(initial);
  const [lane, setLane] = useState<PrescriptionLane>("needs_review");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [assignFor, setAssignFor] = useState<Prescription | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    id: string;
    action: RxAction;
  } | null>(null);
  const [reason, setReason] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const sorted = useMemo(() => filterLane(rows, lane), [rows, lane]);

  const openInr = rows
    .filter((r) => r.lane === "needs_review" || r.lane === "active")
    .reduce((s, r) => s + r.impactInrPerMonth, 0);

  const openCount = rows.filter(
    (r) => r.lane === "needs_review" || r.lane === "active",
  ).length;

  function run(id: string, action: RxAction) {
    if (requiresReason(action)) {
      setPendingAction({ id, action });
      setReason("");
      return;
    }
    const { next } = optimisticRxUpdate(rows, id, action);
    setRows(next);
    setToast(`${action} applied`);
  }

  function confirmReasoned() {
    if (!pendingAction || !reason.trim()) return;
    const { next } = optimisticRxUpdate(rows, pendingAction.id, pendingAction.action);
    setRows(next);
    setPendingAction(null);
    setReason("");
    setToast(`${pendingAction.action} confirmed`);
  }

  function onAssigned(person: NotifyPerson) {
    if (!assignFor) return;
    const { next } = optimisticRxUpdate(rows, assignFor.id, "assign");
    setRows(next);
    setToast(`Assigned to ${person.name} — WhatsApp notification queued`);
    setAssignFor(null);
    setExpanded(assignFor.id);
  }

  return (
    <div className="rx-queue" data-rx-queue>
      <Panel className="rx-queue__hero">
        <div className="rx-queue__hero-grid">
          <div>
            <p className="forge-eyebrow">Addressable open queue</p>
            <p className="rx-queue__summary-value tabular">{formatInr(openInr)}/mo</p>
            <p className="rx-queue__summary-sub">
              {openCount} open · {laneCount(rows, "needs_review")} need review
            </p>
          </div>
          <div className="forge-tabs" role="tablist" aria-label="Prescription lanes">
            {LANES.map((l) => (
              <button
                key={l}
                type="button"
                role="tab"
                className="forge-tabs__btn"
                onClick={() => setLane(l)}
                aria-selected={lane === l}
              >
                {laneLabel[l]}
                <span
                  style={{
                    marginLeft: 6,
                    fontVariantNumeric: "tabular-nums",
                    opacity: lane === l ? 0.9 : 0.65,
                  }}
                >
                  {laneCount(rows, l)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </Panel>

      {sorted.length === 0 ? (
        <Panel>
          <p className="rx-queue__empty">Nothing in {laneLabel[lane]}.</p>
        </Panel>
      ) : (
        <ul className="rx-queue__list" aria-label={laneLabel[lane]}>
          {sorted.map((rx) => {
            const badge = claimBadgeLabel(rx.verificationStatus);
            const isOpen = expanded === rx.id;
            const ctx = areaForRx(rx);
            const scope = resolveEvidenceScope({
              plantId: DEMO_PLANT.plantId,
              rxId: rx.id,
              alarms: alarmsFixture,
              prescriptions: prescriptionsFixture,
            });
            const pack = buildEvidencePack(scope, { baselineAvailable: true });
            const priority = rx.priority ?? "med";
            const evidenceHref = resolveEvidenceIdForRx(rx.id)
              ? `/evidence?rxId=${rx.id}`
              : null;

            const metaRows = [
              { label: "Owner", value: `${ownerLabel(rx.ownerRole)}${ctx.area ? ` · ${ctx.area}` : ""}` },
              { label: "Bill line", value: rx.billLine ?? "—" },
              { label: "Effort", value: rx.effort ?? "—" },
              {
                label: "Rule",
                value: `${formatRuleLabel(rx.ruleId ?? pack.lineage.ruleId)} · ${Math.round(rx.confidence * 100)}%`,
              },
              { label: "Due", value: rx.dueLabel ?? formatIstDate(rx.dueAt) },
              { label: "Lane", value: laneLabel[rx.lane] },
            ];

            return (
              <li key={rx.id} data-rx-id={rx.id}>
                <Panel className="rx-queue__card">
                  <button
                    type="button"
                    className="rx-queue__row"
                    aria-expanded={isOpen}
                    onClick={() => setExpanded(isOpen ? null : rx.id)}
                  >
                    <span className="rx-queue__row-chevron">
                      {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </span>
                    <div className="rx-queue__row-body">
                      <div className="rx-queue__row-grid">
                        <div className="rx-queue__row-main">
                          <div className="rx-queue__chips">
                            {rx.category ? (
                              <StatusChip tone="neutral">{rx.category}</StatusChip>
                            ) : (
                              <StatusChip tone="neutral">Energy</StatusChip>
                            )}
                            <StatusChip tone={priorityTone[priority]}>
                              {priority === "med"
                                ? "Med"
                                : priority[0]!.toUpperCase() + priority.slice(1)}
                            </StatusChip>
                            <StatusChip tone="info">{Math.round(rx.confidence * 100)}%</StatusChip>
                            {rx.verificationStatus ? (
                              <StatusChip tone={badge.tone}>{badge.label}</StatusChip>
                            ) : null}
                          </div>
                          <p className="rx-queue__title">{rx.title}</p>
                          <p className="rx-queue__why">{emphasizeNumbers(rx.why)}</p>
                          {!isOpen ? (
                            <p className="rx-queue__meta">
                              {rx.effort ?? ctx.area ?? "Plant"}
                              {rx.dueLabel ? ` · ${rx.dueLabel}` : ` · Due ${formatIstDate(rx.dueAt)}`}
                            </p>
                          ) : null}
                        </div>
                        <div className="rx-queue__stat-box">
                          <p className="forge-eyebrow">Savings</p>
                          <p className="rx-queue__stat-value tabular">
                            {formatInr(rx.impactInrPerMonth)}
                          </p>
                          <p className="rx-queue__stat-period">per month</p>
                        </div>
                      </div>
                    </div>
                  </button>

                  {isOpen ? (
                    <div className="rx-queue__expand">
                      <div className="rx-queue__detail-grid">
                        <div className="rx-queue__panel-section">
                          <h3 className="rx-queue__block-title">Case details</h3>
                          <CompactMeta rows={metaRows} />
                        </div>

                        {rx.actions && rx.actions.length > 0 ? (
                          <div className="rx-queue__panel-section rx-queue__panel-section--accent">
                            <h3 className="rx-queue__block-title rx-queue__block-title--accent">
                              Recommended action
                            </h3>
                            <NumberedActions items={rx.actions} />
                          </div>
                        ) : null}
                      </div>

                      {rx.risks && rx.risks.length > 0 ? (
                        <div className="rx-queue__panel-section rx-queue__panel-section--warn">
                          <h3 className="rx-queue__block-title rx-queue__block-title--warn">
                            Risks & mitigations
                          </h3>
                          <ul className="rx-queue__risk-list">
                            {rx.risks.map((line) => (
                              <li key={line}>{emphasizeLead(line)}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {rx.opportunityCost ? (
                        <p className="rx-queue__opportunity tabular">
                          Delay cost {formatInr(rx.opportunityCost.modeledInr)} over{" "}
                          {rx.opportunityCost.delayDays} days — estimated, pending bill check.
                        </p>
                      ) : null}

                      <div className="rx-queue__actions-bar">
                        <ForgeButtonGroup
                          aria-label="Prescription links"
                          toolbar
                          className="rx-queue__actions-group rx-queue__actions-group--links"
                        >
                          {rx.relatedAlarmId ? (
                            <ForgeButton variant="ghost" href={`/alarms/${rx.relatedAlarmId}`}>
                              Alarm
                            </ForgeButton>
                          ) : null}
                          {evidenceHref ? (
                            <ForgeButton
                              variant="secondary"
                              icon={<FileText size={16} />}
                              href={evidenceHref}
                            >
                              Evidence
                            </ForgeButton>
                          ) : null}
                          <ForgeButton variant="ghost" href={`/prescriptions/${rx.id}`}>
                            Full case
                          </ForgeButton>
                        </ForgeButtonGroup>

                        {(lane === "needs_review" || lane === "active") && (
                          <ForgeButtonGroup
                            aria-label="Prescription actions"
                            toolbar
                            className="rx-queue__actions-group rx-queue__actions-group--ops"
                          >
                            {lane === "needs_review" ? (
                              <ForgeButton
                                variant="primary"
                                icon={<Users size={16} />}
                                onClick={() => setAssignFor(rx)}
                              >
                                Assign
                              </ForgeButton>
                            ) : null}
                            <ForgeButton
                              variant="secondary"
                              icon={<CheckCircle size={16} />}
                              onClick={() => run(rx.id, "done")}
                            >
                              Mark done
                            </ForgeButton>
                            <ForgeButton variant="ghost" onClick={() => run(rx.id, "defer")}>
                              Defer…
                            </ForgeButton>
                            <ForgeButton variant="destructive" onClick={() => run(rx.id, "reject")}>
                              Reject…
                            </ForgeButton>
                          </ForgeButtonGroup>
                        )}
                      </div>

                      {pendingAction?.id === rx.id ? (
                        <div className="rx-queue__reason-form">
                          <label htmlFor={`reason-${rx.id}`}>
                            {pendingAction.action} reason (required)
                          </label>
                          <textarea
                            id={`reason-${rx.id}`}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={2}
                          />
                          <ForgeButtonGroup>
                            <ForgeButton
                              variant="primary"
                              onClick={confirmReasoned}
                              disabled={!reason.trim()}
                            >
                              Confirm {pendingAction.action}
                            </ForgeButton>
                            <ForgeButton
                              variant="ghost"
                              onClick={() => {
                                setPendingAction(null);
                                setReason("");
                              }}
                            >
                              Cancel
                            </ForgeButton>
                          </ForgeButtonGroup>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </Panel>
              </li>
            );
          })}
        </ul>
      )}

      <AssignAssigneeSheet
        open={!!assignFor}
        onClose={() => setAssignFor(null)}
        title={assignFor?.title ?? "Assign"}
        area={assignFor ? areaForRx(assignFor).area : undefined}
        assetId={assignFor ? areaForRx(assignFor).assetId : undefined}
        onAssign={onAssigned}
      />

      <ToastRegion message={toast} tone="good" />
    </div>
  );
}
