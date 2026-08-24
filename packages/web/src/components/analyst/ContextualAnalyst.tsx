"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import type { AnalystContextEnvelope } from "@/lib/types";

import {
  fixtureAnalystReply,
  relatedLinksFromReply,
  suggestionPrompts,
  visibleContextChips,
  type AnalystCitation,
  type AnalystMessage,
} from "@/lib/analyst-context";

import { fetchAnalystLive, resetAnalystLiveSession, sendAnalystMessageStream } from "@/lib/analyst-live";

import { plantForId } from "@/fixtures/demo";

import { IconBadge } from "@/components/ui/indicators";

import { EmptyState } from "@/components/ui/empty";

import { ForgeButton, StatusChip } from "@/components/ui/primitives";

import { Sparkles, X } from "@/components/ui/icons";

import {
  AnalystRichBlock,
  StreamingAnalystMessage,
} from "@/components/analyst/AnalystStream";

import { MessageActions } from "@/components/analyst/MessageActions";

import { MessageSources } from "@/components/analyst/MessageSources";

import "./analyst-workspace.css";

import "./contextual-analyst.css";

function PanelMessage({
  message,
  onStreamComplete,
}: {
  message: AnalystMessage;
  onStreamComplete?: (id: string) => void;
}) {
  const isUser = message.role === "user";
  const relatedLinks = !isUser && !message.stream ? relatedLinksFromReply(message) : [];

  return (
    <article className={`analyst-msg ${isUser ? "analyst-msg--user" : "analyst-msg--assistant"}`}>
      <div className="analyst-msg__avatar" aria-hidden>
        {isUser ? "You" : <Sparkles size={14} />}
      </div>
      <div className="analyst-msg__content">
        <header className="analyst-msg__head">
          <span className="analyst-msg__role">{isUser ? "You" : "Stamped Analyst"}</span>
          {!isUser && message.stream ? (
            <span className="analyst-msg__thinking">Analyzing…</span>
          ) : null}
        </header>
        <div className="analyst-msg__bubble">
          {isUser ? (
            <p>{message.content}</p>
          ) : message.stream ? (
            <StreamingAnalystMessage
              fullText={message.content}
              onComplete={() => onStreamComplete?.(message.id)}
            />
          ) : (
            <AnalystRichBlock text={message.content} />
          )}
        </div>
        {!isUser && !message.stream ? (
          <>
            {message.citations?.length ? <MessageSources citations={message.citations} /> : null}
            {relatedLinks.length ? <MessageActions links={relatedLinks} /> : null}
          </>
        ) : null}
      </div>
    </article>
  );
}

export function ContextualAnalyst({
  open,
  onClose,
  envelope,
  returnFocusRef,
}: {
  open: boolean;
  onClose: () => void;
  envelope: AnalystContextEnvelope;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<AnalystMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [liveMode, setLiveMode] = useState<boolean | null>(null);

  const liveEnvelope = useMemo(
    () => ({ ...envelope, excludeKeys: excluded }),
    [envelope, excluded],
  );
  const chips = useMemo(() => visibleContextChips(liveEnvelope), [liveEnvelope]);
  const suggestions = useMemo(() => suggestionPrompts(envelope), [envelope]);
  const plantLabel = plantForId(envelope.plantId).plantName;

  useEffect(() => {
    resetAnalystLiveSession();
    setMessages([]);
    setExcluded([]);
    setDraft("");
    setStreaming(false);
  }, [envelope.plantId]);

  useEffect(() => {
    if (!open) return;
    void fetchAnalystLive().then(setLiveMode);
  }, [open]);

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

  async function send(question: string) {
    const q = question.trim();
    if (!q || streaming) return;
    setStreaming(true);
    const userMsg: AnalystMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content: q,
    };
    const assistantId = `a_${Date.now()}`;
    setDraft("");

    const live = await fetchAnalystLive();
    setLiveMode(live);
    if (!live) {
      const reply = fixtureAnalystReply(liveEnvelope, q);
      const assistantMsg: AnalystMessage = { ...reply, id: assistantId, stream: true };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      return;
    }

    const assistantMsg: AnalystMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      citations: [],
      stream: false,
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    const citations: AnalystCitation[] = [];
    try {
      await sendAnalystMessageStream(liveEnvelope, q, {
        onToken: (text) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + text } : m,
            ),
          );
        },
        onCitation: (cite) => {
          if (citations.some((c) => c.id === cite.id)) return;
          citations.push(cite);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, citations: [...citations] } : m,
            ),
          );
        },
        onDone: (payload) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: payload.content?.trim() ? payload.content : m.content,
                    citations: citations.length ? citations : m.citations,
                  }
                : m,
            ),
          );
          setStreaming(false);
        },
        onError: (message) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: m.content || `Analyst error: ${message}`,
                  }
                : m,
            ),
          );
          setStreaming(false);
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "stream failed";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `Analyst unavailable: ${message}` }
            : m,
        ),
      );
      setStreaming(false);
    }
  }

  function onStreamComplete(messageId: string) {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, stream: false } : m)),
    );
    setStreaming(false);
  }

  if (!open) return null;

  return (
    <>
      <div className="analyst-panel__backdrop" onClick={onClose} aria-hidden />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-analyst-mode="A"
        className="analyst-panel"
      >
        <header className="analyst-panel__header">
          <div className="analyst-panel__brand">
            <IconBadge icon={Sparkles} tone="primary" size={38} iconSize={18} />
            <div className="analyst-panel__brand-copy">
              <h2 id={titleId} className="analyst-panel__title">
                Stamped Analyst
              </h2>
              <p className="analyst-panel__subtitle">
                {plantLabel} · {envelope.screenTitle} · Cited answers from this screen
              </p>
            </div>
          </div>
          <div className="analyst-panel__header-actions">
            {liveMode === true ? (
              <StatusChip tone="good">Live AI</StatusChip>
            ) : liveMode === false ? (
              <StatusChip tone="neutral">Demo fixture</StatusChip>
            ) : null}
            {streaming ? <StatusChip tone="info">Analyzing…</StatusChip> : null}
            <button
              ref={closeRef}
              type="button"
              className="analyst-panel__close"
              aria-label="Close analyst"
              onClick={onClose}
            >
              <X size={18} strokeWidth={2.2} />
            </button>
          </div>
        </header>

        <div className="analyst-panel__context">
          <p className="forge-eyebrow analyst-panel__context-label">Attached context</p>
          <div className="analyst-panel__chips">
            {chips.length === 0 ? (
              <span className="analyst-panel__context-empty">No context attached to this screen</span>
            ) : (
              chips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  className="analyst-panel__chip"
                  onClick={() => setExcluded((prev) => [...prev, chip.key])}
                  title="Remove from context"
                >
                  <span>{chip.value}</span>
                  <X size={12} strokeWidth={2.5} aria-hidden />
                </button>
              ))
            )}
          </div>
          {suggestions.length ? (
            <div className="analyst-panel__suggestions">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="analyst-panel__suggestion"
                  disabled={streaming}
                  onClick={() => send(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="analyst-panel__thread forge-scroll-thin" aria-live="polite">
          {messages.length === 0 ? (
            <div className="analyst-panel__empty">
              <EmptyState
                icon={Sparkles}
                title="Ask about this screen"
                description="Answers cite plant data and evidence scoped to what you are viewing. Irreversible actions always need your confirmation."
              />
            </div>
          ) : (
            messages.map((m) => (
              <PanelMessage key={m.id} message={m} onStreamComplete={onStreamComplete} />
            ))
          )}
        </div>

        <footer className="analyst-panel__compose">
          <label className="sr-only" htmlFor="analyst-input">
            Ask Stamped Analyst
          </label>
          <div className="analyst-compose__box">
            <textarea
              id="analyst-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(draft);
                }
              }}
              placeholder="Ask about alarms, savings, or evidence on this screen…"
              rows={1}
              disabled={streaming}
            />
            <ForgeButton
              type="button"
              size="sm"
              icon={<Sparkles size={15} />}
              disabled={streaming || !draft.trim()}
              onClick={() => send(draft)}
            >
              {streaming ? "…" : "Send"}
            </ForgeButton>
          </div>
          <p className="analyst-panel__disclaimer">
            Verify cited sources before plant actions. Demo responses use fixture data for this screen.
          </p>
        </footer>
      </aside>
    </>
  );
}
