import type { FastifyInstance } from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import type { Auth } from "../auth/index.js";
import { AuthzError, requirePermission } from "../authz/index.js";
import type { Db } from "../db/client.js";
import { resolveActivePlant } from "../tenancy/service.js";
import {
  PersonCreateBody,
  PersonPatchBody,
  RouteCreateBody,
  RoutePatchBody,
  createAlarmRouteRule,
  createNotifyPerson,
  deleteAlarmRouteRule,
  deleteNotifyPerson,
  listAlarmRouteRules,
  listNotifyPeople,
  updateAlarmRouteRule,
  updateNotifyPerson,
} from "./service.js";

export type AssignmentsRouteDeps = { auth: Auth; db: Db };

function problem(
  reply: { status: (n: number) => { send: (b: unknown) => unknown } },
  status: number,
  detail: string,
  requestId: string,
) {
  return reply.status(status).send({
    type: `https://httpstatuses.com/${status}`,
    title:
      status === 401
        ? "Unauthorized"
        : status === 403
          ? "Forbidden"
          : status === 404
            ? "Not Found"
            : status === 400
              ? "Bad Request"
              : "Error",
    status,
    detail,
    request_id: requestId,
  });
}

async function requirePlantActor(
  deps: AssignmentsRouteDeps,
  request: { headers: Record<string, unknown>; id: string },
  permission: "admin:users" | "prescription:read",
) {
  const session = await deps.auth.api.getSession({
    headers: fromNodeHeaders(request.headers as never),
  });
  if (!session) {
    throw Object.assign(new Error("Session required"), { statusCode: 401 });
  }
  const resolved = await resolveActivePlant(deps.db, {
    userId: session.user.id,
  });
  const plant = resolved.activePlant ?? resolved.authorized[0];
  if (!plant) {
    throw Object.assign(new Error("No plant membership"), { statusCode: 403 });
  }
  requirePermission(plant.role, permission);
  return { session, plant };
}

function statusFromErr(err: unknown): number {
  if (err instanceof AuthzError) return 403;
  if (
    typeof err === "object" &&
    err &&
    "statusCode" in err &&
    typeof (err as { statusCode: unknown }).statusCode === "number"
  ) {
    return (err as { statusCode: number }).statusCode;
  }
  return 500;
}

export async function registerAssignmentsRoutes(
  app: FastifyInstance,
  deps: AssignmentsRouteDeps,
): Promise<void> {
  app.get("/api/assignments/people", async (request, reply) => {
    try {
      const { plant } = await requirePlantActor(
        deps,
        request,
        "prescription:read",
      );
      const q = request.query as { reveal?: string };
      const revealPhone = q.reveal === "1" || q.reveal === "true";
      if (revealPhone) {
        requirePermission(plant.role, "admin:users");
      }
      const people = await listNotifyPeople(deps.db, {
        plantId: plant.id,
        revealPhone,
      });
      return { people, plantId: plant.id, orgId: plant.orgId };
    } catch (err) {
      return problem(
        reply,
        statusFromErr(err),
        err instanceof Error ? err.message : "Error",
        request.id,
      );
    }
  });

  app.post("/api/assignments/people", async (request, reply) => {
    try {
      const { plant } = await requirePlantActor(deps, request, "admin:users");
      const parsed = PersonCreateBody.safeParse(request.body ?? {});
      if (!parsed.success) {
        return problem(
          reply,
          400,
          parsed.error.issues.map((i) => i.message).join("; "),
          request.id,
        );
      }
      const person = await createNotifyPerson(deps.db, {
        orgId: plant.orgId,
        plantId: plant.id,
        body: parsed.data,
      });
      return reply.status(201).send({ person });
    } catch (err) {
      return problem(
        reply,
        statusFromErr(err),
        err instanceof Error ? err.message : "Error",
        request.id,
      );
    }
  });

  app.patch("/api/assignments/people/:id", async (request, reply) => {
    try {
      const { plant } = await requirePlantActor(deps, request, "admin:users");
      const { id } = request.params as { id: string };
      const parsed = PersonPatchBody.safeParse(request.body ?? {});
      if (!parsed.success) {
        return problem(
          reply,
          400,
          parsed.error.issues.map((i) => i.message).join("; "),
          request.id,
        );
      }
      const person = await updateNotifyPerson(deps.db, {
        plantId: plant.id,
        personId: id,
        body: parsed.data,
      });
      if (!person) return problem(reply, 404, "Person not found", request.id);
      return { person };
    } catch (err) {
      return problem(
        reply,
        statusFromErr(err),
        err instanceof Error ? err.message : "Error",
        request.id,
      );
    }
  });

  app.delete("/api/assignments/people/:id", async (request, reply) => {
    try {
      const { plant } = await requirePlantActor(deps, request, "admin:users");
      const { id } = request.params as { id: string };
      const ok = await deleteNotifyPerson(deps.db, {
        plantId: plant.id,
        personId: id,
      });
      if (!ok) return problem(reply, 404, "Person not found", request.id);
      return reply.status(204).send();
    } catch (err) {
      return problem(
        reply,
        statusFromErr(err),
        err instanceof Error ? err.message : "Error",
        request.id,
      );
    }
  });

  app.get("/api/assignments/routes", async (request, reply) => {
    try {
      const { plant } = await requirePlantActor(
        deps,
        request,
        "prescription:read",
      );
      const routes = await listAlarmRouteRules(deps.db, plant.id);
      return { routes, plantId: plant.id, orgId: plant.orgId };
    } catch (err) {
      return problem(
        reply,
        statusFromErr(err),
        err instanceof Error ? err.message : "Error",
        request.id,
      );
    }
  });

  app.post("/api/assignments/routes", async (request, reply) => {
    try {
      const { plant } = await requirePlantActor(deps, request, "admin:users");
      const parsed = RouteCreateBody.safeParse(request.body ?? {});
      if (!parsed.success) {
        return problem(
          reply,
          400,
          parsed.error.issues.map((i) => i.message).join("; "),
          request.id,
        );
      }
      const route = await createAlarmRouteRule(deps.db, {
        orgId: plant.orgId,
        plantId: plant.id,
        body: parsed.data,
      });
      return reply.status(201).send({ route });
    } catch (err) {
      return problem(
        reply,
        statusFromErr(err),
        err instanceof Error ? err.message : "Error",
        request.id,
      );
    }
  });

  app.patch("/api/assignments/routes/:id", async (request, reply) => {
    try {
      const { plant } = await requirePlantActor(deps, request, "admin:users");
      const { id } = request.params as { id: string };
      const parsed = RoutePatchBody.safeParse(request.body ?? {});
      if (!parsed.success) {
        return problem(
          reply,
          400,
          parsed.error.issues.map((i) => i.message).join("; "),
          request.id,
        );
      }
      const route = await updateAlarmRouteRule(deps.db, {
        plantId: plant.id,
        ruleId: id,
        body: parsed.data,
      });
      if (!route) return problem(reply, 404, "Route not found", request.id);
      return { route };
    } catch (err) {
      return problem(
        reply,
        statusFromErr(err),
        err instanceof Error ? err.message : "Error",
        request.id,
      );
    }
  });

  app.delete("/api/assignments/routes/:id", async (request, reply) => {
    try {
      const { plant } = await requirePlantActor(deps, request, "admin:users");
      const { id } = request.params as { id: string };
      const ok = await deleteAlarmRouteRule(deps.db, {
        plantId: plant.id,
        ruleId: id,
      });
      if (!ok) return problem(reply, 404, "Route not found", request.id);
      return reply.status(204).send();
    } catch (err) {
      return problem(
        reply,
        statusFromErr(err),
        err instanceof Error ? err.message : "Error",
        request.id,
      );
    }
  });
}
