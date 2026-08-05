"use client";

import { useEffect, useMemo, useState } from "react";
import type { Prescription, PrescriptionFeedback } from "@/lib/types";
import { hydrateRxFeedback, saveRxFeedback } from "@/lib/rx-feedback-store";
import { claimBadgeLabel, formatInr } from "@/lib/format";
import { assetsFixture } from "@/fixtures/demo";
import { resolveEvidenceIdForRx } from "@/fixtures/evidence-samples";
import type { NotifyPerson } from "@/fixtures/assignments";
import { AssignAssigneeSheet } from "@/components/assignments/AssignAssigneeSheet";
import { CheckCircle, FileText, MessageSquare, Users } from "@/components/ui/icons";
import {
  ForgeButton,
  ForgeButtonGroup,
  Panel,
  StatusChip,
  ToastRegion,
} from "@/components/ui/primitives";
import {
  emphasizeLead,
} from "@/components/prescriptions/prescription-formatting";
import { PrescriptionFlipCard } from "@/components/prescriptions/PrescriptionFlipCard";
import { prescriptionDetailHref } from "@/lib/prescription-nav";
import {
  type ClassFacet,
  type InboxSection,
  classLabel,
  filterInbox,
  isManagementClass,
  optimisticRxFeedback,
  optimisticRxUpdate,
  requiresReason,
  type RxAction,
} from "@/lib/prescriptions";
import "./prescription-queue.css";

const SECTIONS: InboxSection[] = ["needs_attention", "acknowledged"];

const sectionLabel: Record<InboxSection, string> = {
  needs_attention: "Needs attention",
  acknowledged: "Acknowledged",
};

const FACETS: ClassFacet[] = ["all", "maintenance", "management"];

const facetLabel: Record<ClassFacet, string> = {
  all: "All",
  maintenance: "Maintenance",
  management: "Management",
};

const outcomeLabel: Record<NonNullable<PrescriptionFeedback["outcome"]>, string> = {
  helped: "Helped",
  didnt_help: "Didn't help",
  needs_follow_up: "Needs follow-up",
};

function areaForRx(rx: Prescription): { area?: string; assetId?: string } {
  const hit = assetsFixture.find(
    (a) =>
      rx.title.toLowerCase().includes(a.label.toLowerCase().split(" ")[0]!) ||
      rx.why.toLowerCase().includes(a.label.toLowerCase()),
  );
  return { area: hit?.area, assetId: hit?.id };
}

function truncateNote(note: string, max = 120): string {
  const t = note.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function PrescriptionQueue({
  initial,
  loadError,
}: {
  initial: Prescription[];
  loadError?: string | null;
}) {
  const [rows, setRows] = useState(initial);
  const [section, setSection] = useState<InboxSection>("needs_attention");
  const [facet, setFacet] = useState<ClassFacet>("all");
  const [includeDone, setIncludeDone] = useState(false);
  const [assignFor, setAssignFor] = useState<Prescription | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    id: string;
    action: RxAction;
  } | null>(null);
  const [reason, setReason] = useState("");
  const [feedbackFor, setFeedbackFor] = useState<string | null>(null);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [feedbackOutcome, setFeedbackOutcome] =
    useState<PrescriptionFeedback["outcome"]>(undefined);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setRows(hydrateRxFeedback(initial));
  }, [initial]);

  const sorted = useMemo(
    () => filterInbox(rows, section, facet, { includeDone }),
    [rows, section, facet, includeDone],
  );

  const needsCount = filterInbox(rows, "needs_attention", facet).length;
  const ackCount = filterInbox(rows, "acknowledged", facet, { includeDone }).length;

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
    setToast(
      action === "ack"
        ? "Acknowledged - moved to Acknowledged"
        : `${action} applied`,
    );
    if (action === "ack") {
      setSection("acknowledged");
    }
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
    setToast(`Assigned to ${person.name} - WhatsApp notification queued`);
    setAssignFor(null);
    setSection("acknowledged");
  }

  function openFeedback(id: string) {
    const existing = rows.find((r) => r.id === id)?.feedback;
    setFeedbackFor(id);
    setFeedbackNote(existing?.note ?? "");
    setFeedbackOutcome(existing?.outcome);
  }

  function saveFeedback() {
    if (!feedbackFor || !feedbackNote.trim()) return;
    const feedback: PrescriptionFeedback = {
      note: feedbackNote.trim(),
      outcome: feedbackOutcome,
      at: new Date().toISOString(),
    };
    saveRxFeedback(feedbackFor, feedback);
    const { next } = optimisticRxFeedback(rows, feedbackFor, feedback);
    setRows(next);
    setFeedbackFor(null);
    setFeedbackNote("");
    setFeedbackOutcome(undefined);
    setToast("Feedback saved");
  }

  return (
    <div className="rx-queue" data-rx-queue>
      <Panel className="rx-queue__hero">
        <div className="rx-queue__hero-grid">
          <div className="rx-queue__hero-summary">
            <p className="forge-eyebrow">Addressable open queue</p>
            <p className="rx-queue__summary-value tabular">{formatInr(openInr)}/mo</p>
            <p className="rx-queue__summary-sub">
              {openCount} open · {needsCount} need attention
            </p>
          </div>
          <div className="rx-queue__hero-controls">
            <div className="forge-tabs" role="tablist" aria-label="Inbox section">
              {SECTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  className="forge-tabs__btn"
                  onClick={() => setSection(s)}
                  aria-selected={section === s}
                >
                  {sectionLabel[s]}
                  <span className="rx-queue__tab-count">
                    {s === "needs_attention" ? needsCount : ackCount}
                  </span>
                </button>
              ))}
            </div>
            <div className="forge-tabs forge-tabs--secondary" role="tablist" aria-label="Prescription class">
              {FACETS.map((f) => (
                <button
                  key={f}
                  type="button"
                  role="tab"
                  className="forge-tabs__btn"
                  onClick={() => setFacet(f)}
                  aria-selected={facet === f}
                >
                  {facetLabel[f]}
                </button>
              ))}
            </div>
            <p className="rx-queue__facet-hint">
              Maintenance = work that needs doing. Management = review and decide.
            </p>
          </div>
        </div>
      </Panel>

      {section === "acknowledged" ? (
        <div className="rx-queue__done-toggle">
          <label>
            <input
              type="checkbox"
              checked={includeDone}
              onChange={(e) => setIncludeDone(e.target.checked)}
            />
            Show done
          </label>
        </div>
      ) : null}

      {loadError ? (
        <Panel>
          <p className="rx-queue__error">{loadError}</p>
        </Panel>
      ) : null}

      {sorted.length === 0 ? (
        <Panel>
          <p className="rx-queue__empty">Nothing in {sectionLabel[section]}.</p>
        </Panel>
      ) : (
        <ul className="rx-queue__list" aria-label={sectionLabel[section]}>
          {sorted.map((rx) => {
            const badge = claimBadgeLabel(rx.verificationStatus);
            const evidenceHref = resolveEvidenceIdForRx(rx.id)
              ? `/evidence?rxId=${rx.id}`
              : null;
            const detailHref = prescriptionDetailHref(rx.id, section, facet);
            const klass = classLabel(rx);
            const isNeeds = rx.lane === "needs_review";
            const isAcked = !isNeeds && rx.lane !== "closed";

            return (
              <li key={rx.id} data-rx-id={rx.id}>
                <Panel className="rx-queue__card">
                  <div className="rx-queue__card-body">
                    <div className="rx-queue__chips">
                      <StatusChip tone={isManagementClass(rx) ? "warning" : "info"}>
                        {klass}
                      </StatusChip>
                      {rx.lane === "closed" ? (
                        <StatusChip tone="neutral">Done</StatusChip>
                      ) : null}
                      {rx.lane === "verifying" ? (
                        <StatusChip tone="warning">Verifying</StatusChip>
                      ) : null}
                      {rx.verificationStatus ? (
                        <StatusChip tone={badge.tone}>{badge.label}</StatusChip>
                      ) : null}
                    </div>

                    <PrescriptionFlipCard rx={rx} />

                    {rx.feedback ? (
                      <p className="rx-queue__feedback-preview">
                        Feedback
                        {rx.feedback.outcome
                          ? ` · ${outcomeLabel[rx.feedback.outcome]}`
                          : ""}
                        : {truncateNote(rx.feedback.note)}
                      </p>
                    ) : null}

                    {rx.risks && rx.risks.length > 0 ? (
                      <ul className="rx-queue__risk-list">
                        {rx.risks.slice(0, 2).map((line) => (
                          <li key={line}>{emphasizeLead(line)}</li>
                        ))}
                      </ul>
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
                        <ForgeButton variant="ghost" href={detailHref}>
                          Full case
                        </ForgeButton>
                      </ForgeButtonGroup>

                      {(isNeeds || isAcked) && (
                        <ForgeButtonGroup
                          aria-label="Prescription actions"
                          toolbar
                          className="rx-queue__actions-group rx-queue__actions-group--ops"
                        >
                          {isNeeds ? (
                            <>
                              <ForgeButton
                                variant="primary"
                                icon={<CheckCircle size={16} />}
                                onClick={() => run(rx.id, "ack")}
                              >
                                Acknowledge
                              </ForgeButton>
                              <ForgeButton
                                variant="secondary"
                                icon={<Users size={16} />}
                                onClick={() => setAssignFor(rx)}
                              >
                                Assign
                              </ForgeButton>
                            </>
                          ) : null}
                          {isAcked ? (
                            <>
                              <ForgeButton
                                variant="secondary"
                                icon={<MessageSquare size={16} />}
                                onClick={() => openFeedback(rx.id)}
                              >
                                {rx.feedback ? "Edit feedback" : "Add feedback"}
                              </ForgeButton>
                              <ForgeButton
                                variant="secondary"
                                icon={<CheckCircle size={16} />}
                                onClick={() => run(rx.id, "done")}
                              >
                                Mark done
                              </ForgeButton>
                            </>
                          ) : null}
                          <ForgeButton variant="ghost" onClick={() => run(rx.id, "defer")}>
                            Defer…
                          </ForgeButton>
                          <ForgeButton variant="destructive" onClick={() => run(rx.id, "reject")}>
                            Reject…
                          </ForgeButton>
                        </ForgeButtonGroup>
                      )}
                    </div>

                    {feedbackFor === rx.id ? (
                      <div className="rx-queue__feedback-form">
                        <p className="rx-queue__block-title">Add feedback</p>
                        <div className="rx-queue__outcome-chips" role="group" aria-label="Outcome">
                          {(
                            [
                              ["helped", "Helped"],
                              ["didnt_help", "Didn't help"],
                              ["needs_follow_up", "Needs follow-up"],
                            ] as const
                          ).map(([key, label]) => (
                            <button
                              key={key}
                              type="button"
                              className={[
                                "rx-queue__outcome-chip",
                                feedbackOutcome === key ? "is-active" : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                              onClick={() =>
                                setFeedbackOutcome((cur) => (cur === key ? undefined : key))
                              }
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        <label htmlFor={`feedback-${rx.id}`}>Note (required)</label>
                        <textarea
                          id={`feedback-${rx.id}`}
                          value={feedbackNote}
                          onChange={(e) => setFeedbackNote(e.target.value)}
                          rows={2}
                          placeholder="What worked, what didn’t, or what to follow up…"
                        />
                        <ForgeButtonGroup>
                          <ForgeButton
                            variant="primary"
                            onClick={saveFeedback}
                            disabled={!feedbackNote.trim()}
                          >
                            Save feedback
                          </ForgeButton>
                          <ForgeButton
                            variant="ghost"
                            onClick={() => {
                              setFeedbackFor(null);
                              setFeedbackNote("");
                              setFeedbackOutcome(undefined);
                            }}
                          >
                            Cancel
                          </ForgeButton>
                        </ForgeButtonGroup>
                      </div>
                    ) : null}

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
