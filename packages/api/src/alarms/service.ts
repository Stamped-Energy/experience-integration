import {
  AlarmSeveritySchema,
  AlarmStateSchema,
  type AlarmSeverity,
  type AlarmState,
} from "@stamped/l6-contracts";
import { z } from "zod";
import { UpstreamError } from "../upstream/http.js";
import {
  L5WorkflowClient,
  toProductAlarm,
  type L5Alarm,
} from "../upstream/l5/client.js";
import { alarmStateToUi } from "../upstream/mappings.js";

export const ProductAlarmSchema = z.object({
  id: z.string(),
  plantId: z.string(),
  assetId: z.string(),
  assetLabel: z.string(),
  severity: AlarmSeveritySchema,
  state: AlarmStateSchema,
  summary: z.string(),
  raisedAt: z.string(),
  relatedPrescriptionId: z.string().optional(),
  findingId: z.string().optional(),
  ownerRole: z.string().optional(),
});
export type ProductAlarm = z.infer<typeof ProductAlarmSchema>;

const SEVERITY_RANK: Record<AlarmSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

export function sortProductAlarms(alarms: readonly ProductAlarm[]): ProductAlarm[] {
  return [...alarms].sort((a, b) => {
    const sev = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (sev !== 0) return sev;
    return Date.parse(a.raisedAt) - Date.parse(b.raisedAt);
  });
}

/** In-memory fixture store for Auto mode when L5 is unreachable / fixture-only. */
export function createFixtureAlarmStore(seed: ProductAlarm[]) {
  let rows = seed.map((a) => ({ ...a }));
  return {
    list(plantId: string) {
      return sortProductAlarms(rows.filter((a) => a.plantId === plantId));
    },
    get(id: string) {
      return rows.find((a) => a.id === id) ?? null;
    },
    transition(id: string, state: AlarmState) {
      const idx = rows.findIndex((a) => a.id === id);
      if (idx < 0) return null;
      rows[idx] = { ...rows[idx]!, state };
      return rows[idx]!;
    },
  };
}

export type AlarmStore = ReturnType<typeof createFixtureAlarmStore>;

export type ListAlarmsSource = "l5" | "fixture" | "unavailable";

export async function listAlarmsForPlant(input: {
  l5?: L5WorkflowClient | null;
  fixture: AlarmStore;
  orgId: string;
  plantId: string;
  /** When true, never substitute in-memory fixtures. */
  strictLive?: boolean;
}): Promise<{ items: ProductAlarm[]; source: ListAlarmsSource; detail?: string }> {
  if (input.l5) {
    try {
      const { items } = await input.l5.listAlarms({
        orgId: input.orgId,
        plantId: input.plantId,
      });
      return {
        source: "l5",
        items: sortProductAlarms(items.map((a) => toProductAlarm(a) as ProductAlarm)),
      };
    } catch (err) {
      if (!(err instanceof UpstreamError)) throw err;
      if (input.strictLive) {
        return {
          source: "unavailable",
          items: [],
          detail: err.message || "L5 unreachable",
        };
      }
      // fall through to fixture
    }
  }
  if (input.strictLive) {
    return {
      source: "unavailable",
      items: [],
      detail: input.l5 ? "L5 unreachable" : "L5 live gate off",
    };
  }
  return { source: "fixture", items: input.fixture.list(input.plantId) };
}

export async function mutateAlarm(input: {
  l5?: L5WorkflowClient | null;
  fixture: AlarmStore;
  action: "ack" | "escalate" | "silence" | "unsilence";
  alarmId: string;
  orgId: string;
  plantId: string;
  actorId: string;
  idempotencyKey: string;
}): Promise<ProductAlarm> {
  const current = input.fixture.get(input.alarmId);
  if (!current) {
    throw new UpstreamError("NOT_FOUND", "Alarm not found", 404);
  }
  const ui = alarmStateToUi(current.state);
  if (!ui.allowedActions.includes(input.action)) {
    throw new UpstreamError(
      "ILLEGAL_TRANSITION",
      `Cannot ${input.action} from ${current.state}`,
      409,
    );
  }

  if (input.l5) {
    try {
      const body = {
        orgId: input.orgId,
        plantId: input.plantId,
        actorId: input.actorId,
      };
      let alarm: L5Alarm;
      if (input.action === "ack") {
        alarm = await input.l5.ackAlarm(input.alarmId, body, input.idempotencyKey);
      } else if (input.action === "escalate") {
        alarm = await input.l5.escalateAlarm(
          input.alarmId,
          body,
          input.idempotencyKey,
        );
      } else if (input.action === "silence") {
        alarm = await input.l5.silenceAlarm(
          input.alarmId,
          body,
          input.idempotencyKey,
        );
      } else {
        alarm = await input.l5.unsilenceAlarm(
          input.alarmId,
          body,
          input.idempotencyKey,
        );
      }
      return toProductAlarm(alarm) as ProductAlarm;
    } catch (err) {
      if (
        err instanceof UpstreamError &&
        err.code === "UPSTREAM_FEATURE_UNAVAILABLE"
      ) {
        // Feature-gated — apply fixture transition for product Auto mode
      } else if (err instanceof UpstreamError) {
        throw err;
      } else {
        throw err;
      }
    }
  }

  const nextState =
    input.action === "ack"
      ? "acked"
      : input.action === "escalate"
        ? "escalated"
        : input.action === "silence"
          ? "silenced"
          : "acked";
  const updated = input.fixture.transition(input.alarmId, nextState);
  if (!updated) {
    throw new UpstreamError("NOT_FOUND", "Alarm not found", 404);
  }
  return updated;
}
