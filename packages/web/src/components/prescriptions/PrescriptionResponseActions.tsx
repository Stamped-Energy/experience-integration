"use client";

import { useEffect, useState } from "react";
import { MessageSquare } from "@/components/ui/icons";
import {
  ForgeButton,
  ForgeButtonGroup,
  Sheet,
  StatusChip,
} from "@/components/ui/primitives";
import { DiscussForm, TradeoffBlock } from "@/components/prescriptions/DiscussPanel";
import { isManagementClass } from "@/lib/prescriptions";
import { loadRxFeedback, saveRxFeedback } from "@/lib/rx-feedback-store";
import type { Prescription, PrescriptionFeedback } from "@/lib/types";
import "./prescription-response-actions.css";

const outcomeLabel: Record<NonNullable<PrescriptionFeedback["outcome"]>, string> = {
  helped: "Helped",
  didnt_help: "Didn't help",
  needs_follow_up: "Needs follow-up",
};

export function PrescriptionResponseActions({
  rx,
  orgId,
  plantId,
}: {
  rx: Prescription;
  orgId: string;
  plantId: string;
}) {
  const canNegotiate = isManagementClass(rx);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [negotiateOpen, setNegotiateOpen] = useState(false);
  const [feedback, setFeedback] = useState<PrescriptionFeedback | undefined>(rx.feedback);
  const [note, setNote] = useState(rx.feedback?.note ?? "");
  const [outcome, setOutcome] = useState<PrescriptionFeedback["outcome"]>(rx.feedback?.outcome);

  useEffect(() => {
    const stored = loadRxFeedback(rx.id);
    if (stored) {
      setFeedback(stored);
      setNote(stored.note);
      setOutcome(stored.outcome);
    }
  }, [rx.id]);

  function openFeedback(preset?: PrescriptionFeedback["outcome"]) {
    setNote(feedback?.note ?? "");
    setOutcome(preset ?? feedback?.outcome);
    setFeedbackOpen(true);
  }

  function saveFeedback() {
    if (!note.trim()) return;
    const next: PrescriptionFeedback = {
      note: note.trim(),
      outcome,
      at: new Date().toISOString(),
    };
    saveRxFeedback(rx.id, next);
    setFeedback(next);
    setFeedbackOpen(false);
  }

  return (
    <div className="rx-response" data-testid="rx-response-actions">
      <div className="rx-response__bar">
        <div className="rx-response__copy">
          <p className="rx-response__title">Respond</p>
          <p className="rx-response__hint">
            Leave feedback anytime.{" "}
            {canNegotiate
              ? "If you cannot carry this out as written, negotiate a constrained revision."
              : "If you cannot finish it fully, use Needs follow-up and say what blocked you."}
          </p>
          {feedback ? (
            <div className="rx-response__saved">
              {feedback.outcome ? (
                <StatusChip tone="good">{outcomeLabel[feedback.outcome]}</StatusChip>
              ) : null}
              <span className="rx-response__saved-note">{feedback.note}</span>
            </div>
          ) : null}
        </div>
        <ForgeButtonGroup className="rx-response__actions">
          <ForgeButton
            variant="secondary"
            icon={<MessageSquare size={16} />}
            data-testid="rx-feedback-open"
            onClick={() => openFeedback()}
          >
            {feedback ? "Edit feedback" : "Feedback"}
          </ForgeButton>
          {canNegotiate ? (
            <ForgeButton
              variant="primary"
              data-testid="discuss-open"
              onClick={() => setNegotiateOpen(true)}
            >
              Negotiate
            </ForgeButton>
          ) : (
            <ForgeButton
              variant="ghost"
              data-testid="rx-blocked-open"
              onClick={() => openFeedback("needs_follow_up")}
            >
              Can&apos;t do fully
            </ForgeButton>
          )}
        </ForgeButtonGroup>
      </div>

      <Sheet
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        title="Feedback"
      >
        <div className="rx-response__sheet" data-testid="rx-feedback-sheet">
          <div className="rx-response__ref">
            <p className="forge-eyebrow">About this prescription</p>
            <p className="rx-response__ref-title">{rx.title}</p>
            <p className="rx-response__ref-id tabular">{rx.id}</p>
          </div>

          <p className="rx-response__sheet-hint">
            What worked, what didn&apos;t, or why you couldn&apos;t complete it as written.
          </p>

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
                  outcome === key ? "is-active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setOutcome((cur) => (cur === key ? undefined : key))}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="rx-response__label" htmlFor={`detail-feedback-${rx.id}`}>
            Note (required)
          </label>
          <textarea
            id={`detail-feedback-${rx.id}`}
            className="rx-response__textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="Example: Can only stage half the set-point tonight - production run until 22:00."
          />

          <ForgeButtonGroup>
            <ForgeButton
              variant="primary"
              data-testid="rx-feedback-save"
              onClick={saveFeedback}
              disabled={!note.trim()}
            >
              Save feedback
            </ForgeButton>
            <ForgeButton variant="ghost" onClick={() => setFeedbackOpen(false)}>
              Cancel
            </ForgeButton>
          </ForgeButtonGroup>
        </div>
      </Sheet>

      {canNegotiate ? (
        <Sheet
          open={negotiateOpen}
          onClose={() => setNegotiateOpen(false)}
          title="Negotiate"
        >
          <div className="rx-response__sheet" data-testid="discuss-panel">
            <div className="rx-response__ref">
              <p className="forge-eyebrow">About this prescription</p>
              <p className="rx-response__ref-title">{rx.title}</p>
              <p className="rx-response__ref-id tabular">{rx.id}</p>
            </div>

            <p className="rx-response__sheet-hint">
              Tell us what you cannot do as written. We propose a constrained revision -
              propose is not commit.
            </p>

            {rx.tradeoff ? (
              <div className="rx-response__tradeoff">
                <p className="rx-full-case__block-title">Trade-off</p>
                <TradeoffBlock tradeoff={rx.tradeoff} />
              </div>
            ) : null}

            <DiscussForm rx={rx} orgId={orgId} plantId={plantId} />
          </div>
        </Sheet>
      ) : null}
    </div>
  );
}
