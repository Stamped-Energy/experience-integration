import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import rateLimit from "@fastify/rate-limit";
import { and, eq, gt, isNull } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { apiKeys, l5Events, organizations, plants } from "../db/schema.js";
import {
  generateApiKeyMaterial,
  hashApiKeySecret,
  keyHasScope,
  parseBearerApiKey,
  type ApiKeyScope,
} from "./keys.js";
import { publicOpenApi } from "./openapi.js";

export type PublicApiDeps = {
  db: Db;
  /** Override public /v1 rate limit max (tests use a low ceiling). */
  publicRateLimitMax?: number;
};

type AuthedKey = {
  id: string;
  orgId: string;
  scopes: string[];
};

function problem(
  reply: FastifyReply,
  status: number,
  detail: string,
  requestId: string,
) {
  return reply
    .status(status)
    .header("content-type", "application/problem+json; charset=utf-8")
    .send({
      type: `https://httpstatuses.com/${status}`,
      title:
        status === 401
          ? "Unauthorized"
          : status === 403
            ? "Forbidden"
            : status === 429
              ? "Too Many Requests"
              : "Error",
      status,
      detail,
      request_id: requestId,
    });
}

async function authenticate(
  db: Db,
  request: FastifyRequest,
  reply: FastifyReply,
  scope: ApiKeyScope,
): Promise<AuthedKey | null> {
  const token = parseBearerApiKey(
    typeof request.headers.authorization === "string"
      ? request.headers.authorization
      : undefined,
  );
  if (!token) {
    await problem(reply, 401, "Bearer API key required", request.id);
    return null;
  }
  const prefix = token.split(".")[0] ?? "";
  const row = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.prefix, prefix), isNull(apiKeys.revokedAt)))
    .then((rows) => rows[0]);
  if (!row || !secretsMatch(row.secretHash, hashApiKeySecret(token))) {
    await problem(reply, 401, "Invalid API key", request.id);
    return null;
  }
  if (!keyHasScope(row.scopes, scope)) {
    await problem(reply, 403, `Missing scope ${scope}`, request.id);
    return null;
  }
  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, row.id));
  return { id: row.id, orgId: row.orgId, scopes: row.scopes };
}

function secretsMatch(storedHash: string, candidateHash: string): boolean {
  return storedHash === candidateHash;
}

function pageParams(query: Record<string, unknown>) {
  const limitRaw = Number(query.limit ?? 25);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(Math.trunc(limitRaw), 1), 100)
    : 25;
  const cursor = typeof query.cursor === "string" ? query.cursor : undefined;
  return { limit, cursor };
}

export async function registerPublicApiRoutes(
  app: FastifyInstance,
  deps: PublicApiDeps,
): Promise<void> {
  // Stricter rate limit for public surface (below global BFF ceiling)
  const publicMax =
    deps.publicRateLimitMax ??
    (process.env.NODE_ENV === "test" ? 20 : 60);
  await app.register(
    async (v1) => {
      await v1.register(rateLimit, {
        max: publicMax,
        timeWindow: "1 minute",
        ban: 0,
        hook: "onRequest",
      });

      v1.get("/openapi.json", async () => publicOpenApi);

      v1.get("/alarms", async (request, reply) => {
        const auth = await authenticate(deps.db, request, reply, "alarms:read");
        if (!auth) return;
        const q = request.query as Record<string, unknown>;
        const plantId = typeof q.plant_id === "string" ? q.plant_id : "";
        if (!plantId) return problem(reply, 400, "plant_id required", request.id);
        const plant = await resolvePlant(deps.db, auth.orgId, plantId);
        if (!plant) return problem(reply, 403, "Unknown plant for org", request.id);
        const { limit, cursor } = pageParams(q);
        // Fixture Auto list — live L5 remains behind product BFF
        const items = [
          {
            id: "alm_1001",
            plant_id: plant.externalPlantId,
            severity: "critical",
            state: "raised",
            summary: "Load 108% — MD coincidence risk",
          },
          {
            id: "alm_1002",
            plant_id: plant.externalPlantId,
            severity: "warning",
            state: "acked",
            summary: "PF drifting toward penalty slab",
          },
        ].filter((a) => !cursor || a.id > cursor);
        const page = items.slice(0, limit);
        const next = items.length > limit ? page[page.length - 1]?.id : null;
        return { data: page, next_cursor: next, limit };
      });

      v1.get("/events", async (request, reply) => {
        const auth = await authenticate(deps.db, request, reply, "events:read");
        if (!auth) return;
        const q = request.query as Record<string, unknown>;
        const plantId = typeof q.plant_id === "string" ? q.plant_id : "";
        if (!plantId) return problem(reply, 400, "plant_id required", request.id);
        const plant = await resolvePlant(deps.db, auth.orgId, plantId);
        if (!plant) return problem(reply, 403, "Unknown plant for org", request.id);
        const { limit } = pageParams(q);
        const after = typeof q.after === "string" ? Number(q.after) : 0;
        const org = await deps.db
          .select()
          .from(organizations)
          .where(eq(organizations.id, auth.orgId))
          .then((rows) => rows[0]);
        const rows = await deps.db
          .select()
          .from(l5Events)
          .where(
            and(
              eq(l5Events.orgExternalId, org?.slug ?? "org_demo"),
              eq(l5Events.plantExternalId, plant.externalPlantId),
              gt(l5Events.seq, Number.isFinite(after) ? after : 0),
            ),
          )
          .limit(limit);
        return {
          data: rows.map((r) => ({
            id: r.eventId,
            seq: r.seq,
            occurred_at: r.occurredAt.toISOString(),
            payload: r.payload,
          })),
          next_cursor: rows.length ? String(rows[rows.length - 1]!.seq) : null,
          limit,
        };
      });

      v1.get("/ledger", async (request, reply) => {
        const auth = await authenticate(deps.db, request, reply, "ledger:read");
        if (!auth) return;
        const q = request.query as Record<string, unknown>;
        const plantId = typeof q.plant_id === "string" ? q.plant_id : "";
        if (!plantId) return problem(reply, 400, "plant_id required", request.id);
        const plant = await resolvePlant(deps.db, auth.orgId, plantId);
        if (!plant) return problem(reply, 403, "Unknown plant for org", request.id);
        return {
          data: [
            {
              entry_id: "led_1001",
              plant_id: plant.externalPlantId,
              verification_status: "ops_confirmed",
              realised_inr: 11200,
              note: "Ops-confirmed — not bill-verified",
            },
          ],
          next_cursor: null,
        };
      });
    },
    { prefix: "/v1" },
  );
}

async function resolvePlant(db: Db, orgId: string, externalPlantId: string) {
  return db
    .select()
    .from(plants)
    .where(and(eq(plants.orgId, orgId), eq(plants.externalPlantId, externalPlantId)))
    .then((rows) => rows[0]);
}

/** Admin helper — create key for an org (session auth elsewhere). */
export async function createOrgApiKey(
  db: Db,
  input: {
    orgId: string;
    name: string;
    scopes: string[];
    createdBy: string;
  },
) {
  const material = generateApiKeyMaterial();
  const [row] = await db
    .insert(apiKeys)
    .values({
      orgId: input.orgId,
      name: input.name,
      prefix: material.prefix,
      secretHash: material.secretHash,
      scopes: input.scopes,
      createdBy: input.createdBy,
    })
    .returning();
  return { row: row!, fullKey: material.fullKey };
}
