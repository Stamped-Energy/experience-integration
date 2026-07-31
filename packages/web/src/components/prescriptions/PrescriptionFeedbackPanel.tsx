"use client";

import { useEffect, useState } from "react";
import { MessageSquare } from "@/components/ui/icons";
import {
  ForgeButton,
  ForgeButtonGroup,
  Panel,
  StatusChip,
} from "@/components/ui/primitives";
import { loadRxFeedback, saveRxFeedback } from "@/lib/rx-feedback-store";
import type { PrescriptionFeedback } from "@/lib/types";
import "./prescription-queue.css";

const outcomeLabel: Record<NonNullable<PrescriptionFeedback["outcome"]>, string> = {
  helped: "Helped",
  didnt_help: "Didn't help",
  needs_follow_up: "Needs follow-up",
};

export function PrescriptionFeedbackPanel({
  rxId,
  lane,
  initial,
}: {
  rxId: string;
  lane: string;
  initial?: PrescriptionFeedback;
}) {
  const canFeedback = lane !== "needs_review";
  const [feedback, setFeedback] = useState<PrescriptionFeedback | undefined>(initial);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(initial?.note ?? "");
  const [outcome, setOutcome] = useState<PrescriptionFeedback["outcome"]>(initial?.outcome);

  useEffect(() => {
    const stored = loadRxFeedback(rxId);
    if (stored) {
      setFeedback(stored);
      setNote(stored.note);
      setOutcome(stored.outcome);
    }
  }, [rxId]);

  if (!canFeedback) return null;

  function save() {
    if (!note.trim()) return;
    const next: PrescriptionFeedback = {
      note: note.trim(),
      outcome,
      at: new Date().toISOString(),
    };
    saveRxFeedback(rxId, next);
    setFeedback(next);
    setOpen(false);
  }

  return (
    <Panel className="rx-full-case__panel">
      <section className="rx-full-case__block">
        <h3 className="rx-full-case__block-title">Feedback</h3>
        {feedback ? (
          <>
            {feedback.outcome ? (
              <StatusChip tone="good">{outcomeLabel[feedback.outcome]}</StatusChip>
            ) : null}
            <p className="rx-queue__feedback-note">{feedback.note}</p>
          </>
        ) : (
          <p className="rx-queue__facet-hint" style={{ textAlign: "left" }}>
            Optional note after you take this on - what worked or what to follow up.
          </p>
        )}

        {!open ? (
          <div style={{ marginTop: 12 }}>
            <ForgeButton
              variant="secondary"
              icon={<MessageSquare size={16} />}
              onClick={() => {
                setNote(feedback?.note ?? "");
                setOutcome(feedback?.outcome);
                setOpen(true);
              }}
            >
              {feedback ? "Edit feedback" : "Add feedback"}
            </ForgeButton>
          </div>
        ) : (
          <div className="rx-queue__feedback-form" style={{ marginTop: 12 }}>
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
            <label htmlFor={`detail-feedback-${rxId}`}>Note (required)</label>
            <textarea
              id={`detail-feedback-${rxId}`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="What worked, what didn’t, or what to follow up…"
            />
            <ForgeButtonGroup>
              <ForgeButton variant="primary" onClick={save} disabled={!note.trim()}>
                Save feedback
              </ForgeButton>
              <ForgeButton variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </ForgeButton>
            </ForgeButtonGroup>
          </div>
        )}
      </section>
    </Panel>
  );
}
