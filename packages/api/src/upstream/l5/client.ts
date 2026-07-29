import {
  AlarmSeveritySchema,
  AlarmStateSchema,
  WorkflowEventSchema,
  type AlarmSeverity,
  type AlarmState,
  type WorkflowEvent,
} from "@stamped/l6-contracts";
import { UpstreamError, upstreamFetch } from "../http.js";
import { z } from "zod";

export type L5FeatureFlags = {
  /** When false, ack/escalate/unsilence return structured unavailable (upstream gap). */
  alarmAck: boolean;
  alarmEscalate: boolean;
  alarmUnsilence: boolean;
};

export type L5ClientOptions = {
  baseUrl: string;
  timeoutMs: number;
  features: L5FeatureFlags;
  /** Optional API key — sent as X-API-Key (L5 bootstrap / service key). */
  authToken?: string;
};

/** Wire schema: accepts L5-native fields and normalizes severity/state. */
const L5AlarmWireSchema = z
  .object({
    id: z.string().min(1).optional(),
    alarm_id: z.string().min(1).optional(),
    org_id: z.string().min(1),
    plant_id: z.string().min(1),
    asset_id: z.string().optional(),
    asset_label: z.string().optional(),
    severity: z.string().min(1),
    state: z.string().min(1),
    summary: z.string().optional(),
    raised_at: z.string().optional(),
    related_prescription_id: z.string().optional(),
    prescription_id: z.string().optional(),
    finding_id: z.string().optional(),
    category_code: z.string().nullable().optional(),
  })
  .transform((raw) => {
    const id = raw.id ?? raw.alarm_id;
    if (!id) throw new Error("L5 alarm missing id/alarm_id");
    return {
      id,
      org_id: raw.org_id,
      plant_id: raw.plant_id,
      asset_id: raw.asset_id ?? "plant",
      asset_label: raw.asset_label ?? raw.asset_id ?? raw.plant_id,
      severity: mapSeverity(raw.severity),
      state: mapState(raw.state),
      summary:
        raw.summary ??
        raw.category_code ??
        `Alarm ${id} for ${raw.prescription_id ?? "prescription"}`,
      raised_at: raw.raised_at && raw.raised_at.length > 0 ? raw.raised_at : new Date().toISOString(),
      related_prescription_id: raw.related_prescription_id ?? raw.prescription_id,
      finding_id: raw.finding_id,
    };
  })
  .pipe(
    z.object({
      id: z.string().min(1),
      org_id: z.string().min(1),
      plant_id: z.string().min(1),
      asset_id: z.string().min(1),
      asset_label: z.string(),
      severity: AlarmSeveritySchema,
      state: AlarmStateSchema,
      summary: z.string(),
      raised_at: z.string().min(1),
      related_prescription_id: z.string().optional(),
      finding_id: z.string().optional(),
    }),
  );

export type L5Alarm = z.infer<typeof L5AlarmWireSchema>;

function mapSeverity(raw: string): AlarmSeverity {
  const s = raw.toLowerCase();
  if (s === "critical" || s === "error" || s === "high") return "critical";
  if (s === "warning" || s === "medium") return "warning";
  return "info";
}

function mapState(raw: string): AlarmState {
  const s = raw.toLowerCase();
  if (s === "acked" || s === "acknowledged") return "acked";
  if (s === "escalated") return "escalated";
  if (s === "silenced") return "silenced";
  if (s === "cleared") return "cleared";
  return "raised";
}

const ListAlarmsResponseSchema = z.object({
  items: z.array(L5AlarmWireSchema),
  next_cursor: z.union([z.string(), z.number(), z.null()]).optional(),
});

const ListEventsResponseSchema = z.object({
  items: z.array(WorkflowEventSchema),
  next_cursor: z.union([z.string(), z.number(), z.null()]).optional(),
});

const L5PrescriptionListSchema = z.object({
  items: z.array(z.record(z.string(), z.unknown())).optional(),
  prescriptions: z.array(z.record(z.string(), z.unknown())).optional(),
  next_cursor: z.union([z.string(), z.number(), z.null()]).optional(),
});

export type AlarmActionBody = {
  orgId: string;
  plantId: string;
  actorId?: string | null;
  reason?: string | null;
};

export class L5WorkflowClient {
  constructor(private readonly opts: L5ClientOptions) {}

  private headers(): Record<string, string> {
    if (!this.opts.authToken) return {};
    // L5 auth is X-API-Key; accept raw key or already-prefixed values.
    const token = this.opts.authToken.trim();
    if (token.toLowerCase().startsWith("bearer ")) {
      return { authorization: token };
    }
    return { "x-api-key": token };
  }

  async listAlarms(input: {
    orgId: string;
    plantId: string;
    cursor?: string;
  }): Promise<{ items: L5Alarm[]; nextCursor: string | null }> {
    const raw = await upstreamFetch<unknown>({
      baseUrl: this.opts.baseUrl,
      path: `v1/plants/${encodeURIComponent(input.plantId)}/alarms`,
      query: {
        org_id: input.orgId,
        cursor: input.cursor,
      },
      timeoutMs: this.opts.timeoutMs,
      headers: this.headers(),
    });
    const parsed = ListAlarmsResponseSchema.parse(raw);
    return {
      items: parsed.items,
      nextCursor:
        parsed.next_cursor === undefined || parsed.next_cursor === null
          ? null
          : String(parsed.next_cursor),
    };
  }

  async getAlarm(alarmId: string, input?: { orgId?: string; plantId?: string }): Promise<L5Alarm> {
    // Prefer plant-scoped list filter when plant is known; fall back to silence GET shape.
    if (input?.plantId && input.orgId) {
      const { items } = await this.listAlarms({ orgId: input.orgId, plantId: input.plantId });
      const found = items.find((a) => a.id === alarmId);
      if (found) return found;
      throw new UpstreamError("NOT_FOUND", `Alarm ${alarmId} not found`, 404);
    }
    const raw = await upstreamFetch<unknown>({
      baseUrl: this.opts.baseUrl,
      path: `v1/alarms/${encodeURIComponent(alarmId)}`,
      timeoutMs: this.opts.timeoutMs,
      headers: this.headers(),
    });
    return L5AlarmWireSchema.parse(raw);
  }

  async listPrescriptions(input: {
    orgId: string;
    plantId: string;
    cursor?: string;
  }): Promise<{ items: Record<string, unknown>[]; nextCursor: string | null }> {
    const raw = await upstreamFetch<unknown>({
      baseUrl: this.opts.baseUrl,
      path: `v1/plants/${encodeURIComponent(input.plantId)}/prescriptions`,
      query: {
        org_id: input.orgId,
        cursor: input.cursor,
      },
      timeoutMs: this.opts.timeoutMs,
      headers: this.headers(),
    });
    const parsed = L5PrescriptionListSchema.parse(raw);
    const items = parsed.items ?? parsed.prescriptions ?? [];
    return {
      items,
      nextCursor:
        parsed.next_cursor === undefined || parsed.next_cursor === null
          ? null
          : String(parsed.next_cursor),
    };
  }

  async listEvents(input: {
    orgId: string;
    plantId: string;
    since?: string;
    cursor?: string;
  }): Promise<{ items: WorkflowEvent[]; nextCursor: string | null }> {
    const raw = await upstreamFetch<unknown>({
      baseUrl: this.opts.baseUrl,
      path: "v1/events",
      query: {
        org_id: input.orgId,
        plant_id: input.plantId,
        since: input.since,
        cursor: input.cursor,
      },
      timeoutMs: this.opts.timeoutMs,
      headers: this.headers(),
    });
    const parsed = ListEventsResponseSchema.parse(raw);
    return {
      items: parsed.items,
      nextCursor:
        parsed.next_cursor === undefined || parsed.next_cursor === null
          ? null
          : String(parsed.next_cursor),
    };
  }

  async silenceAlarm(
    alarmId: string,
    body: AlarmActionBody,
    idempotencyKey: string,
  ): Promise<L5Alarm> {
    return this.mutate("silence", alarmId, body, idempotencyKey, true);
  }

  async ackAlarm(
    alarmId: string,
    body: AlarmActionBody,
    idempotencyKey: string,
  ): Promise<L5Alarm> {
    return this.mutate("ack", alarmId, body, idempotencyKey, this.opts.features.alarmAck);
  }

  async escalateAlarm(
    alarmId: string,
    body: AlarmActionBody,
    idempotencyKey: string,
  ): Promise<L5Alarm> {
    return this.mutate(
      "escalate",
      alarmId,
      body,
      idempotencyKey,
      this.opts.features.alarmEscalate,
    );
  }

  async unsilenceAlarm(
    alarmId: string,
    body: AlarmActionBody,
    idempotencyKey: string,
  ): Promise<L5Alarm> {
    return this.mutate(
      "unsilence",
      alarmId,
      body,
      idempotencyKey,
      this.opts.features.alarmUnsilence,
    );
  }

  private async mutate(
    action: "silence" | "ack" | "escalate" | "unsilence",
    alarmId: string,
    body: AlarmActionBody,
    idempotencyKey: string,
    enabled: boolean,
  ): Promise<L5Alarm> {
    if (!enabled) {
      throw new UpstreamError(
        "UPSTREAM_FEATURE_UNAVAILABLE",
        `L5 ${action} is not published yet — feature-gated in L6`,
        501,
        { action, x_stamped_status: "upstream_missing" },
      );
    }
    if (!idempotencyKey.trim()) {
      throw new UpstreamError(
        "IDEMPOTENCY_KEY_REQUIRED",
        "Idempotency-Key is required for alarm lifecycle mutations",
        400,
      );
    }
    // L5 publishes silence at /v1/alarms/{id}/silence; ack/escalate may be feature-gated.
    const path =
      action === "silence"
        ? `v1/alarms/${encodeURIComponent(alarmId)}/silence`
        : `v1/alarms/${encodeURIComponent(alarmId)}/${action}`;
    const raw = await upstreamFetch<unknown>({
      baseUrl: this.opts.baseUrl,
      path,
      method: "POST",
      body: {
        org_id: body.orgId,
        plant_id: body.plantId,
        actor_id: body.actorId ?? null,
        reason: body.reason ?? null,
        minutes: 60,
      },
      idempotencyKey,
      timeoutMs: this.opts.timeoutMs,
      headers: this.headers(),
    });
    // Silence response is sparse — re-list to hydrate.
    if (raw && typeof raw === "object" && "alarm_id" in (raw as object) && !("summary" in (raw as object))) {
      return this.getAlarm(alarmId, { orgId: body.orgId, plantId: body.plantId });
    }
    return L5AlarmWireSchema.parse(raw);
  }
}

/** Map L5 wire alarm → product shape used by web fixtures. */
export function toProductAlarm(a: L5Alarm): {
  id: string;
  plantId: string;
  assetId: string;
  assetLabel: string;
  severity: AlarmSeverity;
  state: AlarmState;
  summary: string;
  raisedAt: string;
  relatedPrescriptionId?: string;
  findingId?: string;
} {
  return {
    id: a.id,
    plantId: a.plant_id,
    assetId: a.asset_id,
    assetLabel: a.asset_label ?? a.asset_id,
    severity: a.severity,
    state: a.state,
    summary: a.summary,
    raisedAt: a.raised_at,
    relatedPrescriptionId: a.related_prescription_id,
    findingId: a.finding_id,
  };
}

export function defaultL5FeaturesFromEnv(env: NodeJS.ProcessEnv): L5FeatureFlags {
  const on = (k: string) => env[k] === "true";
  return {
    alarmAck: on("L5_FEATURE_ALARM_ACK"),
    alarmEscalate: on("L5_FEATURE_ALARM_ESCALATE"),
    alarmUnsilence: on("L5_FEATURE_ALARM_UNSILENCE"),
  };
}

/** Build plant-scoped alarm list URL (exported for unit tests). */
export function l5AlarmsPath(plantId: string): string {
  return `v1/plants/${encodeURIComponent(plantId)}/alarms`;
}

export function l5PrescriptionsPath(plantId: string): string {
  return `v1/plants/${encodeURIComponent(plantId)}/prescriptions`;
}
