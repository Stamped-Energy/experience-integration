import type { FastifyInstance } from "fastify";
import type { IncomingHttpHeaders } from "node:http";
import { fromNodeHeaders } from "better-auth/node";
import type { Auth } from "../auth/index.js";
import { AuthzError, requirePermission } from "../authz/index.js";
import type { Db } from "../db/client.js";
import { resolveActivePlant } from "../tenancy/service.js";
import type { L2QueryClient } from "../upstream/l2/client.js";
import type { L5WorkflowClient } from "../upstream/l5/client.js";
import { orgIdForExternalPlantId } from "../upstream/mappings.js";
import { UpstreamError } from "../upstream/http.js";
import { assembleAlarmCase, assemblePrescriptionCase } from "./assemble.js";

export type CaseRouteDeps = {
  auth: Auth;
  db: Db;
  l5?: L5WorkflowClient | null;
  createL2Client?: ((orgId: string) => L2QueryClient | null) | null;
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

async function resolvePlant(
  deps: CaseRouteDeps,
  request: { headers: IncomingHttpHeaders; id: string; query?: unknown },
  reply: { status: (n: number) => { send: (b: unknown) => unknown } },
  permission: "prescription:read" | "alarm:read",
) {
  const session = await deps.auth.api.getSession({
    headers: fromNodeHeaders(request.headers),
  });
  if (!session) {
    problem(reply, 401, "Session required", request.id);
    return null;
  }
  const q = (request.query ?? {}) as { orgId?: string; plantId?: string };
  const resolved = await resolveActivePlant(deps.db, {
    userId: session.user.id,
    orgId: q.orgId,
  });
  const plant =
    resolved.authorized.find((p) => p.externalPlantId === q.plantId) ??
    resolved.activePlant ??
    resolved.authorized[0];
  if (!plant) {
    problem(reply, 403, "No plant membership", request.id);
    return null;
  }
  try {
    requirePermission(plant.role, permission);
  } catch (err) {
    if (err instanceof AuthzError) {
      problem(reply, 403, err.message, request.id);
      return null;
    }
    throw err;
  }
  return plant;
}

export async function registerCaseRoutes(
  app: FastifyInstance,
  deps: CaseRouteDeps,
): Promise<void> {
  app.get("/api/cases/prescription/:id", async (request, reply) => {
    const plant = await resolvePlant(deps, request, reply, "prescription:read");
    if (!plant) return;
    if (!deps.l5) {
      return problem(reply, 503, "L5 not configured", request.id, "Unavailable");
    }
    const { id } = request.params as { id: string };
    const orgId = orgIdForExternalPlantId(plant.externalPlantId);
    const l2 = deps.createL2Client?.(orgId) ?? null;
    try {
      return await assemblePrescriptionCase({
        l5: deps.l5,
        l2,
        orgId,
        plantId: plant.externalPlantId,
        prescriptionId: id,
      });
    } catch (err) {
      if (err instanceof UpstreamError) {
        return problem(reply, err.status || 502, err.message, request.id, "Upstream Error");
      }
      throw err;
    }
  });

  app.get("/api/cases/alarm/:id", async (request, reply) => {
    const plant = await resolvePlant(deps, request, reply, "alarm:read");
    if (!plant) return;
    if (!deps.l5) {
      return problem(reply, 503, "L5 not configured", request.id, "Unavailable");
    }
    const { id } = request.params as { id: string };
    const orgId = orgIdForExternalPlantId(plant.externalPlantId);
    const l2 = deps.createL2Client?.(orgId) ?? null;
    try {
      return await assembleAlarmCase({
        l5: deps.l5,
        l2,
        orgId,
        plantId: plant.externalPlantId,
        alarmId: id,
      });
    } catch (err) {
      if (err instanceof UpstreamError) {
        return problem(reply, err.status || 502, err.message, request.id, "Upstream Error");
      }
      throw err;
    }
  });

  app.get("/api/evidence/by-rx", async (request, reply) => {
    const plant = await resolvePlant(deps, request, reply, "prescription:read");
    if (!plant) return;
    if (!deps.l5) {
      return problem(reply, 503, "L5 not configured", request.id, "Unavailable");
    }
    const q = request.query as { rxId?: string };
    if (!q.rxId) {
      return problem(reply, 400, "rxId required", request.id, "Bad Request");
    }
    const orgId = orgIdForExternalPlantId(plant.externalPlantId);
    const l2 = deps.createL2Client?.(orgId) ?? null;
    try {
      return await assemblePrescriptionCase({
        l5: deps.l5,
        l2,
        orgId,
        plantId: plant.externalPlantId,
        prescriptionId: q.rxId,
      });
    } catch (err) {
      if (err instanceof UpstreamError) {
        return problem(reply, err.status || 502, err.message, request.id, "Upstream Error");
      }
      throw err;
    }
  });
}
