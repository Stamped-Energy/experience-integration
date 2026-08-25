import type { FastifyInstance } from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { RoleSchema } from "@stamped/l6-contracts";
import type { Auth } from "../auth/index.js";
import { AuthzError, requirePermission } from "../authz/index.js";
import type { Db } from "../db/client.js";
import { auditEvents } from "../db/schema.js";
import {
  addMembership,
  listOrgMemberships,
  setMembershipStatus,
  updateMembershipRoleAndPlants,
  writeAudit,
} from "../tenancy/service.js";

const AssignBody = z.object({
  userId: z.string().min(1),
  role: RoleSchema,
  plantIds: z.array(z.string().uuid()).min(1),
});

const PatchBody = z.object({
  role: RoleSchema.optional(),
  plantIds: z.array(z.string().uuid()).min(1).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

async function requireAdminActor(
  auth: Auth,
  db: Db,
  request: { headers: Record<string, unknown>; id: string },
  orgId: string,
) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers as never),
  });
  if (!session) {
    const err = Object.assign(new Error("Unauthorized"), {
      statusCode: 401,
      code: "UNAUTHORIZED",
    });
    throw err;
  }

  const memberships = await listOrgMemberships(db, orgId);
  const actor = memberships.find(
    (m) => m.userId === session.user.id && m.status === "active",
  );
  if (!actor) {
    throw Object.assign(new Error("No membership in organization"), {
      statusCode: 403,
      code: "TENANCY_FORBIDDEN",
    });
  }
  requirePermission(actor.role, "admin:users");
  return { session, actor };
}

function problem(
  reply: {
    status: (code: number) => {
      send: (body: unknown) => unknown;
    };
  },
  requestId: string,
  err: unknown,
) {
  if (err instanceof AuthzError) {
    return reply.status(403).send({
      type: "https://httpstatuses.com/403",
      title: "Forbidden",
      status: 403,
      detail: err.message,
      request_id: requestId,
    });
  }
  const status =
    typeof err === "object" &&
    err &&
    "statusCode" in err &&
    typeof (err as { statusCode: unknown }).statusCode === "number"
      ? (err as { statusCode: number }).statusCode
      : 500;
  const detail =
    err instanceof Error ? err.message : "Unexpected admin error";
  return reply.status(status).send({
    type: `https://httpstatuses.com/${status}`,
    title: status === 403 ? "Forbidden" : status === 401 ? "Unauthorized" : "Error",
    status,
    detail,
    request_id: requestId,
  });
}

export async function registerAdminRoutes(
  app: FastifyInstance,
  auth: Auth,
  db: Db,
): Promise<void> {
  app.get("/api/admin/orgs/:orgId/members", async (request, reply) => {
    try {
      const { orgId } = request.params as { orgId: string };
      await requireAdminActor(auth, db, request, orgId);
      const members = await listOrgMemberships(db, orgId);
      return { members };
    } catch (err) {
      return problem(reply, request.id, err);
    }
  });

  app.post("/api/admin/orgs/:orgId/members", async (request, reply) => {
    try {
      const { orgId } = request.params as { orgId: string };
      const { session } = await requireAdminActor(auth, db, request, orgId);
      const parsed = AssignBody.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          type: "https://httpstatuses.com/400",
          title: "Bad Request",
          status: 400,
          detail: parsed.error.issues.map((i) => i.message).join("; "),
          request_id: request.id,
        });
      }
      const membership = await addMembership(db, {
        userId: parsed.data.userId,
        orgId,
        role: parsed.data.role,
        plantIds: parsed.data.plantIds,
      });
      await writeAudit(db, {
        orgId,
        actorUserId: session.user.id,
        action: "membership.create",
        resourceType: "membership",
        resourceId: membership.id,
        metadata: {
          role: membership.role,
          plantIds: membership.plantIds,
        },
      });
      return reply.status(201).send({ membership });
    } catch (err) {
      return problem(reply, request.id, err);
    }
  });

  app.patch(
    "/api/admin/orgs/:orgId/members/:membershipId",
    async (request, reply) => {
      try {
        const { orgId, membershipId } = request.params as {
          orgId: string;
          membershipId: string;
        };
        const { session } = await requireAdminActor(auth, db, request, orgId);
        const parsed = PatchBody.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            type: "https://httpstatuses.com/400",
            title: "Bad Request",
            status: 400,
            detail: parsed.error.issues.map((i) => i.message).join("; "),
            request_id: request.id,
          });
        }

        const existing = (await listOrgMemberships(db, orgId)).find(
          (m) => m.id === membershipId,
        );
        if (!existing) {
          return reply.status(404).send({
            type: "https://httpstatuses.com/404",
            title: "Not Found",
            status: 404,
            detail: "Membership not found",
            request_id: request.id,
          });
        }

        let membership = existing;
        if (parsed.data.role || parsed.data.plantIds) {
          membership = await updateMembershipRoleAndPlants(db, {
            membershipId,
            role: parsed.data.role ?? existing.role,
            plantIds: parsed.data.plantIds ?? existing.plantIds,
          });
        }
        if (parsed.data.status) {
          await setMembershipStatus(db, {
            membershipId,
            status: parsed.data.status,
          });
          membership = {
            ...membership,
            status: parsed.data.status,
          };
        }

        await writeAudit(db, {
          orgId,
          actorUserId: session.user.id,
          action: "membership.update",
          resourceType: "membership",
          resourceId: membershipId,
          metadata: parsed.data,
        });
        return { membership };
      } catch (err) {
        return problem(reply, request.id, err);
      }
    },
  );

  app.get(
    "/api/admin/orgs/:orgId/audit-events",
    async (request, reply) => {
      const { orgId } = request.params as { orgId: string };
      try {
        await requireAdminActor(auth, db, request, orgId);
        const limit = Math.min(
          Math.max(Number((request.query as { limit?: string }).limit) || 50, 1),
          200,
        );
        const rows = await db
          .select()
          .from(auditEvents)
          .where(eq(auditEvents.orgId, orgId))
          .orderBy(desc(auditEvents.createdAt))
          .limit(limit);
        return {
          items: rows.map((r) => ({
            id: r.id,
            action: r.action,
            resourceType: r.resourceType,
            resourceId: r.resourceId,
            actorUserId: r.actorUserId,
            metadata: r.metadata,
            createdAt: r.createdAt,
          })),
          source: "l6" as const,
          generatedAt: new Date().toISOString(),
        };
      } catch (err) {
        return problem(reply, request.id, err);
      }
    },
  );
}
