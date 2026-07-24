"use client";



import { useCallback, useMemo, useRef, useState } from "react";

import type { AnalystContextEnvelope } from "@/lib/types";

import { DEMO_PLANT } from "@/fixtures/demo";

import {

  analystChatHistoryFixture,

  formatChatDate,

  type AnalystChatSession,

} from "@/fixtures/analyst-chat-history";

import {

  fixtureAnalystReply,

  relatedLinksFromReply,

  type AnalystMessage,

} from "@/lib/analyst-context";

import { analystPlantSnapshot } from "@/lib/analyst-fixtures";

import { formatInr } from "@/lib/format";

import {

  AnalystRichBlock,

  StreamingAnalystMessage,

} from "@/components/analyst/AnalystStream";

import { MessageActions } from "@/components/analyst/MessageActions";

import { MessageSources } from "@/components/analyst/MessageSources";

import { Panel } from "@/components/ui/primitives";

import { MessageSquare, Sparkles } from "@/components/ui/icons";

import "./analyst-workspace.css";



const BASE_ENVELOPE: AnalystContextEnvelope = {

  orgId: DEMO_PLANT.orgId,

  plantId: DEMO_PLANT.plantId,

  userId: "user_demo",

  role: "energy_manager",

  routeId: "analyst",

  screenTitle: "Ask Analyst",

  visibleSummary: [DEMO_PLANT.plantName, "Cited answers · plant data only"],

  focusEntity: { type: "alarm", id: "alm_1001" },

};



const QUICK = [

  { id: "q1", label: "Summarize open alarms", prompt: "Summarize open critical and warning alarms for this plant." },

  { id: "q2", label: "Explain top prescription", prompt: "Explain the highest-impact open prescription and evidence." },

  { id: "q3", label: "Peak demand last week", prompt: "What drove peak demand last week versus CMD?" },

  { id: "q4", label: "Closure status", prompt: "How is prescription closure tracking this billing cycle?" },

] as const;



function ChatMessage({

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

        {isUser ? "You" : <Sparkles size={16} />}

      </div>

      <div className="analyst-msg__content">

        <header className="analyst-msg__head">

          <span className="analyst-msg__role">{isUser ? "You" : "Stamped Analyst"}</span>

          {!isUser && message.stream ? (

            <span className="analyst-msg__thinking">Thinking…</span>

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



/** Mode B — full-page analyst workspace with streaming replies. */

export function AnalystWorkspace() {

  const [sessions, setSessions] = useState<AnalystChatSession[]>(analystChatHistoryFixture);

  const [activeSessionId, setActiveSessionId] = useState(analystChatHistoryFixture[0]!.id);

  const [messages, setMessages] = useState<AnalystMessage[]>(

    analystChatHistoryFixture[0]!.messages,

  );

  const [draft, setDraft] = useState("");

  const [streaming, setStreaming] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);



  const snapshot = analystPlantSnapshot();

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const isEmpty = messages.length === 0;



  const envelope = useMemo(() => BASE_ENVELOPE, []);



  const scrollToBottom = useCallback(() => {

    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });

  }, []);



  const onStreamComplete = useCallback(

    (messageId: string) => {

      setMessages((prev) => {

        const next = prev.map((m) => (m.id === messageId ? { ...m, stream: false } : m));

        setSessions((ss) =>

          ss.map((s) => (s.id === activeSessionId ? { ...s, messages: next } : s)),

        );

        return next;

      });

      setStreaming(false);

    },

    [activeSessionId],

  );



  function selectSession(id: string) {

    const session = sessions.find((s) => s.id === id);

    if (!session) return;

    setActiveSessionId(id);

    setMessages(session.messages);

    setStreaming(false);

  }



  function startNewChat() {

    const id = `chat_new_${Date.now()}`;

    const session: AnalystChatSession = {

      id,

      title: "New conversation",

      preview: "Ask about alarms, prescriptions, demand…",

      updatedAt: new Date().toISOString(),

      messages: [],

    };

    setSessions((prev) => [session, ...prev]);

    setActiveSessionId(id);

    setMessages([]);

    setStreaming(false);

  }



  function send(text?: string) {

    const q = (text ?? draft).trim();

    if (!q || streaming) return;

    setStreaming(true);



    const userMsg: AnalystMessage = { id: `u_${Date.now()}`, role: "user", content: q };

    const reply = fixtureAnalystReply(envelope, q);

    const assistantMsg: AnalystMessage = { ...reply, id: `a_${Date.now()}`, stream: true };



    setMessages((prev) => {

      const next = [...prev, userMsg, assistantMsg];

      setSessions((ss) =>

        ss.map((s) =>

          s.id === activeSessionId

            ? {

                ...s,

                messages: next,

                title: s.title === "New conversation" ? q.slice(0, 42) : s.title,

                preview: q.slice(0, 72),

                updatedAt: new Date().toISOString(),

              }

            : s,

        ),

      );

      return next;

    });

    setDraft("");

    requestAnimationFrame(scrollToBottom);

  }



  return (

    <div className="analyst-workspace" data-analyst-mode="B">

      <div className="analyst-snapshot">

        <Panel className="analyst-snapshot__card analyst-snapshot__card--alert">

          <p className="analyst-snapshot__label">Critical alarms</p>

          <p className="analyst-snapshot__value">{snapshot.criticalAlarms}</p>

        </Panel>

        <Panel className="analyst-snapshot__card">

          <p className="analyst-snapshot__label">Open alarms</p>

          <p className="analyst-snapshot__value">{snapshot.openAlarms}</p>

        </Panel>

        <Panel className="analyst-snapshot__card analyst-snapshot__card--money">

          <p className="analyst-snapshot__label">Needs review</p>

          <p className="analyst-snapshot__value">{formatInr(snapshot.needsReviewInr)}</p>

          <p className="analyst-snapshot__hint">{snapshot.needsReview} prescriptions</p>

        </Panel>

        <Panel className="analyst-snapshot__card">

          <p className="analyst-snapshot__label">MD headroom</p>

          <p className="analyst-snapshot__value">{snapshot.headroomPct.toFixed(1)}%</p>

        </Panel>

        <Panel className="analyst-snapshot__card">

          <p className="analyst-snapshot__label">Closure (30d)</p>

          <p className="analyst-snapshot__value">{snapshot.closurePct}%</p>

        </Panel>

      </div>



      <div className="analyst-layout">

        <div className="analyst-chat-shell">

          <header className="analyst-chat-header">

            <div>

              <h2 className="analyst-chat-header__title">

                {activeSession?.title ?? "Ask Analyst"}

              </h2>

              <p className="analyst-chat-header__sub">

                {DEMO_PLANT.plantName} · Cited answers with links to alarms & prescriptions

              </p>

            </div>

          </header>



          <div className="analyst-chat-body">

            {isEmpty ? (

              <div className="analyst-empty">

                <div className="analyst-empty__icon">

                  <Sparkles size={28} />

                </div>

                <h3 className="analyst-empty__title">How can I help with {DEMO_PLANT.plantName}?</h3>

                <p className="analyst-empty__sub">

                  Ask about alarms, prescriptions, peak demand, or savings closure. Every answer

                  cites plant data and links to the relevant alarm or prescription when applicable.

                </p>

                <div className="analyst-quick">

                  {QUICK.map((q) => (

                    <button

                      key={q.id}

                      type="button"

                      className="analyst-quick__btn"

                      disabled={streaming}

                      onClick={() => send(q.prompt)}

                    >

                      {q.label}

                    </button>

                  ))}

                </div>

              </div>

            ) : (

              <div className="analyst-thread" aria-live="polite">

                {messages.map((m) => (

                  <ChatMessage key={m.id} message={m} onStreamComplete={onStreamComplete} />

                ))}

                <div ref={chatEndRef} />

              </div>

            )}

          </div>



          {!isEmpty ? (

            <div className="analyst-quick analyst-quick--inline">

              {QUICK.map((q) => (

                <button

                  key={q.id}

                  type="button"

                  className="analyst-quick__pill"

                  disabled={streaming}

                  onClick={() => send(q.prompt)}

                >

                  {q.label}

                </button>

              ))}

            </div>

          ) : null}



          <footer className="analyst-compose">

            <div className="analyst-compose__box">

              <textarea

                aria-label="Ask analyst"

                placeholder="Message Stamped Analyst…"

                value={draft}

                rows={1}

                disabled={streaming}

                onChange={(e) => setDraft(e.target.value)}

                onKeyDown={(e) => {

                  if (e.key === "Enter" && !e.shiftKey) {

                    e.preventDefault();

                    send();

                  }

                }}

              />

              <button

                type="button"

                className="analyst-compose__send"

                disabled={streaming || !draft.trim()}

                onClick={() => send()}

                aria-label={streaming ? "Analyzing" : "Send message"}

              >

                <Sparkles size={16} />

                {streaming ? "…" : "Send"}

              </button>

            </div>

            <p className="analyst-footnote">

              Stamped Analyst can make mistakes. Verify cited sources before plant actions.

            </p>

          </footer>

        </div>



        <aside className="analyst-history">

          <div className="analyst-history__head">

            <h2 className="analyst-history__title">Chat history</h2>

            <button type="button" className="analyst-history__new" onClick={startNewChat}>

              <MessageSquare size={16} />

              New

            </button>

          </div>

          <ul className="analyst-history__list">

            {sessions.map((session) => (

              <li key={session.id}>

                <button

                  type="button"

                  className={`analyst-history__item${activeSessionId === session.id ? " analyst-history__item--active" : ""}`}

                  onClick={() => selectSession(session.id)}

                >

                  <span className="analyst-history__item-title">{session.title}</span>

                  <span className="analyst-history__item-preview">{session.preview}</span>

                  <span className="analyst-history__item-date">

                    {formatChatDate(session.updatedAt)}

                  </span>

                </button>

              </li>

            ))}

          </ul>

        </aside>

      </div>

    </div>

  );

}

