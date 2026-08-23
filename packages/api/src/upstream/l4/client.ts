import { RoleSchema } from "@stamped/l6-contracts";
import { z } from "zod";
import { UpstreamError, upstreamFetch } from "../http.js";

export type L4ClientOptions = {
  baseUrl: string;
  timeoutMs: number;
  authToken?: string;
  /** When false, return fixture responses instead of calling live L4. */
  live: boolean;
};

export const AnalystContextEnvelopeSchema = z.object({
  orgId: z.string().min(1),
  plantId: z.string().min(1),
  userId: z.string().min(1),
  role: RoleSchema,
  routeId: z.string().min(1),
  screenTitle: z.string().min(1),
  focusEntity: z
    .object({
      type: z.enum(["alarm", "prescription", "asset", "ledger_entry"]),
      id: z.string().min(1),
    })
    .optional(),
  visibleSummary: z.array(z.string()),
  timeRange: z
    .object({ from: z.string().min(1), to: z.string().min(1) })
    .optional(),
  excludeKeys: z.array(z.string()).optional(),
});
export type AnalystContextEnvelope = z.infer<typeof AnalystContextEnvelopeSchema>;

const CitationSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  uri: z.string().optional(),
  snippet: z.string().optional(),
  path: z.string().optional(),
  tier: z.string().optional(),
});

const SessionSchema = z.object({
  session_id: z.string().min(1),
  org_id: z.string().min(1),
  plant_id: z.string().min(1),
  created_at: z.string().min(1),
});

const MessageResponseSchema = z.object({
  message_id: z.string().min(1),
  session_id: z.string().min(1),
  role: z.enum(["assistant", "user"]),
  content: z.string(),
  citations: z.array(CitationSchema).default([]),
  created_at: z.string().min(1),
  status: z.string().optional(),
});

export type AnalystSseEvent =
  | { event: "token"; text: string }
  | { event: "tool"; name: string; ok: boolean; summary?: string }
  | {
      event: "citation";
      id?: string;
      title?: string;
      path?: string;
      snippet?: string;
      tier?: string;
    }
  | {
      event: "done";
      message_id?: string | null;
      content?: string | null;
      status?: string;
      citations?: unknown[];
    }
  | { event: "error"; message: string };

/** Wire projection of the charter envelope — never silent page scrape. */
export function projectContextEnvelope(envelope: AnalystContextEnvelope) {
  const parsed = AnalystContextEnvelopeSchema.parse(envelope);
  const excluded = new Set(parsed.excludeKeys ?? []);
  const chips = [
    { key: "screen", value: parsed.screenTitle },
    { key: "route", value: parsed.routeId },
    {
      key: "focus",
      value: parsed.focusEntity
        ? `${parsed.focusEntity.type}:${parsed.focusEntity.id}`
        : "",
    },
    ...(parsed.timeRange
      ? [{ key: "range", value: `${parsed.timeRange.from}→${parsed.timeRange.to}` }]
      : []),
    ...parsed.visibleSummary.map((s, i) => ({ key: `summary:${i}`, value: s })),
  ].filter((c) => c.value && !excluded.has(c.key));

  const chipStrings = chips.map((c) =>
    c.key === "focus" && parsed.focusEntity?.type === "asset"
      ? `asset:${parsed.focusEntity.id}`
      : `${c.key}:${c.value}`,
  );

  return {
    org_id: parsed.orgId,
    plant_id: parsed.plantId,
    user_id: parsed.userId,
    role: parsed.role,
    route_id: parsed.routeId,
    screen_title: parsed.screenTitle,
    focus: parsed.focusEntity ?? null,
    focus_entity: parsed.focusEntity ?? null,
    time_range: parsed.timeRange ?? null,
    visible_chips: chips,
    chips: chipStrings,
  };
}

export function assertEnvelopeTenant(
  envelope: AnalystContextEnvelope,
  entityPlantId: string | undefined,
): void {
  if (entityPlantId && entityPlantId !== envelope.plantId) {
    throw new UpstreamError(
      "TENANT_MISMATCH",
      "Focus entity plant does not match analyst envelope plant",
      403,
    );
  }
}

function normalizeCitations(raw: unknown): z.infer<typeof CitationSchema>[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((c, i) => {
    const row = (c ?? {}) as Record<string, unknown>;
    return CitationSchema.parse({
      id: String(row.id ?? row.source ?? `cite_${i}`),
      title: String(row.title ?? row.source ?? "Source"),
      uri: row.uri ? String(row.uri) : undefined,
      snippet: row.snippet ? String(row.snippet) : undefined,
      path: row.path ? String(row.path) : undefined,
      tier: row.tier ? String(row.tier) : undefined,
    });
  });
}

export class L4AnalystClient {
  constructor(private readonly opts: L4ClientOptions) {}

  private authHeader(): Record<string, string> {
    return this.opts.authToken
      ? { authorization: `Bearer ${this.opts.authToken}` }
      : {};
  }

  private tenantHeaders(input: {
    orgId: string;
    plantId: string;
    userId: string;
  }): Record<string, string> {
    return {
      ...this.authHeader(),
      "X-Org-Id": input.orgId,
      "X-Plant-Id": input.plantId,
      "X-User-Id": input.userId,
    };
  }

  async createSession(input: {
    orgId: string;
    plantId: string;
    userId: string;
  }) {
    if (!this.opts.live) {
      return SessionSchema.parse({
        session_id: `sess_fixture_${input.plantId}`,
        org_id: input.orgId,
        plant_id: input.plantId,
        created_at: new Date().toISOString(),
      });
    }
    const raw = await upstreamFetch<Record<string, unknown>>({
      baseUrl: this.opts.baseUrl,
      path: "v1/chat/sessions",
      method: "POST",
      body: {
        org_id: input.orgId,
        plant_id: input.plantId,
        user_id: input.userId,
      },
      timeoutMs: this.opts.timeoutMs,
      headers: this.tenantHeaders(input),
    });
    return SessionSchema.parse({
      session_id: String(raw.id ?? raw.session_id),
      org_id: String(raw.org_id ?? input.orgId),
      plant_id: String(raw.plant_id ?? input.plantId),
      created_at: String(raw.created_at ?? new Date().toISOString()),
    });
  }

  async postMessage(input: {
    sessionId: string;
    content: string;
    envelope: AnalystContextEnvelope;
    entityPlantId?: string;
  }) {
    assertEnvelopeTenant(input.envelope, input.entityPlantId);
    const context = projectContextEnvelope(input.envelope);

    if (!this.opts.live) {
      const focus = context.focus_entity
        ? ` Focus ${context.focus_entity.type} ${context.focus_entity.id}.`
        : "";
      return MessageResponseSchema.parse({
        message_id: `msg_fixture_${Date.now()}`,
        session_id: input.sessionId,
        role: "assistant",
        content: `Fixture analyst for ${context.plant_id}.${focus} Chips: ${context.visible_chips
          .map((c) => c.key)
          .join(", ")}.`,
        citations: [
          {
            id: "cite_fixture_1",
            title: "Plant context (fixture)",
            snippet: context.screen_title,
            path: "H",
          },
        ],
        created_at: new Date().toISOString(),
        status: "OK",
      });
    }

    const raw = await upstreamFetch<Record<string, unknown>>({
      baseUrl: this.opts.baseUrl,
      path: `v1/chat/sessions/${encodeURIComponent(input.sessionId)}/messages`,
      method: "POST",
      body: {
        content: input.content,
        context,
      },
      timeoutMs: this.opts.timeoutMs,
      headers: this.tenantHeaders({
        orgId: input.envelope.orgId,
        plantId: input.envelope.plantId,
        userId: input.envelope.userId,
      }),
    });

    const content = String(raw.content ?? "");
    return MessageResponseSchema.parse({
      message_id: String(raw.message_id ?? `msg_${Date.now()}`),
      session_id: input.sessionId,
      role: "assistant",
      content,
      citations: normalizeCitations(raw.citations),
      created_at: new Date().toISOString(),
      status: String(raw.status ?? "OK"),
    });
  }

  /**
   * Live SSE stream against L4. Caller must drain the body.
   * Fixture mode returns a synthetic SSE Response.
   */
  async openMessageStream(input: {
    sessionId: string;
    content: string;
    envelope: AnalystContextEnvelope;
    entityPlantId?: string;
  }): Promise<Response> {
    assertEnvelopeTenant(input.envelope, input.entityPlantId);
    const context = projectContextEnvelope(input.envelope);

    if (!this.opts.live) {
      const msg = await this.postMessage(input);
      const frames = [
        `event: citation\ndata: ${JSON.stringify(msg.citations[0] ?? {})}\n\n`,
        ...chunkText(msg.content, 28).map(
          (text) => `event: token\ndata: ${JSON.stringify({ text })}\n\n`,
        ),
        `event: done\ndata: ${JSON.stringify({
          message_id: msg.message_id,
          content: msg.content,
          status: "OK",
          citations: msg.citations,
        })}\n\n`,
      ];
      return new Response(frames.join(""), {
        status: 200,
        headers: { "content-type": "text/event-stream" },
      });
    }

    const base = this.opts.baseUrl.endsWith("/")
      ? this.opts.baseUrl
      : `${this.opts.baseUrl}/`;
    const url = new URL(
      `v1/chat/sessions/${encodeURIComponent(input.sessionId)}/messages/stream`,
      base,
    );
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.opts.timeoutMs);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          accept: "text/event-stream",
          "content-type": "application/json",
          ...this.tenantHeaders({
            orgId: input.envelope.orgId,
            plantId: input.envelope.plantId,
            userId: input.envelope.userId,
          }),
        },
        body: JSON.stringify({ content: input.content, context }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new UpstreamError(
          `UPSTREAM_${res.status}`,
          text.slice(0, 400) || `Upstream ${res.status}`,
          res.status,
        );
      }
      // Keep timer until body is consumed — attach cleanup via tee is heavy;
      // extend timeout for long generations by clearing on return of Response.
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof UpstreamError) throw err;
      if (err instanceof Error && err.name === "AbortError") {
        throw new UpstreamError(
          "UPSTREAM_TIMEOUT",
          "Timed out calling analyst stream",
          504,
        );
      }
      throw new UpstreamError(
        "UPSTREAM_NETWORK",
        err instanceof Error ? err.message : "Upstream network failure",
        502,
      );
    }
  }
}

function chunkText(text: string, size: number): string[] {
  if (!text) return [];
  const out: string[] = [];
  for (let i = 0; i < text.length; i += size) out.push(text.slice(i, i + size));
  return out;
}
