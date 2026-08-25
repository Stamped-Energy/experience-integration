import type { FastifyInstance } from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import type { Auth } from "../auth/index.js";
import { AuthzError, requirePermission } from "../authz/index.js";
import type { Db } from "../db/client.js";
import { resolveActivePlant } from "../tenancy/service.js";
import type { L2QueryClient } from "../upstream/l2/client.js";
import { orgIdForExternalPlantId } from "../upstream/mappings.js";
import { buildEnergyBoard } from "./energy-board.js";
import { buildPlantMap } from "./plant-map.js";
import { buildSustainability } from "./sustainability.js";

export type InsightsRouteDeps = {
  auth: Auth;
  db: Db;
  createL2Client?: (orgId: string) => L2QueryClient | null;
};

function problem(
  reply: { status: (n: number) => { send: (b: unknown) => unknown } },
  status: number,
  detail: string,
  requestId: string,
) {
  return reply.status(status).send({
    type: `https://httpstatuses.com/${status}`,
    title:
      status === 401 ? "Unauthorized" : status === 403 ? "Forbidden" : "Error",
    status,
    detail,
    request_id: requestId,
  });
}

async function resolvePlant(
  deps: InsightsRouteDeps,
  userId: string,
  orgId: string | undefined,
  plantId: string | undefined,
) {
  const resolved = await resolveActivePlant(deps.db, { userId, orgId });
  return (
    resolved.authorized.find((p) => p.externalPlantId === plantId) ??
    resolved.activePlant ??
    resolved.authorized[0] ??
    null
  );
}

export async function registerInsightsRoutes(
  app: FastifyInstance,
  deps: InsightsRouteDeps,
): Promise<void> {
  app.get("/api/insights/energy", async (request, reply) => {
    const session = await deps.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) {
      return problem(reply, 401, "Session required", request.id);
    }

    const q = request.query as { plantId?: string; orgId?: string };
    const plant = await resolvePlant(
      deps,
      session.user.id,
      q.orgId,
      q.plantId,
    );
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
    const board = await buildEnergyBoard({
      plantId: plant.externalPlantId,
      l2,
    });
    return board;
  });

  app.get("/api/insights/plant-map", async (request, reply) => {
    const session = await deps.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) {
      return problem(reply, 401, "Session required", request.id);
    }

    const q = request.query as { plantId?: string; orgId?: string };
    const plant = await resolvePlant(
      deps,
      session.user.id,
      q.orgId,
      q.plantId,
    );
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
    return buildPlantMap({
      plantId: plant.externalPlantId,
      l2,
    });
  });

  app.get("/api/insights/sustainability", async (request, reply) => {
    const session = await deps.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) {
      return problem(reply, 401, "Session required", request.id);
    }

    const q = request.query as { plantId?: string; orgId?: string };
    const plant = await resolvePlant(
      deps,
      session.user.id,
      q.orgId,
      q.plantId,
    );
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
    return buildSustainability({
      plantId: plant.externalPlantId,
      l2,
    });
  });
}
