"use client";

import { useMemo, useState } from "react";
import type { Prescription, PrescriptionLane } from "@/lib/types";
import { claimBadgeLabel, formatInr } from "@/lib/format";
import { assetsFixture, alarmsFixture, prescriptionsFixture, DEMO_PLANT } from "@/fixtures/demo";
import { buildEvidencePack, resolveEvidenceScope } from "@/lib/evidence";
import { resolveEvidenceIdForRx } from "@/fixtures/evidence-samples";
import type { NotifyPerson } from "@/fixtures/assignments";
import { AssignAssigneeSheet } from "@/components/assignments/AssignAssigneeSheet";
import { ChevronDown, ChevronRight, CheckCircle, FileText, Users } from "@/components/ui/icons";
import {
  ForgeButton,
  ForgeButtonGroup,
  StatusChip,
  ToastRegion,
} from "@/components/ui/primitives";
import {
  filterLane,
  optimisticRxUpdate,
  requiresReason,
  type RxAction,
} from "@/lib/prescriptions";

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

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="forge-ops-kv">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
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
    setToast(`Assigned to ${person.name} — WhatsApp notify queued (demo)`);
    setAssignFor(null);
    setExpanded(assignFor.id);
  }

  return (
    <div className="forge-ops-queue" data-rx-queue>
      <div className="forge-ops-summary">
        <div>
          <p className="forge-eyebrow">Addressable open queue</p>
          <p className="forge-ops-summary__value">{formatInr(openInr)}/mo</p>
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

      {sorted.length === 0 ? (
        <div className="forge-ops-summary">
          <p style={{ margin: 0 }}>Nothing in {laneLabel[lane]}.</p>
        </div>
      ) : (
        <ul className="forge-ops-list" aria-label={laneLabel[lane]}>
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

            return (
              <li key={rx.id} data-rx-id={rx.id}>
                <button
                  type="button"
                  className="forge-ops-row"
                  aria-expanded={isOpen}
                  onClick={() => setExpanded(isOpen ? null : rx.id)}
                >
                  <div style={{ display: "flex", gap: 10, flex: 1, minWidth: 0 }}>
                    <span style={{ marginTop: 4, color: "var(--forge-on-surface-variant)" }}>
                      {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <StatusChip tone="neutral" compact>
                            Rx · {rx.category ?? "Prescription"}
                          </StatusChip>
                          <StatusChip tone={priorityTone[priority]} compact>
                            {priority === "med" ? "Med" : priority[0]!.toUpperCase() + priority.slice(1)}
                          </StatusChip>
                          {rx.verificationStatus ? (
                            <StatusChip tone={badge.tone} compact>
                              {badge.label}
                            </StatusChip>
                          ) : null}
                        </div>
                        <p className="forge-ops-row__value" style={{ margin: 0 }}>
                          {formatInr(rx.impactInrPerMonth)}
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: "var(--forge-on-surface-variant)",
                            }}
                          >
                            /mo
                          </span>
                        </p>
                      </div>
                      <p className="forge-ops-row__title" style={{ marginTop: 8, fontSize: 16 }}>
                        {rx.title}
                      </p>
                      <p className="forge-ops-row__meta" style={{ marginTop: 6, fontSize: 13 }}>
                        {rx.why}
                      </p>
                      {!isOpen ? (
                        <p className="forge-ops-row__meta" style={{ marginTop: 6 }}>
                          {rx.effort ?? ctx.area ?? "Plant"}
                          {rx.dueLabel ? ` · ${rx.dueLabel}` : ` · Due ${rx.dueAt.slice(0, 10)}`}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </button>

                {isOpen ? (
                  <div className="forge-ops-expand forge-ops-expand--detail">
                    <dl className="forge-ops-kv-list">
                      <MetaRow label="Why" value={rx.why} />
                      {rx.billLine ? <MetaRow label="Bill line" value={rx.billLine} /> : null}
                      <MetaRow
                        label="Owner"
                        value={`${ownerLabel(rx.ownerRole)}${ctx.area ? ` · ${ctx.area}` : ""}`}
                      />
                      <MetaRow label="Impact" value={`${formatInr(rx.impactInrPerMonth)} / month`} />
                      {rx.effort ? <MetaRow label="Effort" value={rx.effort} /> : null}
                      <MetaRow
                        label="Rule"
                        value={`${rx.ruleId ?? pack.lineage.ruleId ?? "—"} · ${Math.round(rx.confidence * 100)}%`}
                      />
                      <MetaRow
                        label="Due"
                        value={rx.dueLabel ?? rx.dueAt.slice(0, 10)}
                      />
                    </dl>

                    {rx.actions && rx.actions.length > 0 ? (
                      <div>
                        <p className="forge-eyebrow">Recommended action</p>
                        <ol className="forge-ops-steps">
                          {rx.actions.map((step) => (
                            <li key={step}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    ) : null}

                    {rx.risks && rx.risks.length > 0 ? (
                      <div>
                        <p className="forge-eyebrow">Risks & mitigations</p>
                        <ul className="forge-ops-steps forge-ops-steps--bullets">
                          {rx.risks.map((line) => (
                            <li key={line}>{line}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {rx.opportunityCost ? (
                      <p style={{ margin: 0, fontSize: 12, color: "var(--forge-warning)" }}>
                        Delay cost {formatInr(rx.opportunityCost.modeledInr)} over{" "}
                        {rx.opportunityCost.delayDays} days. Modeled — not bill-verified.
                      </p>
                    ) : null}

                    <ForgeButtonGroup aria-label="Prescription links" toolbar>
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
                      <ForgeButtonGroup aria-label="Prescription actions" toolbar>
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
                        <ForgeButton
                          variant="destructive"
                          onClick={() => run(rx.id, "reject")}
                        >
                          Reject…
                        </ForgeButton>
                      </ForgeButtonGroup>
                    )}

                    {pendingAction?.id === rx.id ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <label
                          htmlFor={`reason-${rx.id}`}
                          style={{ fontSize: 12, fontWeight: 600 }}
                        >
                          {pendingAction.action} reason (required)
                        </label>
                        <textarea
                          id={`reason-${rx.id}`}
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          rows={2}
                          style={{
                            width: "100%",
                            borderRadius: 8,
                            border: "1px solid var(--forge-outline-variant)",
                            padding: 10,
                            fontFamily: "inherit",
                          }}
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
