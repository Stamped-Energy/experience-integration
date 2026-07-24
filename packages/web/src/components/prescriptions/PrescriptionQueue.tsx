"use client";

import { useMemo, useState } from "react";
import type { Prescription, PrescriptionLane } from "@/lib/types";
import { claimBadgeLabel, formatInr } from "@/lib/format";
import { assetsFixture, alarmsFixture, prescriptionsFixture, DEMO_PLANT } from "@/fixtures/demo";
import { buildEvidencePack, resolveEvidenceScope } from "@/lib/evidence";
import { resolveEvidenceIdForRx } from "@/fixtures/evidence-samples";
import type { NotifyPerson } from "@/fixtures/assignments";
import { AssignAssigneeSheet } from "@/components/assignments/AssignAssigneeSheet";
import { ChevronDown, ChevronRight } from "@/components/ui/icons";
import {
  DataTable,
  ForgeButton,
  ForgeButtonGroup,
  Panel,
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

function areaForRx(rx: Prescription): { area?: string; assetId?: string } {
  const hit = assetsFixture.find(
    (a) =>
      rx.title.toLowerCase().includes(a.label.toLowerCase().split(" ")[0]!) ||
      rx.why.toLowerCase().includes(a.label.toLowerCase()),
  );
  return { area: hit?.area, assetId: hit?.id };
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
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }} data-rx-queue>
      <Panel style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p className="forge-eyebrow">Addressable open queue</p>
          <p className="forge-num-display tabular">{formatInr(openInr)}/mo</p>
        </div>
        <div className="forge-tabs" role="tablist" aria-label="Rx lanes">
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
            </button>
          ))}
        </div>
      </Panel>

      {sorted.length === 0 ? (
        <Panel>
          <p style={{ margin: 0 }}>Nothing in {laneLabel[lane]}.</p>
        </Panel>
      ) : (
        sorted.map((rx) => {
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
          // ponytail: teaser only — confidence/INR already on card chips
          const evidenceRows = [
            {
              id: "signal",
              unit: "Signal",
              value: pack.lineage.ruleId ?? "Rule",
              comment: pack.lineage.sources.slice(0, 2).join(", "),
            },
          ];

          return (
            <Panel key={rx.id} as="article" data-rx-id={rx.id} style={{ padding: 0 }}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setExpanded(isOpen ? null : rx.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: 16,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  alignItems: "flex-start",
                  background: "transparent",
                }}
              >
                <div style={{ display: "flex", gap: 10, flex: 1, minWidth: 0 }}>
                  <span style={{ marginTop: 4, color: "var(--forge-on-surface-variant)" }}>
                    {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <StatusChip tone={rx.confidence >= 0.8 ? "good" : "warning"}>
                        {Math.round(rx.confidence * 100)}%
                      </StatusChip>
                      {rx.verificationStatus ? (
                        <StatusChip tone={badge.tone}>{badge.label}</StatusChip>
                      ) : null}
                    </div>
                    <h3
                      style={{
                        margin: "8px 0 0",
                        fontFamily: "var(--forge-font-display)",
                        fontSize: 16,
                      }}
                    >
                      {rx.title}
                    </h3>
                    <p
                      style={{
                        margin: "6px 0 0",
                        fontSize: 13,
                        color: "var(--forge-on-surface-variant)",
                      }}
                    >
                      {ctx.area ?? "Plant"} · Due {rx.dueAt.slice(0, 10)}
                    </p>
                  </div>
                </div>
                <p className="forge-num-display tabular" style={{ fontSize: 20 }}>
                  {formatInr(rx.impactInrPerMonth)}
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--forge-on-surface-variant)" }}>
                    /mo
                  </span>
                </p>
              </button>

              {isOpen ? (
                <div
                  style={{
                    padding: "0 16px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                    borderTop: "1px solid var(--forge-outline-variant)",
                  }}
                >
                  <div>
                    <p className="forge-eyebrow" style={{ marginTop: 14 }}>
                      Why this recommendation
                    </p>
                    <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.5 }}>{rx.why}</p>
                    <div style={{ marginTop: 12 }}>
                      <DataTable
                        caption="Signal teaser"
                        columns={[
                          { key: "unit", header: "Unit" },
                          { key: "value", header: "Value" },
                          { key: "comment", header: "Comment" },
                        ]}
                        rows={evidenceRows}
                      />
                    </div>
                  </div>

                  {rx.opportunityCost ? (
                    <p style={{ margin: 0, fontSize: 12, color: "var(--forge-warning)" }}>
                      Delay cost {formatInr(rx.opportunityCost.modeledInr)} over{" "}
                      {rx.opportunityCost.delayDays} days. Modeled — not bill-verified.
                    </p>
                  ) : null}

                  {(lane === "needs_review" || lane === "active") && (
                    <ForgeButtonGroup aria-label="Prescription actions">
                      {lane === "needs_review" ? (
                        <ForgeButton variant="primary" onClick={() => setAssignFor(rx)}>
                          Assign
                        </ForgeButton>
                      ) : null}
                      <ForgeButton variant="secondary" onClick={() => run(rx.id, "done")}>
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
                      {resolveEvidenceIdForRx(rx.id) ? (
                        <ForgeButton variant="ghost" href={`/evidence?rxId=${rx.id}`}>
                          Show proof
                        </ForgeButton>
                      ) : null}
                      <ForgeButton variant="ghost" href={`/prescriptions/${rx.id}`}>
                        Full case
                      </ForgeButton>
                    </ForgeButtonGroup>
                  )}

                  {pendingAction?.id === rx.id ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <label htmlFor={`reason-${rx.id}`} style={{ fontSize: 12, fontWeight: 600 }}>
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
            </Panel>
          );
        })
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
