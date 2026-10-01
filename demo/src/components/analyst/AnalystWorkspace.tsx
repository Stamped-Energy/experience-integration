"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { AnalystContextEnvelope } from "@/lib/types";

import {
  formatChatDate,
  analystChatHistoryFixture,
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
import { useAuth } from "@/lib/auth-context";

import { formatIstTime } from "@/lib/format";

import {
  AnalystRichBlock,
  StreamingAnalystMessage,
} from "@/components/analyst/AnalystStream";

import { MessageActions } from "@/components/analyst/MessageActions";

import { MessageSources } from "@/components/analyst/MessageSources";

import { IconBadge } from "@/components/ui/indicators";

import { StatusChip } from "@/components/ui/primitives";

import {
  AlertTriangle,
  ArrowUp,
  BarChart3,
  CheckCircle,
  ClipboardList,
  SquarePen,
  StampedMark,
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

const CHAT_GROUPS = ["Today", "Yesterday", "Previous 7 days", "Older"] as const;

function chatGroup(iso: string): (typeof CHAT_GROUPS)[number] {
  const label = formatChatDate(iso);
  if (label === "Today" || label === "Yesterday") return label;
  return label.endsWith("d ago") ? "Previous 7 days" : "Older";
}

function historyToSidebar(s: AnalystHistorySessionDto): AnalystChatSession {
  return {
    id: s.id,
    title: s.title?.trim() || "Conversation",
    preview: s.preview || s.summary || "No messages yet",
    updatedAt: s.updatedAt || s.createdAt,
    messages: [],
  };
}

function localNewSession(
  plantName: string,
  plantId: string,
  updatedAt = new Date().toISOString(),
): AnalystChatSession {
  return {
    id: `chat_${plantId}_new`,
    title: "New chat",
    preview: `Ask about ${plantName}…`,
    updatedAt,
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
        {isUser ? "You" : <StampedMark size={20} />}
      </div>
      <div className="analyst-msg__content">
        <header className="analyst-msg__head">
          <span className="analyst-msg__role">{isUser ? "You" : "Stamped"}</span>
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

/** Mode B - full-page analyst workspace with streaming replies. `compact` = fresh chat only (Home). */
export function AnalystWorkspace({ compact = false }: { compact?: boolean }) {
  const { activePlant } = usePlant();
  const { isDemoSession } = useAuth();
  const [liveMode, setLiveMode] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [sessions, setSessions] = useState<AnalystChatSession[]>(() => [
    localNewSession(activePlant.plantName, activePlant.plantId, activePlant.demoAsOf),
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
      screenTitle: "Ask Stamped",
      visibleSummary: [activePlant.plantName, "Cited answers from plant data"],
    }),
    [activePlant],
  );

  const refreshHistory = useCallback(async () => {
    if (isDemoSession) {
      const draft = localNewSession(
        activePlant.plantName,
        activePlant.plantId,
        activePlant.demoAsOf,
      );
      const history = analystChatHistoryFixture;
      setLiveMode(false);
      setSessions([draft, ...history]);
      const opened = compact ? undefined : history[0];
      setActiveSessionId(opened?.id ?? draft.id);
      setMessages(opened?.messages ?? []);
      setHistoryLoading(false);
      return;
    }

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
  }, [
    activePlant.demoAsOf,
    activePlant.orgId,
    activePlant.plantId,
    activePlant.plantName,
    compact,
    isDemoSession,
  ]);

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
    if (streaming || isEmpty) return;
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
        title: "New chat",
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
                title: s.title === "New chat" ? q.slice(0, 42) : s.title,
                preview: q.slice(0, 72),
                updatedAt: new Date().toISOString(),
              }
            : s,
        ),
      );
    };

    const live = isDemoSession ? false : await fetchAnalystLive();
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
            content: `Stamped unavailable: ${message}`,
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
              content: `Stamped error: ${message}`,
            });
            setStreaming(false);
          },
        },
        { sessionId: boundSessionId },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "stream failed";
      patchAssistant({
        content: `Stamped unavailable: ${message}`,
      });
      setStreaming(false);
    }
  }

  const historyGroups = CHAT_GROUPS.map((label) => ({
    label,
    items: sessions.filter(
      (s) =>
        chatGroup(s.updatedAt) === label && !(s.id.startsWith("chat_") && s.messages.length === 0),
    ),
  })).filter((g) => g.items.length > 0);

  return (
    <div className={`analyst-gpt${compact ? " analyst-gpt--compact" : ""}`} data-analyst-mode="B">
      {compact ? null : (
        <aside className="analyst-gpt__side" aria-label="Chat history">
          <button
            type="button"
            className="analyst-gpt__new"
            onClick={() => void startNewChat()}
            disabled={streaming}
          >
            <SquarePen size={16} aria-hidden />
            New chat
          </button>
          <nav className="analyst-gpt__history forge-scroll-thin">
            {historyGroups.map((group) => (
              <div key={group.label} className="analyst-gpt__group">
                <p className="analyst-gpt__group-label">{group.label}</p>
                <ul>
                  {group.items.map((session) => (
                    <li key={session.id}>
                      <button
                        type="button"
                        className="analyst-gpt__item"
                        onClick={() => void selectSession(session.id)}
                        aria-current={activeSessionId === session.id ? "true" : undefined}
                        title={session.preview}
                      >
                        {session.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>
      )}

      <section className="analyst-gpt__main">
        {compact ? null : (
          <header className="analyst-gpt__bar">
            <h2 className="analyst-gpt__bar-title">{activeSession?.title ?? "New chat"}</h2>
            {streaming ? <StatusChip tone="info">Analyzing…</StatusChip> : null}
          </header>
        )}

        <div className="analyst-gpt__scroll forge-scroll-thin" aria-live="polite">
          {isEmpty ? (
            <div className="analyst-gpt__welcome">
              <StampedMark size={36} className="analyst-gpt__welcome-mark" />
              <h2 className="analyst-gpt__welcome-title">What can I help with?</h2>
              <p className="analyst-gpt__welcome-sub">
                Ask about {snapshot.plantName}: alarms, prescriptions, peak demand or savings.
              </p>
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
            </div>
          ) : (
            <div className="analyst-gpt__thread">
              {messages.map((m) => (
                <ChatMessage key={m.id} message={m} onStreamComplete={onStreamComplete} />
              ))}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        <footer className="analyst-gpt__composer">
          {!isEmpty ? (
            <div className="analyst-gpt__followups">
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
          <div className="analyst-gpt__box">
            <textarea
              aria-label="Ask analyst"
              placeholder="Message Stamped"
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
              className="analyst-gpt__send"
              disabled={streaming || !draft.trim()}
              onClick={() => send()}
              aria-label={streaming ? "Analyzing" : "Send message"}
            >
              <ArrowUp size={18} strokeWidth={2.4} />
            </button>
          </div>
          <p className="analyst-gpt__foot">
            Stamped can make mistakes. Verify cited sources before plant actions.
          </p>
        </footer>
      </section>
    </div>
  );
}
