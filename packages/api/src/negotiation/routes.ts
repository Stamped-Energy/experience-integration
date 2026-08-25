import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import { z } from "zod";
import type { Auth } from "../auth/index.js";
import { AuthzError, requirePermission } from "../authz/index.js";
import type { Db } from "../db/client.js";
import { resolveActivePlant } from "../tenancy/service.js";
import { UpstreamError } from "../upstream/http.js";
import type { L5WorkflowClient } from "../upstream/l5/client.js";
import { orgIdForExternalPlantId } from "../upstream/mappings.js";
import { acceptFixture, rejectFixture, reviseFixture } from "./fixture.js";

const BodySchema = z.object({
  orgId: z.string().min(1),
  plantId: z.string().min(1),
  prescriptionId: z.string().min(1).optional(),
  threadId: z.string().min(1).optional(),
  constraintSummary: z.string().optional(),
  constraints: z.record(z.string(), z.unknown()).optional(),
  reasonCode: z.string().optional(),
});

export type NegotiationRouteDeps = {
  auth: Auth;
  db: Db;
  discussEnabled?: boolean;
  l5?: L5WorkflowClient | null;
};

function problem(
  reply: { status: (n: number) => { send: (b: unknown) => unknown } },
  status: number,
  detail: string,
  requestId: string,
) {
  return reply.status(status).send({
    type: `https://httpstatuses.com/${status}`,
    title: status === 401 ? "Unauthorized" : "Error",
    status,
    detail,
    request_id: requestId,
  });
}

export async function registerNegotiationRoutes(
  app: FastifyInstance,
  deps: NegotiationRouteDeps,
) {
  const discussEnabled = deps.discussEnabled !== false;

  app.post("/api/prescriptions/:rxId/negotiation/revise", async (request, reply) => {
    if (!discussEnabled) {
      return problem(reply, 404, "Discuss disabled", request.id);
    }
    const session = await deps.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) {
      return problem(reply, 401, "Session required", request.id);
    }
    const parsed = BodySchema.safeParse(request.body);
    if (!parsed.success) {
      return problem(reply, 400, "Invalid body", request.id);
    }
    const resolved = await resolveActivePlant(deps.db, {
      userId: session.user.id,
      orgId: parsed.data.orgId,
    });
    const plant =
      resolved.authorized.find((p) => p.externalPlantId === parsed.data.plantId) ??
      resolved.activePlant;
    if (!plant) {
      return problem(reply, 403, "No plant membership", request.id);
    }
    try {
      requirePermission(plant.role, "prescription:read");
    } catch (err) {
      if (err instanceof AuthzError) {
        return problem(reply, 403, err.message, request.id);
      }
      throw err;
    }

    const rxId = (request.params as { rxId: string }).rxId;
    const idempotencyKey =
      (typeof request.headers["idempotency-key"] === "string" &&
        request.headers["idempotency-key"]) ||
      randomUUID();

    // Fixture-first proxy (live L4 revise wired when L4_LIVE + client methods land).
    return reviseFixture({
      orgId: parsed.data.orgId,
      plantId: parsed.data.plantId,
      prescriptionId: rxId,
      constraints: parsed.data.constraints ?? {},
      constraintSummary: parsed.data.constraintSummary,
      idempotencyKey,
    });
  });

  app.post("/api/prescriptions/:rxId/negotiation/accept", async (request, reply) => {
    if (!discussEnabled) {
      return problem(reply, 404, "Discuss disabled", request.id);
    }
    const session = await deps.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) {
      return problem(reply, 401, "Session required", request.id);
    }
    const parsed = BodySchema.safeParse(request.body);
    if (!parsed.success) {
      return problem(reply, 400, "Invalid body", request.id);
    }
    const resolved = await resolveActivePlant(deps.db, {
      userId: session.user.id,
      orgId: parsed.data.orgId,
    });
    const plant =
      resolved.authorized.find((p) => p.externalPlantId === parsed.data.plantId) ??
      resolved.activePlant;
    if (!plant) {
      return problem(reply, 403, "No plant membership", request.id);
    }
    try {
      requirePermission(plant.role, "alarm:ack");
    } catch (err) {
      if (err instanceof AuthzError) {
        return problem(reply, 403, err.message, request.id);
      }
      throw err;
    }
    if (!parsed.data.threadId) {
      return problem(reply, 400, "threadId required", request.id);
    }
    const idempotencyKey =
      (typeof request.headers["idempotency-key"] === "string" &&
        request.headers["idempotency-key"]) ||
      randomUUID();
    if (deps.l5) {
      try {
        const result = await deps.l5.acceptNegotiationThread({
          threadId: parsed.data.threadId,
          orgId: orgIdForExternalPlantId(plant.externalPlantId),
          plantId: plant.externalPlantId,
          actorId: session.user.id,
          idempotencyKey,
        });
        return { ...result, source: "l5" as const };
      } catch (err) {
        if (!(err instanceof UpstreamError)) throw err;
        // fall through to fixture for offline demos
      }
    }
    return acceptFixture({
      orgId: parsed.data.orgId,
      plantId: parsed.data.plantId,
      threadId: parsed.data.threadId,
      idempotencyKey,
    });
  });

  app.post("/api/prescriptions/:rxId/negotiation/reject", async (request, reply) => {
    if (!discussEnabled) {
      return problem(reply, 404, "Discuss disabled", request.id);
    }
    const session = await deps.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) {
      return problem(reply, 401, "Session required", request.id);
    }
    const parsed = BodySchema.safeParse(request.body);
    if (!parsed.success) {
      return problem(reply, 400, "Invalid body", request.id);
    }
    const resolved = await resolveActivePlant(deps.db, {
      userId: session.user.id,
      orgId: parsed.data.orgId,
    });
    const plant =
      resolved.authorized.find((p) => p.externalPlantId === parsed.data.plantId) ??
      resolved.activePlant;
    if (!plant) {
      return problem(reply, 403, "No plant membership", request.id);
    }
    if (!parsed.data.threadId) {
      return problem(reply, 400, "threadId required", request.id);
    }
    const idempotencyKey =
      (typeof request.headers["idempotency-key"] === "string" &&
        request.headers["idempotency-key"]) ||
      randomUUID();
    if (deps.l5) {
      try {
        const result = await deps.l5.rejectNegotiationThread({
          threadId: parsed.data.threadId,
          orgId: orgIdForExternalPlantId(plant.externalPlantId),
          plantId: plant.externalPlantId,
          actorId: session.user.id,
          reasonCode: parsed.data.reasonCode ?? "operator_rejected",
          idempotencyKey,
        });
        return { ...result, source: "l5" as const };
      } catch (err) {
        if (!(err instanceof UpstreamError)) throw err;
      }
    }
    return rejectFixture({
      orgId: parsed.data.orgId,
      plantId: parsed.data.plantId,
      threadId: parsed.data.threadId,
      idempotencyKey,
    });
  });
}
