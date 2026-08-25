import type { FastifyInstance } from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import type { Auth } from "../auth/index.js";
import { AuthzError, requirePermission } from "../authz/index.js";
import type { Db } from "../db/client.js";
import { resolveActivePlant } from "../tenancy/service.js";
import type { L5WorkflowClient } from "../upstream/l5/client.js";
import type { L2QueryClient } from "../upstream/l2/client.js";
import { orgIdForExternalPlantId } from "../upstream/mappings.js";
import {
  createFixtureAlarmStore,
  type AlarmStore,
} from "../alarms/service.js";
import {
  createFixturePrescriptionStore,
  type PrescriptionStore,
} from "../prescriptions/service.js";
import { buildOverview } from "./service.js";

export type OverviewRouteDeps = {
  auth: Auth;
  db: Db;
  l5?: L5WorkflowClient | null;
  createL2Client?: (orgId: string) => L2QueryClient | null;
  alarmFixture?: AlarmStore;
  prescriptionFixture?: PrescriptionStore;
  strictLive?: boolean;
};

function problem(
  reply: { status: (n: number) => { send: (b: unknown) => unknown } },
  status: number,
  detail: string,
  requestId: string,
) {
  return reply.status(status).send({
    type: `https://httpstatuses.com/${status}`,
    title: status === 401 ? "Unauthorized" : status === 403 ? "Forbidden" : "Error",
    status,
    detail,
    request_id: requestId,
  });
}

export async function registerOverviewRoutes(
  app: FastifyInstance,
  deps: OverviewRouteDeps,
): Promise<void> {
  const alarmFixture = deps.alarmFixture ?? createFixtureAlarmStore([]);
  const prescriptionFixture =
    deps.prescriptionFixture ?? createFixturePrescriptionStore([]);

  app.get("/api/overview", async (request, reply) => {
    const session = await deps.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) {
      return problem(reply, 401, "Session required", request.id);
    }

    const q = request.query as { plantId?: string; orgId?: string };
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

    const orgId = orgIdForExternalPlantId(plant.externalPlantId);
    const l2 = deps.createL2Client?.(orgId) ?? null;
    const overview = await buildOverview({
      plantId: plant.externalPlantId,
      orgId,
      l2,
      l5: deps.l5 ?? null,
      alarmFixture,
      prescriptionFixture,
      strictLive: Boolean(deps.strictLive),
    });
    return overview;
  });
}
