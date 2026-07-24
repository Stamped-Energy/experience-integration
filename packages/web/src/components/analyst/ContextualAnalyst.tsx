"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { AnalystContextEnvelope } from "@/lib/types";
import {
  fixtureAnalystReply,
  proposeActionFromReply,
  suggestionPrompts,
  visibleContextChips,
  type AnalystMessage,
  type ProposedAction,
} from "@/lib/analyst-context";
import { ForgeButton, ForgeButtonGroup } from "@/components/ui/primitives";
import { Sparkles } from "@/components/ui/icons";

export function ContextualAnalyst({
  open,
  onClose,
  envelope,
  returnFocusRef,
}: {
  open: boolean;
  onClose: () => void;
  envelope: AnalystContextEnvelope;
  /** Element that opened the panel — restored on close (a11y). */
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<AnalystMessage[]>([]);
  const [proposal, setProposal] = useState<ProposedAction | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const liveEnvelope = useMemo(
    () => ({ ...envelope, excludeKeys: excluded }),
    [envelope, excluded],
  );
  const chips = useMemo(() => visibleContextChips(liveEnvelope), [liveEnvelope]);
  const suggestions = useMemo(() => suggestionPrompts(envelope), [envelope]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) return;
    returnFocusRef?.current?.focus();
  }, [open, returnFocusRef]);

  function send(question: string) {
    const q = question.trim();
    if (!q) return;
    const userMsg: AnalystMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content: q,
    };
    const reply = fixtureAnalystReply(liveEnvelope, q);
    setMessages((prev) => [...prev, userMsg, reply]);
    setProposal(proposeActionFromReply(liveEnvelope, reply));
    setConfirming(false);
    setDraft("");
  }

  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(5,31,19,0.45)",
          zIndex: 40,
        }}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-analyst-mode="A"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: 400,
          maxWidth: "92vw",
          background: "var(--forge-surface-container-lowest)",
          boxShadow: "var(--forge-shadow-panel)",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            background: "var(--forge-secondary)",
            color: "#fff",
            padding: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2
              id={titleId}
              style={{ margin: 0, fontSize: 15, fontFamily: "var(--forge-font-display)" }}
            >
              Stamped Analyst
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 11, opacity: 0.85 }}>
              Mode A · context from this screen
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            aria-label="Close analyst"
            onClick={onClose}
            style={{
              color: "#fff",
              fontSize: 18,
              padding: 8,
              minWidth: 48,
              minHeight: 48,
              borderRadius: "var(--forge-radius-md)",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: 14, borderBottom: "1px solid var(--forge-outline-variant)" }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600 }}>Attached context</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {chips.length === 0 ? (
              <span style={{ fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
                No context attached
              </span>
            ) : (
              chips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setExcluded((prev) => [...prev, chip.key])}
                  title="Remove from context"
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "6px 10px",
                    borderRadius: "var(--forge-radius-md)",
                    border: "1px solid var(--forge-outline-variant)",
                    background: "var(--forge-surface-container-lowest)",
                    color: "var(--forge-on-surface)",
                  }}
                >
                  {chip.value} ×
                </button>
              ))
            )}
          </div>
          <ForgeButtonGroup aria-label="Suggested prompts">
            {suggestions.map((s) => (
              <ForgeButton key={s} variant="ghost" size="sm" onClick={() => send(s)}>
                {s}
              </ForgeButton>
            ))}
          </ForgeButtonGroup>
        </div>

        <div
          style={{ flex: 1, padding: 16, overflow: "auto", fontSize: 13, lineHeight: 1.5 }}
          aria-live="polite"
        >
          {messages.length === 0 ? (
            <p style={{ margin: 0, color: "var(--forge-on-surface-variant)" }}>
              Ask about this screen. Answers cite L4 retrieval; irreversible plant actions always
              need your confirm.
            </p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
              {messages.map((m) => (
                <li key={m.id}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 11 }}>
                    {m.role === "user" ? "You" : "Analyst"}
                  </p>
                  <p style={{ margin: "4px 0 0" }}>{m.content}</p>
                  {m.citations?.length ? (
                    <ul style={{ margin: "6px 0 0", paddingLeft: 16, fontSize: 12 }}>
                      {m.citations.map((c) => (
                        <li key={c.id}>
                          [{c.path ?? "H"}] {c.title}
                          {c.snippet ? ` — ${c.snippet}` : ""}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          {proposal ? (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 8,
                border: "1px solid var(--forge-outline-variant)",
                background: "var(--forge-surface-container)",
              }}
            >
              <p style={{ margin: 0, fontWeight: 700 }}>Proposed action</p>
              <p style={{ margin: "6px 0 0", fontSize: 13 }}>{proposal.summary}</p>
              <div style={{ marginTop: 10 }}>
                {!confirming ? (
                  <ForgeButton variant="secondary" onClick={() => setConfirming(true)}>
                    Preview {proposal.label}
                  </ForgeButton>
                ) : (
                  <ForgeButtonGroup aria-label="Confirm proposed action">
                    <ForgeButton
                      variant="primary"
                      onClick={() => {
                        // ponytail: no auto-write — confirm gate only; L5 wire in consumer
                        setToast(`${proposal.label} confirmed (fixture — not sent upstream)`);
                        setProposal(null);
                        setConfirming(false);
                      }}
                    >
                      Confirm {proposal.label}
                    </ForgeButton>
                    <ForgeButton variant="ghost" onClick={() => setConfirming(false)}>
                      Cancel
                    </ForgeButton>
                  </ForgeButtonGroup>
                )}
              </div>
            </div>
          ) : null}
          {toast ? (
            <p role="status" style={{ margin: "12px 0 0", fontSize: 12, color: "var(--forge-good)" }}>
              {toast}
            </p>
          ) : null}
        </div>

        <div style={{ padding: 14, borderTop: "1px solid var(--forge-outline-variant)" }}>
          <label className="sr-only" htmlFor="analyst-input">
            Ask Stamped Analyst
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              id="analyst-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send(draft);
              }}
              placeholder="Ask about this screen…"
              style={{
                flex: 1,
                border: "1px solid var(--forge-outline-variant)",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 13,
              }}
            />
            <ForgeButton
              variant="primary"
              icon={<Sparkles size={16} />}
              onClick={() => send(draft)}
            >
              Send
            </ForgeButton>
          </div>
        </div>
      </aside>
    </>
  );
}
