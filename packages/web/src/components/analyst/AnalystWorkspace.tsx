"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { AnalystContextEnvelope } from "@/lib/types";

import {
  formatChatDate,
  type AnalystChatSession,
} from "@/fixtures/analyst-chat-history";

import {
  fixtureAnalystReply,
  relatedLinksFromReply,
  type AnalystCitation,
  type AnalystMessage,
} from "@/lib/analyst-context";

import {
  bindAnalystLiveSession,
  createAnalystSession,
  fetchAnalystLive,
  fetchAnalystMessages,
  fetchAnalystSessions,
  resetAnalystLiveSession,
  sendAnalystMessageStream,
  type AnalystHistorySessionDto,
} from "@/lib/analyst-live";

import { analystPlantSnapshot } from "@/lib/analyst-fixtures";

import { usePlant } from "@/lib/plant-context";

import { formatInr, formatIstCompactDateTime, formatIstTime } from "@/lib/format";

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
} from "@/components/ui/icons";

import type { StatusTone } from "@/components/ui/primitives";

import "./analyst-workspace.css";

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

function historyToSidebar(s: AnalystHistorySessionDto): AnalystChatSession {
  return {
    id: s.id,
    title: s.title?.trim() || "Conversation",
    preview: s.preview || s.summary || "No messages yet",
    updatedAt: s.updatedAt || s.createdAt,
    messages: [],
  };
}

function localNewSession(plantName: string, plantId: string): AnalystChatSession {
  return {
    id: `chat_${plantId}_new`,
    title: "New conversation",
    preview: `Ask about ${plantName}…`,
    updatedAt: new Date().toISOString(),
    messages: [],
  };
}

function ChatMessage({
  message,
  onStreamComplete,
}: {
  message: AnalystMessage;
  onStreamComplete?: (id: string) => void;
}) {
  const isUser = message.role === "user";
  const relatedLinks = !isUser && !message.stream ? relatedLinksFromReply(message) : [];
  const timeLabel = message.createdAt
    ? formatIstTime(message.createdAt)
    : null;

  return (
    <article className={`analyst-msg ${isUser ? "analyst-msg--user" : "analyst-msg--assistant"}`}>
      <div className="analyst-msg__avatar" aria-hidden>
        {isUser ? "You" : <Sparkles size={16} />}
      </div>
      <div className="analyst-msg__content">
        <header className="analyst-msg__head">
          <span className="analyst-msg__role">{isUser ? "You" : "Stamped Analyst"}</span>
          {timeLabel ? (
            <time className="analyst-msg__time" dateTime={message.createdAt}>
              {timeLabel}
            </time>
          ) : null}
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

/** Mode B - full-page analyst workspace with streaming replies. */
export function AnalystWorkspace() {
  const { activePlant } = usePlant();
  const [liveMode, setLiveMode] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [sessions, setSessions] = useState<AnalystChatSession[]>(() => [
    localNewSession(activePlant.plantName, activePlant.plantId),
  ]);
  const [activeSessionId, setActiveSessionId] = useState(
    () => `chat_${activePlant.plantId}_new`,
  );
  const [messages, setMessages] = useState<AnalystMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const loadingSessionRef = useRef<string | null>(null);

  const snapshot = useMemo(
    () => analystPlantSnapshot(activePlant.plantId),
    [activePlant.plantId],
  );
  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const isEmpty = messages.length === 0;

  const envelope = useMemo<AnalystContextEnvelope>(
    () => ({
      orgId: activePlant.orgId,
      plantId: activePlant.plantId,
      userId: "user_demo",
      role: "energy_manager",
      routeId: "analyst",
      screenTitle: "Ask Analyst",
      visibleSummary: [activePlant.plantName, "Cited answers from plant data"],
    }),
    [activePlant],
  );

  const refreshHistory = useCallback(async () => {
    const live = await fetchAnalystLive();
    setLiveMode(live);
    if (!live) {
      const local = localNewSession(activePlant.plantName, activePlant.plantId);
      setSessions([local]);
      setActiveSessionId(local.id);
      setMessages([]);
      setHistoryLoading(false);
      return;
    }
    setHistoryLoading(true);
    try {
      const remote = await fetchAnalystSessions({
        orgId: activePlant.orgId,
        plantId: activePlant.plantId,
      });
      const mapped = remote.map(historyToSidebar);
      const draftSession = localNewSession(activePlant.plantName, activePlant.plantId);
      setSessions([draftSession, ...mapped]);
      setActiveSessionId(draftSession.id);
      setMessages([]);
      resetAnalystLiveSession();
    } catch {
      const local = localNewSession(activePlant.plantName, activePlant.plantId);
      setSessions([local]);
      setActiveSessionId(local.id);
      setMessages([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [activePlant.orgId, activePlant.plantId, activePlant.plantName]);

  useEffect(() => {
    resetAnalystLiveSession();
    setDraft("");
    setStreaming(false);
    void refreshHistory();
  }, [activePlant.plantId, refreshHistory]);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  const onStreamComplete = useCallback((messageId: string) => {
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, stream: false } : m)));
    setStreaming(false);
  }, []);

  async function selectSession(id: string) {
    if (streaming) return;
    const session = sessions.find((s) => s.id === id);
    if (!session) return;
    setActiveSessionId(id);
    setStreaming(false);

    if (id.startsWith("chat_") || !liveMode) {
      setMessages(session.messages);
      resetAnalystLiveSession();
      return;
    }

    loadingSessionRef.current = id;
    bindAnalystLiveSession(envelope, id);
    try {
      const loaded = await fetchAnalystMessages({
        orgId: activePlant.orgId,
        plantId: activePlant.plantId,
        sessionId: id,
      });
      if (loadingSessionRef.current !== id) return;
      setMessages(loaded);
      setSessions((ss) =>
        ss.map((s) => (s.id === id ? { ...s, messages: loaded } : s)),
      );
    } catch (err) {
      if (loadingSessionRef.current !== id) return;
      const message = err instanceof Error ? err.message : "Failed to load messages";
      setMessages([
        {
          id: `err_${Date.now()}`,
          role: "assistant",
          content: `Could not load conversation: ${message}`,
        },
      ]);
    }
  }

  async function startNewChat() {
    if (streaming) return;
    resetAnalystLiveSession();
    if (!liveMode) {
      const session = {
        ...localNewSession(activePlant.plantName, activePlant.plantId),
        id: `chat_new_${Date.now()}`,
      };
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);
      setMessages([]);
      return;
    }
    try {
      const sessionId = await createAnalystSession({
        orgId: activePlant.orgId,
        plantId: activePlant.plantId,
        userId: envelope.userId,
      });
      bindAnalystLiveSession(envelope, sessionId);
      const session: AnalystChatSession = {
        id: sessionId,
        title: "New conversation",
        preview: `Ask about ${activePlant.plantName}…`,
        updatedAt: new Date().toISOString(),
        messages: [],
      };
      setSessions((prev) => {
        const withoutDraft = prev.filter((s) => !s.id.startsWith("chat_"));
        return [session, ...withoutDraft];
      });
      setActiveSessionId(sessionId);
      setMessages([]);
    } catch {
      const session = {
        ...localNewSession(activePlant.plantName, activePlant.plantId),
        id: `chat_new_${Date.now()}`,
      };
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);
      setMessages([]);
    }
  }

  async function send(text?: string) {
    const q = (text ?? draft).trim();
    if (!q || streaming) return;
    setStreaming(true);

    const nowIso = new Date().toISOString();
    const userMsg: AnalystMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content: q,
      createdAt: nowIso,
    };
    const assistantId = `a_${Date.now()}`;
    setDraft("");

    const bumpSidebar = (next: AnalystMessage[], sessionId: string) => {
      setSessions((ss) =>
        ss.map((s) =>
          s.id === sessionId
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
    };

    const live = await fetchAnalystLive();
    setLiveMode(live);
    if (!live) {
      const reply = fixtureAnalystReply(envelope, q);
      const assistantMsg: AnalystMessage = {
        ...reply,
        id: assistantId,
        stream: true,
        createdAt: nowIso,
      };
      setMessages((prev) => {
        const next = [...prev, userMsg, assistantMsg];
        bumpSidebar(next, activeSessionId);
        return next;
      });
      requestAnimationFrame(scrollToBottom);
      return;
    }

    let sessionId = activeSessionId.startsWith("chat_") ? "" : activeSessionId;
    if (!sessionId) {
      try {
        sessionId = await createAnalystSession({
          orgId: activePlant.orgId,
          plantId: activePlant.plantId,
          userId: envelope.userId,
        });
        bindAnalystLiveSession(envelope, sessionId);
        setActiveSessionId(sessionId);
        setSessions((ss) => {
          const rest = ss.filter((s) => !s.id.startsWith("chat_"));
          return [
            {
              id: sessionId,
              title: q.slice(0, 42),
              preview: q.slice(0, 72),
              updatedAt: new Date().toISOString(),
              messages: [],
            },
            ...rest,
          ];
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "session create failed";
        setMessages((prev) => [
          ...prev,
          userMsg,
          {
            id: assistantId,
            role: "assistant",
            content: `Analyst unavailable: ${message}`,
            createdAt: nowIso,
          },
        ]);
        setStreaming(false);
        return;
      }
    } else {
      bindAnalystLiveSession(envelope, sessionId);
    }

    const boundSessionId = sessionId;
    const assistantMsg: AnalystMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      citations: [],
      stream: false,
      createdAt: nowIso,
    };
    setMessages((prev) => {
      const next = [...prev, userMsg, assistantMsg];
      bumpSidebar(next, boundSessionId);
      return next;
    });
    requestAnimationFrame(scrollToBottom);

    const citations: AnalystCitation[] = [];
    const patchAssistant = (patch: Partial<AnalystMessage>) => {
      setMessages((prev) => {
        const next = prev.map((m) => (m.id === assistantId ? { ...m, ...patch } : m));
        bumpSidebar(next, boundSessionId);
        return next;
      });
    };

    try {
      await sendAnalystMessageStream(
        envelope,
        q,
        {
          onToken: (tok) => {
            setMessages((prev) => {
              const next = prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + tok } : m,
              );
              bumpSidebar(next, boundSessionId);
              return next;
            });
            requestAnimationFrame(scrollToBottom);
          },
          onCitation: (cite) => {
            if (citations.some((c) => c.id === cite.id)) return;
            citations.push(cite);
            patchAssistant({ citations: [...citations] });
          },
          onDone: (payload) => {
            setMessages((prev) => {
              const next = prev.map((m) => {
                if (m.id !== assistantId) return m;
                return {
                  ...m,
                  content: payload.content?.trim() ? payload.content : m.content,
                  citations: citations.length ? citations : m.citations,
                  createdAt: m.createdAt ?? new Date().toISOString(),
                };
              });
              bumpSidebar(next, boundSessionId);
              return next;
            });
            setStreaming(false);
          },
          onError: (message) => {
            patchAssistant({
              content: `Analyst error: ${message}`,
            });
            setStreaming(false);
          },
        },
        { sessionId: boundSessionId },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "stream failed";
      patchAssistant({
        content: `Analyst unavailable: ${message}`,
      });
      setStreaming(false);
    }
  }

  return (
    <div className="analyst-workspace" data-analyst-mode="B">
      <Panel className="analyst-hero">
        <div className="analyst-hero__head">
          <div>
            <p className="forge-eyebrow">Plant context for answers</p>
            <p className="analyst-hero__title">{snapshot.plantName}</p>
          </div>
          <div className="analyst-hero__badges">
            <StatusChip tone="good">Source citations</StatusChip>
            {liveMode ? (
              <StatusChip tone="good">Saved history</StatusChip>
            ) : (
              <StatusChip tone="neutral">Demo history</StatusChip>
            )}
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
                  {snapshot.plantName} · Linked to alarms & prescriptions
                  {activeSession?.updatedAt
                    ? ` · ${formatIstCompactDateTime(activeSession.updatedAt)}`
                    : ""}
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
                  title={`How can I help with ${snapshot.plantName}?`}
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
              <p className="analyst-history__sub">
                {historyLoading
                  ? "Loading…"
                  : liveMode
                    ? `${sessions.filter((s) => !s.id.startsWith("chat_")).length} saved · IST`
                    : `${sessions.length} local`}
              </p>
            </div>
            <ForgeButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void startNewChat()}
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
                  onClick={() => void selectSession(session.id)}
                  aria-current={activeSessionId === session.id ? "true" : undefined}
                >
                  <span className="analyst-history__item-icon" aria-hidden>
                    <MessageSquare size={14} />
                  </span>
                  <span className="analyst-history__item-body">
                    <span className="analyst-history__item-title">{session.title}</span>
                    <span className="analyst-history__item-preview">{session.preview}</span>
                    <span className="analyst-history__item-date">
                      {liveMode && !session.id.startsWith("chat_")
                        ? formatIstCompactDateTime(session.updatedAt)
                        : formatChatDate(session.updatedAt)}
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
