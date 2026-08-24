/** Browser helpers for live Ask Analyst (BFF → L4 SSE). */

import { bffUrl } from "./bff";
import type { AnalystContextEnvelope } from "./types";
import type { AnalystCitation } from "./analyst-context";

export type AnalystStreamHandlers = {
  onToken?: (text: string) => void;
  onTool?: (tool: { name: string; ok: boolean; summary?: string }) => void;
  onCitation?: (cite: AnalystCitation) => void;
  onDone?: (payload: {
    messageId?: string | null;
    content?: string | null;
    status?: string;
  }) => void;
  onError?: (message: string) => void;
};

let cachedLive: boolean | null = null;
let cachedLiveAt = 0;
const LIVE_CACHE_MS = 5_000;

let liveSessionId: string | null = null;
let liveSessionKey: string | null = null;

export function resetAnalystLiveSession(): void {
  liveSessionId = null;
  liveSessionKey = null;
}

export async function fetchAnalystLive(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (process.env.NEXT_PUBLIC_ANALYST_LIVE === "false") return false;
  if (process.env.NEXT_PUBLIC_ANALYST_LIVE === "true") {
    return true;
  }
  // Do not sticky-cache false: cold-start BFF misses were locking the UI into fixtures.
  if (cachedLive === true && Date.now() - cachedLiveAt < LIVE_CACHE_MS) {
    return true;
  }
  try {
    const res = await fetch(bffUrl("/api/analyst/meta"), {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) {
      cachedLive = false;
      cachedLiveAt = Date.now();
      return false;
    }
    const body = (await res.json()) as { live?: boolean };
    cachedLive = Boolean(body.live);
    cachedLiveAt = Date.now();
    return cachedLive;
  } catch {
    cachedLive = false;
    cachedLiveAt = Date.now();
    return false;
  }
}

async function ensureSession(envelope: AnalystContextEnvelope): Promise<string> {
  const key = `${envelope.orgId}:${envelope.plantId}:${envelope.userId}`;
  if (liveSessionId && liveSessionKey === key) return liveSessionId;
  const res = await fetch(bffUrl("/api/analyst/sessions"), {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      orgId: envelope.orgId,
      plantId: envelope.plantId,
      userId: envelope.userId,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text.slice(0, 200) || `session create ${res.status}`);
  }
  const body = (await res.json()) as { sessionId: string };
  liveSessionId = body.sessionId;
  liveSessionKey = key;
  return body.sessionId;
}

function parseSseChunk(
  buffer: string,
  handlers: AnalystStreamHandlers,
): string {
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";
  for (const block of parts) {
    if (!block.trim()) continue;
    let event = "message";
    const dataLines: string[] = [];
    for (const line of block.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
    }
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(dataLines.join("\n") || "{}") as Record<string, unknown>;
    } catch {
      data = { raw: dataLines.join("\n") };
    }
    if (event === "token" && typeof data.text === "string") {
      handlers.onToken?.(data.text);
    } else if (event === "tool") {
      handlers.onTool?.({
        name: String(data.name ?? "tool"),
        ok: Boolean(data.ok),
        summary: data.summary ? String(data.summary) : undefined,
      });
    } else if (event === "citation") {
      handlers.onCitation?.({
        id: String(data.id ?? data.title ?? "cite"),
        title: String(data.title ?? data.id ?? "Source"),
        snippet: data.snippet ? String(data.snippet) : undefined,
        path: normalizePath(data.path),
      });
    } else if (event === "done") {
      handlers.onDone?.({
        messageId: data.message_id != null ? String(data.message_id) : null,
        content: data.content != null ? String(data.content) : null,
        status: data.status ? String(data.status) : undefined,
      });
    } else if (event === "error") {
      handlers.onError?.(String(data.message ?? "Analyst stream error"));
    }
  }
  return rest;
}

function normalizePath(path: unknown): AnalystCitation["path"] {
  const p = String(path ?? "").toUpperCase();
  if (p === "G" || p === "D" || p === "B" || p === "H" || p === "W") return p;
  return undefined;
}

/** Create session (if needed) and stream an assistant reply via BFF SSE. */
export async function sendAnalystMessageStream(
  envelope: AnalystContextEnvelope,
  content: string,
  handlers: AnalystStreamHandlers,
): Promise<void> {
  const sessionId = await ensureSession(envelope);
  const res = await fetch(
    bffUrl(`/api/analyst/sessions/${encodeURIComponent(sessionId)}/messages/stream`),
    {
      method: "POST",
      credentials: "include",
      headers: {
        accept: "text/event-stream",
        "content-type": "application/json",
      },
      body: JSON.stringify({ content, envelope }),
    },
  );
  if (!res.ok || !res.body) {
    const text = await res.text();
    throw new Error(text.slice(0, 240) || `stream ${res.status}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    buffer = parseSseChunk(buffer, handlers);
  }
  if (buffer.trim()) parseSseChunk(`${buffer}\n\n`, handlers);
}
