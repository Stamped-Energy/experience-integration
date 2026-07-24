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

import { IconBadge } from "@/components/ui/indicators";

import { EmptyState } from "@/components/ui/empty";

import {
  ForgeButton,
  Panel,
  StatusChip,
} from "@/components/ui/primitives";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  ClipboardList,
  IndianRupee,
  MessageSquare,
  Sparkles,
  Zap,
} from "@/components/ui/icons";

import type { StatusTone } from "@/components/ui/primitives";

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
  {
    id: "q1",
    label: "Summarize open alarms",
    hint: "Critical and warning counts with owners",
    prompt: "Summarize open critical and warning alarms for this plant.",
    icon: AlertTriangle,
    tone: "critical" as StatusTone,
  },
  {
    id: "q2",
    label: "Explain top prescription",
    hint: "Impact, evidence, and next step",
    prompt: "Explain the highest-impact open prescription and evidence.",
    icon: ClipboardList,
    tone: "warning" as StatusTone,
  },
  {
    id: "q3",
    label: "Peak demand last week",
    hint: "Drivers versus contracted MD",
    prompt: "What drove peak demand last week versus CMD?",
    icon: BarChart3,
    tone: "info" as StatusTone,
  },
  {
    id: "q4",
    label: "Closure status",
    hint: "Savings verification this cycle",
    prompt: "How is prescription closure tracking this billing cycle?",
    icon: CheckCircle,
    tone: "good" as StatusTone,
  },
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
            <span className="analyst-msg__thinking">Analyzing plant data…</span>
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

function QuickPromptButton({
  item,
  variant,
  disabled,
  onClick,
}: {
  item: (typeof QUICK)[number];
  variant: "card" | "pill";
  disabled?: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;

  if (variant === "pill") {
    return (
      <button
        type="button"
        className="analyst-quick__pill"
        disabled={disabled}
        onClick={onClick}
      >
        <Icon size={13} />
        {item.label}
      </button>
    );
  }

  return (
    <button type="button" className="analyst-quick__btn" disabled={disabled} onClick={onClick}>
      <IconBadge icon={Icon} tone={item.tone} size={32} iconSize={16} />
      <span className="analyst-quick__btn-body">
        <span className="analyst-quick__btn-label">{item.label}</span>
        <span className="analyst-quick__btn-hint">{item.hint}</span>
      </span>
    </button>
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
      <Panel className="analyst-hero">
        <div className="analyst-hero__head">
          <div>
            <p className="forge-eyebrow">Plant context for answers</p>
            <p className="analyst-hero__title">{DEMO_PLANT.plantName}</p>
          </div>
          <div className="analyst-hero__badges">
            <StatusChip tone="good">Source citations</StatusChip>
            <StatusChip tone="neutral">{sessions.length} conversations</StatusChip>
          </div>
        </div>

        <div className="analyst-kpi-strip" role="list" aria-label="Plant signals for analyst context">
          <div className="analyst-kpi" role="listitem">
            <div className="analyst-kpi__head">
              <IconBadge icon={AlertTriangle} tone="critical" size={30} iconSize={15} />
              <p className="analyst-kpi__label">Critical alarms</p>
            </div>
            <p className="analyst-kpi__value tabular">{snapshot.criticalAlarms}</p>
          </div>
          <div className="analyst-kpi" role="listitem">
            <div className="analyst-kpi__head">
              <IconBadge icon={Activity} tone="warning" size={30} iconSize={15} />
              <p className="analyst-kpi__label">Open alarms</p>
            </div>
            <p className="analyst-kpi__value tabular">{snapshot.openAlarms}</p>
          </div>
          <div className="analyst-kpi analyst-kpi--accent" role="listitem">
            <div className="analyst-kpi__head">
              <IconBadge icon={IndianRupee} tone="good" size={30} iconSize={15} />
              <p className="analyst-kpi__label">Needs review</p>
            </div>
            <p className="analyst-kpi__value tabular">{formatInr(snapshot.needsReviewInr)}</p>
            <p className="analyst-kpi__hint">{snapshot.needsReview} prescriptions</p>
          </div>
          <div className="analyst-kpi" role="listitem">
            <div className="analyst-kpi__head">
              <IconBadge icon={Zap} tone="info" size={30} iconSize={15} />
              <p className="analyst-kpi__label">MD headroom</p>
            </div>
            <p className="analyst-kpi__value tabular">{snapshot.headroomPct.toFixed(1)}%</p>
          </div>
          <div className="analyst-kpi" role="listitem">
            <div className="analyst-kpi__head">
              <IconBadge icon={CheckCircle} tone="good" size={30} iconSize={15} />
              <p className="analyst-kpi__label">Closure (30d)</p>
            </div>
            <p className="analyst-kpi__value tabular">{snapshot.closurePct}%</p>
          </div>
        </div>
      </Panel>

      <div className="analyst-layout">
        <div className="analyst-chat-shell">
          <header className="analyst-chat-header">
            <div className="analyst-chat-header__body">
              <div className="analyst-chat-header__icon" aria-hidden>
                <Sparkles size={18} />
              </div>
              <div>
                <h2 className="analyst-chat-header__title">
                  {activeSession?.title ?? "Ask Analyst"}
                </h2>
                <p className="analyst-chat-header__sub">
                  {DEMO_PLANT.plantName} · Linked to alarms & prescriptions
                </p>
              </div>
            </div>
            {streaming ? <StatusChip tone="info">Analyzing…</StatusChip> : null}
          </header>

          <div className="analyst-chat-body">
            {isEmpty ? (
              <div className="analyst-empty">
                <EmptyState
                  icon={Sparkles}
                  title={`How can I help with ${DEMO_PLANT.plantName}?`}
                  description="Ask about alarms, prescriptions, peak demand, or savings closure. Every answer cites plant data and links to the relevant alarm or prescription when applicable."
                  action={
                    <div className="analyst-quick">
                      {QUICK.map((q) => (
                        <QuickPromptButton
                          key={q.id}
                          item={q}
                          variant="card"
                          disabled={streaming}
                          onClick={() => send(q.prompt)}
                        />
                      ))}
                    </div>
                  }
                />
              </div>
            ) : (
              <div className="analyst-thread forge-scroll-thin" aria-live="polite">
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
                <QuickPromptButton
                  key={q.id}
                  item={q}
                  variant="pill"
                  disabled={streaming}
                  onClick={() => send(q.prompt)}
                />
              ))}
            </div>
          ) : null}

          <footer className="analyst-compose">
            <div className="analyst-compose__box">
              <textarea
                aria-label="Ask analyst"
                placeholder="Ask about alarms, demand, prescriptions, or savings…"
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
              <ForgeButton
                type="button"
                size="sm"
                disabled={streaming || !draft.trim()}
                onClick={() => send()}
                icon={<Sparkles size={15} />}
                aria-label={streaming ? "Analyzing" : "Send message"}
              >
                {streaming ? "…" : "Send"}
              </ForgeButton>
            </div>
            <p className="analyst-footnote">
              Stamped Analyst can make mistakes. Verify cited sources before plant actions.
            </p>
          </footer>
        </div>

        <aside className="analyst-history">
          <div className="analyst-history__head">
            <div>
              <h2 className="analyst-history__title">Conversations</h2>
              <p className="analyst-history__sub">{sessions.length} saved</p>
            </div>
            <ForgeButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={startNewChat}
              icon={<MessageSquare size={15} />}
            >
              New
            </ForgeButton>
          </div>
          <ul className="analyst-history__list forge-scroll-thin">
            {sessions.map((session) => (
              <li key={session.id}>
                <button
                  type="button"
                  className={`analyst-history__item${activeSessionId === session.id ? " analyst-history__item--active" : ""}`}
                  onClick={() => selectSession(session.id)}
                  aria-current={activeSessionId === session.id ? "true" : undefined}
                >
                  <span className="analyst-history__item-icon" aria-hidden>
                    <MessageSquare size={14} />
                  </span>
                  <span className="analyst-history__item-body">
                    <span className="analyst-history__item-title">{session.title}</span>
                    <span className="analyst-history__item-preview">{session.preview}</span>
                    <span className="analyst-history__item-date">
                      {formatChatDate(session.updatedAt)}
                    </span>
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
