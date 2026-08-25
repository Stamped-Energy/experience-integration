import type { FastifyInstance } from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import { and, desc, eq, gt } from "drizzle-orm";
import type pg from "pg";
import type { Auth } from "../auth/index.js";
import type { Db } from "../db/client.js";
import {
  l5Events,
  memberships,
  plantMemberships,
  plants,
} from "../db/schema.js";
import { formatSseComment, resumeEventStream } from "./sse.js";

/** Plant access: active org membership plus optional plant_memberships row. */
async function userCanAccessPlant(
  db: Db,
  userId: string,
  plantExternalId: string,
): Promise<boolean> {
  const [plant] = await db
    .select()
    .from(plants)
    .where(eq(plants.externalPlantId, plantExternalId))
    .limit(1);
  if (!plant) return false;

  const [mem] = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.orgId, plant.orgId),
        eq(memberships.status, "active"),
      ),
    )
    .limit(1);
  if (!mem) return false;

  const plantLinks = await db
    .select()
    .from(plantMemberships)
    .where(eq(plantMemberships.membershipId, mem.id))
    .limit(1);
  // No plant rows ⇒ org-wide access; otherwise require explicit plant link.
  if (plantLinks.length === 0) return true;
  const [link] = await db
    .select()
    .from(plantMemberships)
    .where(
      and(
        eq(plantMemberships.membershipId, mem.id),
        eq(plantMemberships.plantId, plant.id),
      ),
    )
    .limit(1);
  return Boolean(link);
}

export async function registerEventRoutes(
  app: FastifyInstance,
  auth: Auth,
  db: Db,
  pool: pg.Pool,
): Promise<void> {
  app.get("/api/events/stream", async (request, reply) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) {
      return reply.status(401).send({
        type: "https://httpstatuses.com/401",
        title: "Unauthorized",
        status: 401,
        detail: "Session required",
        request_id: request.id,
      });
    }

    const query = request.query as {
      orgId?: string;
      plantId?: string;
    };
    const orgExternalId = query.orgId?.trim() ?? "";
    const plantExternalId = query.plantId?.trim() ?? "";
    if (!orgExternalId || !plantExternalId) {
      return reply.status(400).send({
        type: "https://httpstatuses.com/400",
        title: "Bad Request",
        status: 400,
        detail: "orgId and plantId query params are required",
        request_id: request.id,
      });
    }

    const allowed = await userCanAccessPlant(
      db,
      session.user.id,
      plantExternalId,
    );
    if (!allowed) {
      return reply.status(403).send({
        type: "https://httpstatuses.com/403",
        title: "Forbidden",
        status: 403,
        detail: "No access to this plant stream",
        request_id: request.id,
      });
    }

    const lastEventIdHeader = request.headers["last-event-id"];
    const lastEventId =
      typeof lastEventIdHeader === "string" && lastEventIdHeader.length > 0
        ? lastEventIdHeader
        : null;

    reply.hijack();
    reply.raw.writeHead(200, {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-request-id": request.id,
      "x-accel-buffering": "no",
    });
    reply.raw.write(formatSseComment("connected"));

    const ac = new AbortController();
    const onClose = () => ac.abort();
    request.raw.on("close", onClose);

    try {
      await resumeEventStream({
        db,
        pool,
        orgExternalId,
        plantExternalId,
        lastEventId,
        heartbeatMs: 15_000,
        signal: ac.signal,
        onFrame: (frame) => {
          if (!reply.raw.writableEnded) reply.raw.write(frame);
        },
      });
    } finally {
      request.raw.off("close", onClose);
      if (!reply.raw.writableEnded) reply.raw.end();
    }
  });

  app.get("/api/events", async (request, reply) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) {
      return reply.status(401).send({
        type: "https://httpstatuses.com/401",
        title: "Unauthorized",
        status: 401,
        detail: "Session required",
        request_id: request.id,
      });
    }
    const query = request.query as {
      orgId?: string;
      plantId?: string;
      after?: string;
      limit?: string;
    };
    const plantExternalId = query.plantId?.trim() ?? "";
    if (!plantExternalId) {
      return reply.status(400).send({
        type: "https://httpstatuses.com/400",
        title: "Bad Request",
        status: 400,
        detail: "plantId is required",
        request_id: request.id,
      });
    }
    const allowed = await userCanAccessPlant(
      db,
      session.user.id,
      plantExternalId,
    );
    if (!allowed) {
      return reply.status(403).send({
        type: "https://httpstatuses.com/403",
        title: "Forbidden",
        status: 403,
        detail: "Plant access denied",
        request_id: request.id,
      });
    }
    const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 200);
    const afterSeq = query.after ? Number(query.after) : 0;
    const orgExternalId = query.orgId?.trim() || "org_acme";
    const conditions = [
      eq(l5Events.orgExternalId, orgExternalId),
      eq(l5Events.plantExternalId, plantExternalId),
    ];
    if (afterSeq > 0) conditions.push(gt(l5Events.seq, afterSeq));
    const rows = await db
      .select()
      .from(l5Events)
      .where(and(...conditions))
      .orderBy(desc(l5Events.seq))
      .limit(limit);
    return {
      items: rows.map((r) => ({
        seq: r.seq,
        eventId: r.eventId,
        occurredAt: r.occurredAt,
        payload: r.payload,
      })),
      source: "l5" as const,
      generatedAt: new Date().toISOString(),
    };
  });
}
