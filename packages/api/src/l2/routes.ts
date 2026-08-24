import type { FastifyInstance } from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import { z } from "zod";
import type { Auth } from "../auth/index.js";
import { AuthzError, requirePermission } from "../authz/index.js";
import type { Db } from "../db/client.js";
import {
  cacheHeadersForHistorical,
  ifNoneMatchMatches,
  isClosedHistoricalWindow,
} from "../http/cache.js";
import { resolveActivePlant } from "../tenancy/service.js";
import { UpstreamError } from "../upstream/http.js";
import {
  L2QueryClient,
  MeasurementGranularitySchema,
  type L2ClientOptions,
} from "../upstream/l2/client.js";
import { orgIdForExternalPlantId } from "../upstream/mappings.js";

export type L2RouteDeps = {
  auth: Auth;
  db: Db;
  /** When null/undefined, live L2 routes return 503 (fixture UI fallback). */
  l2?: L2QueryClient | null;
  /** Factory used when org-scoped client must match plant mapping. */
  createL2Client?: (orgId: string) => L2QueryClient | null;
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
    title:
      title ??
      (status === 401
        ? "Unauthorized"
        : status === 403
          ? "Forbidden"
          : status === 503
            ? "Service Unavailable"
            : "Error"),
    status,
    detail,
    request_id: requestId,
  });
}

const AssetsQuery = z.object({
  plantId: z.string().min(1),
  orgId: z.string().optional(),
});

const MeasurementsQuery = z.object({
  plantId: z.string().min(1),
  assetId: z.string().min(1),
  metric: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  granularity: MeasurementGranularitySchema.optional(),
  orgId: z.string().optional(),
});

async function resolveAuthorizedPlant(
  deps: L2RouteDeps,
  userId: string,
  orgId: string | undefined,
  plantId: string,
) {
  const resolved = await resolveActivePlant(deps.db, {
    userId,
    orgId,
  });
  const plant =
    resolved.authorized.find((p) => p.externalPlantId === plantId) ?? null;
  return { plant, authorized: resolved.authorized };
}

function clientForPlant(
  deps: L2RouteDeps,
  externalPlantId: string,
): L2QueryClient | null {
  const orgId = orgIdForExternalPlantId(externalPlantId);
  if (deps.createL2Client) {
    return deps.createL2Client(orgId);
  }
  return deps.l2 ?? null;
}

export async function registerL2Routes(
  app: FastifyInstance,
  deps: L2RouteDeps,
): Promise<void> {
  app.get("/api/l2/assets", async (request, reply) => {
    const session = await deps.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) {
      return problem(reply, 401, "Session required", request.id);
    }

    const parsed = AssetsQuery.safeParse(request.query);
    if (!parsed.success) {
      return problem(
        reply,
        400,
        parsed.error.issues.map((i) => i.message).join("; "),
        request.id,
        "Bad Request",
      );
    }

    const { plant } = await resolveAuthorizedPlant(
      deps,
      session.user.id,
      parsed.data.orgId,
      parsed.data.plantId,
    );
    if (!plant) {
      return problem(reply, 403, "Plant not in membership scope", request.id);
    }

    try {
      // Ops read — same surface as alarms for operators on Live / Equipment.
      requirePermission(plant.role, "alarm:read");
    } catch (err) {
      if (err instanceof AuthzError) {
        return problem(reply, 403, err.message, request.id);
      }
      throw err;
    }

    const l2 = clientForPlant(deps, plant.externalPlantId);
    if (!l2) {
      return problem(
        reply,
        503,
        "L2 live path unavailable — set L2_SERVICE_KEY and L2_LIVE=true",
        request.id,
      );
    }

    try {
      const data = await l2.listAssets(plant.externalPlantId);
      return { items: data.items, source: "l2" as const, plantId: plant.externalPlantId };
    } catch (err) {
      if (err instanceof UpstreamError) {
        return problem(
          reply,
          err.status >= 400 && err.status < 600 ? err.status : 502,
          err.message,
          request.id,
          "Upstream Error",
        );
      }
      throw err;
    }
  });

  app.get("/api/l2/measurements", async (request, reply) => {
    const session = await deps.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) {
      return problem(reply, 401, "Session required", request.id);
    }

    const parsed = MeasurementsQuery.safeParse(request.query);
    if (!parsed.success) {
      return problem(
        reply,
        400,
        parsed.error.issues.map((i) => i.message).join("; "),
        request.id,
        "Bad Request",
      );
    }

    const { plant } = await resolveAuthorizedPlant(
      deps,
      session.user.id,
      parsed.data.orgId,
      parsed.data.plantId,
    );
    if (!plant) {
      return problem(reply, 403, "Plant not in membership scope", request.id);
    }

    try {
      requirePermission(plant.role, "alarm:read");
    } catch (err) {
      if (err instanceof AuthzError) {
        return problem(reply, 403, err.message, request.id);
      }
      throw err;
    }

    const l2 = clientForPlant(deps, plant.externalPlantId);
    if (!l2) {
      return problem(
        reply,
        503,
        "L2 live path unavailable — set L2_SERVICE_KEY and L2_LIVE=true",
        request.id,
      );
    }

    try {
      const data = await l2.listMeasurements({
        plantId: plant.externalPlantId,
        assetId: parsed.data.assetId,
        metric: parsed.data.metric,
        from: parsed.data.from,
        to: parsed.data.to,
        granularity: parsed.data.granularity,
      });
      const body = { ...data, source: "l2" as const };
      // Cache only closed historical windows — never live open-ended ranges.
      if (isClosedHistoricalWindow(parsed.data.to)) {
        const { etag, cacheControl } = cacheHeadersForHistorical(body);
        reply.header("etag", etag);
        reply.header("cache-control", cacheControl);
        if (ifNoneMatchMatches(request.headers["if-none-match"], etag)) {
          return reply.status(304).send();
        }
      } else {
        reply.header("cache-control", "no-store");
      }
      return body;
    } catch (err) {
      if (err instanceof UpstreamError) {
        return problem(
          reply,
          err.status >= 400 && err.status < 600 ? err.status : 502,
          err.message,
          request.id,
          "Upstream Error",
        );
      }
      throw err;
    }
  });
}

/** Build an org-scoped L2 client from env-shaped options; null when not live. */
export function createL2ClientFromOptions(
  opts: {
    baseUrl: string;
    timeoutMs: number;
    serviceKey: string | undefined;
    live: boolean;
    features: L2ClientOptions["features"];
  },
  orgId: string,
): L2QueryClient | null {
  if (!opts.live || !opts.serviceKey?.trim()) return null;
  return new L2QueryClient({
    baseUrl: opts.baseUrl,
    timeoutMs: opts.timeoutMs,
    orgId,
    serviceKey: opts.serviceKey,
    features: opts.features,
  });
}
