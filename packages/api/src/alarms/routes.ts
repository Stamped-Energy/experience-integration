import type { FastifyInstance } from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Auth } from "../auth/index.js";
import { AuthzError, requirePermission } from "../authz/index.js";
import type { Db } from "../db/client.js";
import { resolveActivePlant } from "../tenancy/service.js";
import { UpstreamError } from "../upstream/http.js";
import type { L5WorkflowClient } from "../upstream/l5/client.js";
import { orgIdForExternalPlantId } from "../upstream/mappings.js";
import {
  createFixtureAlarmStore,
  listAlarmsForPlant,
  mutateAlarm,
  type AlarmStore,
  type ProductAlarm,
} from "./service.js";

const ActionBody = z.object({
  action: z.enum(["ack", "escalate", "silence", "unsilence"]),
  orgId: z.string().min(1),
  plantId: z.string().min(1),
});

const DEFAULT_FIXTURE: ProductAlarm[] = [
  {
    id: "alm_1001",
    plantId: "plant_jaipur_01",
    assetId: "kiln_1",
    assetLabel: "Kiln 1",
    severity: "critical",
    state: "raised",
    summary: "Load 108% — MD coincidence risk",
    raisedAt: "2026-07-21T09:40:00+05:30",
    relatedPrescriptionId: "rx_9001",
  },
  {
    id: "alm_1002",
    plantId: "plant_jaipur_01",
    assetId: "cm_1",
    assetLabel: "Cement Mill 1",
    severity: "warning",
    state: "acked",
    summary: "PF drifting toward penalty slab",
    raisedAt: "2026-07-21T08:10:00+05:30",
  },
  {
    id: "alm_v1",
    plantId: "plant_vinayak_1",
    assetId: "kiln_1",
    assetLabel: "Kiln 1",
    severity: "critical",
    state: "raised",
    summary: "Load 112% — MD coincidence risk this TOD peak",
    raisedAt: "2026-07-21T09:20:00+05:30",
    relatedPrescriptionId: "rx_v001",
  },
  {
    id: "alm_v2",
    plantId: "plant_vinayak_1",
    assetId: "cm_1",
    assetLabel: "Cement Mill 1",
    severity: "warning",
    state: "raised",
    summary: "PF 0.86 drifting toward penalty slab",
    raisedAt: "2026-07-21T08:00:00+05:30",
  },
];

export type AlarmRouteDeps = {
  auth: Auth;
  db: Db;
  l5?: L5WorkflowClient | null;
  fixture?: AlarmStore;
  /** When true, never fall back to in-memory fixtures. */
  strictLive?: boolean;
};

function problem(
  reply: { status: (n: number) => { send: (b: unknown) => unknown } },
  status: number,
  detail: string,
  requestId: string,
  title?: string,
) {
  return reply.status(status).send({
    type: `https://httpstatuses.com/${status}`,
    title: title ?? (status === 401 ? "Unauthorized" : "Forbidden"),
    status,
    detail,
    request_id: requestId,
  });
}

export async function registerAlarmRoutes(
  app: FastifyInstance,
  deps: AlarmRouteDeps,
): Promise<void> {
  const fixture = deps.fixture ?? createFixtureAlarmStore(DEFAULT_FIXTURE);

  app.get("/api/alarms", async (request, reply) => {
    const session = await deps.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) {
      return problem(reply, 401, "Session required", request.id);
    }

    const q = request.query as { orgId?: string; plantId?: string };
    const resolved = await resolveActivePlant(deps.db, {
      userId: session.user.id,
      orgId: q.orgId,
    });
    const plant =
      resolved.authorized.find((p) => p.externalPlantId === q.plantId) ??
      resolved.activePlant ??
      resolved.authorized[0];
    if (!plant) {
      return problem(reply, 403, "No plant membership", request.id);
    }

    try {
      requirePermission(plant.role, "alarm:read");
    } catch (err) {
      if (err instanceof AuthzError) {
        return problem(reply, 403, err.message, request.id);
      }
      throw err;
    }

    const result = await listAlarmsForPlant({
      l5: deps.l5,
      fixture,
      orgId: orgIdForExternalPlantId(plant.externalPlantId),
      plantId: plant.externalPlantId,
      strictLive: deps.strictLive,
    });
    return {
      items: result.items,
      source: result.source,
      ...(result.detail ? { detail: result.detail } : {}),
    };
  });

  app.post("/api/alarms/:alarmId/actions", async (request, reply) => {
    const session = await deps.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) {
      return problem(reply, 401, "Session required", request.id);
    }

    const parsed = ActionBody.safeParse(request.body);
    if (!parsed.success) {
      return problem(reply, 400, parsed.error.message, request.id, "Bad Request");
    }

    const resolved = await resolveActivePlant(deps.db, {
      userId: session.user.id,
    });
    const plant =
      resolved.authorized.find(
        (p) => p.externalPlantId === parsed.data.plantId,
      ) ?? resolved.activePlant;
    if (!plant) {
      return problem(reply, 403, "No plant membership", request.id);
    }

    const permission =
      parsed.data.action === "ack"
        ? "alarm:ack"
        : parsed.data.action === "escalate"
          ? "alarm:escalate"
          : "alarm:silence";
    try {
      requirePermission(plant.role, permission);
    } catch (err) {
      if (err instanceof AuthzError) {
        return problem(reply, 403, err.message, request.id);
      }
      throw err;
    }

    const alarmId = (request.params as { alarmId: string }).alarmId;
    const idempotencyKey =
      (typeof request.headers["idempotency-key"] === "string" &&
        request.headers["idempotency-key"]) ||
      randomUUID();

    try {
      const alarm = await mutateAlarm({
        l5: deps.l5,
        fixture,
        action: parsed.data.action,
        alarmId,
        orgId: parsed.data.orgId,
        plantId: parsed.data.plantId,
        actorId: session.user.id,
        idempotencyKey,
      });
      return { alarm };
    } catch (err) {
      if (err instanceof UpstreamError) {
        return problem(reply, err.status, err.message, request.id, err.code);
      }
      throw err;
    }
  });
}
