"use client";



import { useEffect, useId, useMemo, useRef, useState } from "react";

import type { AnalystContextEnvelope } from "@/lib/types";

import {

  fixtureAnalystReply,

  relatedLinksFromReply,

  suggestionPrompts,

  visibleContextChips,

  type AnalystMessage,

} from "@/lib/analyst-context";

import { ForgeButton } from "@/components/ui/primitives";

import { Sparkles } from "@/components/ui/icons";

import {

  AnalystRichBlock,

  StreamingAnalystMessage,

} from "@/components/analyst/AnalystStream";

import { MessageActions } from "@/components/analyst/MessageActions";

import { MessageSources } from "@/components/analyst/MessageSources";

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

    if (!q || streaming) return;

    setStreaming(true);

    const userMsg: AnalystMessage = {

      id: `u_${Date.now()}`,

      role: "user",

      content: q,

    };

    const reply = fixtureAnalystReply(liveEnvelope, q);

    const assistantMsg: AnalystMessage = { ...reply, id: `a_${Date.now()}`, stream: true };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    setDraft("");

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

            <div className="analyst-panel__avatar" aria-hidden>

              <Sparkles size={18} />

            </div>

            <div>

              <h2 id={titleId} className="analyst-panel__title">

                Stamped Analyst

              </h2>

              <p className="analyst-panel__subtitle">

                Context-aware assistant · cites plant data & evidence

              </p>

            </div>

          </div>

          <button

            ref={closeRef}

            type="button"

            className="analyst-panel__close"

            aria-label="Close analyst"

            onClick={onClose}

          >

            ×

          </button>

        </header>



        <div className="analyst-panel__context">

          <p className="analyst-panel__context-label">Attached context</p>

          <div className="analyst-panel__chips">

            {chips.length === 0 ? (

              <span style={{ fontSize: 12, color: "var(--forge-on-surface-variant)" }}>

                No context attached

              </span>

            ) : (

              chips.map((chip) => (

                <button

                  key={chip.key}

                  type="button"

                  className="analyst-panel__chip"

                  onClick={() => setExcluded((prev) => [...prev, chip.key])}

                  title="Remove from context"

                >

                  {chip.value} ×

                </button>

              ))

            )}

          </div>

          <div className="analyst-panel__suggestions">

            {suggestions.map((s) => (

              <ForgeButton key={s} variant="ghost" size="sm" onClick={() => send(s)}>

                {s}

              </ForgeButton>

            ))}

          </div>

        </div>



        <div className="analyst-panel__thread" aria-live="polite">

          {messages.length === 0 ? (

            <div className="analyst-panel__empty">

              <div className="analyst-panel__empty-icon">

                <Sparkles size={22} />

              </div>

              <p style={{ margin: 0, fontWeight: 600, color: "var(--forge-on-surface)" }}>

                Ask about this screen

              </p>

              <p style={{ margin: "8px 0 0", fontSize: 13 }}>

                Answers cite plant data and evidence. Irreversible actions always need your

                confirmation.

              </p>

            </div>

          ) : (

            messages.map((m) => (

              <div key={m.id} className={`analyst-msg analyst-msg--${m.role}`}>

                <span className="analyst-msg__avatar" aria-hidden>

                  {m.role === "user" ? "You" : "AI"}

                </span>

                <div>

                  <div className="analyst-msg__bubble">

                    {m.role === "assistant" && m.stream ? (

                      <StreamingAnalystMessage

                        fullText={m.content}

                        onComplete={() => onStreamComplete(m.id)}

                      />

                    ) : m.role === "assistant" ? (

                      <AnalystRichBlock text={m.content} />

                    ) : (

                      m.content

                    )}

                  </div>

                  <div className="analyst-msg__meta">

                    {m.citations?.length && !m.stream ? (

                      <MessageSources citations={m.citations} />

                    ) : null}

                    {m.role === "assistant" && !m.stream ? (

                      <MessageActions links={relatedLinksFromReply(m)} />

                    ) : null}

                  </div>

                </div>

              </div>

            ))

          )}

        </div>



        <footer className="analyst-panel__compose">

          <label className="sr-only" htmlFor="analyst-input">

            Ask Stamped Analyst

          </label>

          <div className="analyst-panel__input-wrap">

            <textarea

              id="analyst-input"

              className="analyst-panel__input"

              value={draft}

              onChange={(e) => setDraft(e.target.value)}

              onKeyDown={(e) => {

                if (e.key === "Enter" && !e.shiftKey) {

                  e.preventDefault();

                  send(draft);

                }

              }}

              placeholder="Ask about alarms, savings, evidence on this screen…"

              rows={1}

            />

            <ForgeButton

              variant="primary"

              icon={<Sparkles size={16} />}

              disabled={streaming || !draft.trim()}

              onClick={() => send(draft)}

            >

              {streaming ? "…" : "Send"}

            </ForgeButton>

          </div>

          <p className="analyst-panel__disclaimer">

            Demo assistant — responses use fixture plant data scoped to your current screen.

          </p>

        </footer>

      </aside>

    </>

  );

}

