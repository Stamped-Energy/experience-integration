import type { FastifyInstance } from "fastify";
import { and, eq, isNull } from "drizzle-orm";
import { fromNodeHeaders } from "better-auth/node";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import type { Auth } from "../auth/index.js";
import { AuthzError, requirePermission } from "../authz/index.js";
import type { Db } from "../db/client.js";
import { apiKeys, webhookDeliveries, webhookEndpoints } from "../db/schema.js";
import { resolveActivePlant } from "../tenancy/service.js";
import { createOrgApiKey } from "../public/routes.js";
import {
  createWebhookEndpoint,
  deliverWebhookOnce,
  enqueueWebhookDelivery,
} from "../webhooks/service.js";

export type IntegrationRouteDeps = { auth: Auth; db: Db };

function problem(
  reply: { status: (n: number) => { send: (b: unknown) => unknown } },
  status: number,
  detail: string,
  requestId: string,
) {
  return reply.status(status).send({
    type: `https://httpstatuses.com/${status}`,
    title: status === 401 ? "Unauthorized" : "Forbidden",
    status,
    detail,
    request_id: requestId,
  });
}

export async function registerIntegrationRoutes(
  app: FastifyInstance,
  deps: IntegrationRouteDeps,
): Promise<void> {
  app.post("/api/integrations/api-keys", async (request, reply) => {
    const session = await deps.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) return problem(reply, 401, "Session required", request.id);
    const resolved = await resolveActivePlant(deps.db, { userId: session.user.id });
    const plant = resolved.activePlant ?? resolved.authorized[0];
    if (!plant) return problem(reply, 403, "No plant membership", request.id);
    try {
      requirePermission(plant.role, "admin:integrations");
    } catch (err) {
      if (err instanceof AuthzError) return problem(reply, 403, err.message, request.id);
      throw err;
    }
    const body = z
      .object({
        name: z.string().min(1),
        scopes: z.array(z.string()).default(["alarms:read", "events:read", "ledger:read"]),
      })
      .parse(request.body ?? {});
    const created = await createOrgApiKey(deps.db, {
      orgId: plant.orgId,
      name: body.name,
      scopes: body.scopes,
      createdBy: session.user.id,
    });
    return reply.status(201).send({
      id: created.row.id,
      prefix: created.row.prefix,
      scopes: created.row.scopes,
      // shown once
      api_key: created.fullKey,
    });
  });

  app.get("/api/integrations/api-keys", async (request, reply) => {
    const session = await deps.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) return problem(reply, 401, "Session required", request.id);
    const resolved = await resolveActivePlant(deps.db, { userId: session.user.id });
    const plant = resolved.activePlant ?? resolved.authorized[0];
    if (!plant) return problem(reply, 403, "No plant membership", request.id);
    try {
      requirePermission(plant.role, "admin:integrations");
    } catch (err) {
      if (err instanceof AuthzError) return problem(reply, 403, err.message, request.id);
      throw err;
    }
    const rows = await deps.db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.orgId, plant.orgId));
    return {
      items: rows.map((r) => ({
        id: r.id,
        name: r.name,
        prefix: r.prefix,
        scopes: r.scopes,
        created_at: r.createdAt,
        last_used_at: r.lastUsedAt,
        revoked_at: r.revokedAt,
      })),
    };
  });

  app.delete("/api/integrations/api-keys/:id", async (request, reply) => {
    const session = await deps.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) return problem(reply, 401, "Session required", request.id);
    const resolved = await resolveActivePlant(deps.db, { userId: session.user.id });
    const plant = resolved.activePlant ?? resolved.authorized[0];
    if (!plant) return problem(reply, 403, "No plant membership", request.id);
    try {
      requirePermission(plant.role, "admin:integrations");
    } catch (err) {
      if (err instanceof AuthzError) return problem(reply, 403, err.message, request.id);
      throw err;
    }
    const { id } = request.params as { id: string };
    const updated = await deps.db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(apiKeys.id, id),
          eq(apiKeys.orgId, plant.orgId),
          isNull(apiKeys.revokedAt),
        ),
      )
      .returning({ id: apiKeys.id });
    if (updated.length === 0) {
      return problem(reply, 404, "API key not found or already revoked", request.id);
    }
    return reply.status(204).send();
  });

  app.post("/api/integrations/webhooks", async (request, reply) => {
    const session = await deps.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) return problem(reply, 401, "Session required", request.id);
    const resolved = await resolveActivePlant(deps.db, { userId: session.user.id });
    const plant = resolved.activePlant ?? resolved.authorized[0];
    if (!plant) return problem(reply, 403, "No plant membership", request.id);
    try {
      requirePermission(plant.role, "admin:integrations");
    } catch (err) {
      if (err instanceof AuthzError) return problem(reply, 403, err.message, request.id);
      throw err;
    }
    const body = z
      .object({
        url: z.string().url(),
        eventFilters: z.array(z.string()).optional(),
      })
      .parse(request.body ?? {});
    const secret = `whsec_${randomBytes(24).toString("base64url")}`;
    try {
      const row = await createWebhookEndpoint(deps.db, {
        orgId: plant.orgId,
        url: body.url,
        secret,
        eventFilters: body.eventFilters,
        createdBy: session.user.id,
      });
      return reply.status(201).send({
        id: row.id,
        url: row.url,
        secret,
        event_filters: row.eventFilters,
      });
    } catch (err) {
      return problem(
        reply,
        400,
        err instanceof Error ? err.message : "Invalid webhook",
        request.id,
      );
    }
  });

  app.get("/api/integrations/webhooks", async (request, reply) => {
    const session = await deps.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) return problem(reply, 401, "Session required", request.id);
    const resolved = await resolveActivePlant(deps.db, { userId: session.user.id });
    const plant = resolved.activePlant ?? resolved.authorized[0];
    if (!plant) return problem(reply, 403, "No plant membership", request.id);
    try {
      requirePermission(plant.role, "admin:integrations");
    } catch (err) {
      if (err instanceof AuthzError) return problem(reply, 403, err.message, request.id);
      throw err;
    }
    const rows = await deps.db
      .select()
      .from(webhookEndpoints)
      .where(eq(webhookEndpoints.orgId, plant.orgId));
    return {
      items: rows.map((r) => ({
        id: r.id,
        url: r.url,
        enabled: r.enabled,
        event_filters: r.eventFilters,
      })),
    };
  });

  app.post("/api/integrations/webhooks/:id/test", async (request, reply) => {
    const session = await deps.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) return problem(reply, 401, "Session required", request.id);
    const resolved = await resolveActivePlant(deps.db, { userId: session.user.id });
    const plant = resolved.activePlant ?? resolved.authorized[0];
    if (!plant) return problem(reply, 403, "No plant membership", request.id);
    try {
      requirePermission(plant.role, "admin:integrations");
    } catch (err) {
      if (err instanceof AuthzError) return problem(reply, 403, err.message, request.id);
      throw err;
    }
    const { id } = request.params as { id: string };
    const delivery = await enqueueWebhookDelivery(deps.db, {
      endpointId: id,
      eventType: "l6.test",
      payload: { ok: true, plant_id: plant.externalPlantId },
    });
    const result = await deliverWebhookOnce(deps.db, delivery.id);
    return { delivery_id: delivery.id, ...result };
  });

  app.post("/api/integrations/webhooks/deliveries/:id/redrive", async (request, reply) => {
    const session = await deps.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) return problem(reply, 401, "Session required", request.id);
    const resolved = await resolveActivePlant(deps.db, { userId: session.user.id });
    const plant = resolved.activePlant ?? resolved.authorized[0];
    if (!plant) return problem(reply, 403, "No plant membership", request.id);
    try {
      requirePermission(plant.role, "admin:integrations");
    } catch (err) {
      if (err instanceof AuthzError) return problem(reply, 403, err.message, request.id);
      throw err;
    }
    const { id } = request.params as { id: string };
    await deps.db
      .update(webhookDeliveries)
      .set({ status: "pending", nextAttemptAt: new Date() })
      .where(eq(webhookDeliveries.id, id));
    const result = await deliverWebhookOnce(deps.db, id);
    return result;
  });

  app.get("/api/integrations/entra", async (request, reply) => {
    const session = await deps.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) return problem(reply, 401, "Session required", request.id);
    const resolved = await resolveActivePlant(deps.db, { userId: session.user.id });
    const plant = resolved.activePlant ?? resolved.authorized[0];
    if (!plant) return problem(reply, 403, "No plant membership", request.id);
    try {
      requirePermission(plant.role, "admin:integrations");
    } catch (err) {
      if (err instanceof AuthzError) return problem(reply, 403, err.message, request.id);
      throw err;
    }
    return {
      enabled: process.env.ENTRA_ENABLED === "true",
      tenant_id: process.env.ENTRA_TENANT_ID ?? null,
      client_id: process.env.ENTRA_CLIENT_ID ?? null,
      mapping: "existing_membership_only",
      note: "Entra is an identity source only — L6 membership remains authorization truth.",
      local_auth_coexists: true,
    };
  });
}
