import type { FastifyInstance } from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import { z } from "zod";
import type { Auth } from "../auth/index.js";
import type { Db } from "../db/client.js";
import { productTelemetry } from "../db/schema.js";
import { sanitizeTelemetry } from "./sanitize.js";

export async function registerTelemetryRoutes(
  app: FastifyInstance,
  deps: { db?: Db; auth?: Auth },
): Promise<void> {
  app.post(
    "/api/telemetry",
    {
      config: {
        // Hard limit even when authenticated — open write surface otherwise.
        rateLimit: { max: 60, timeWindow: "1 minute" },
      },
    },
    async (request, reply) => {
      if (deps.auth) {
        const session = await deps.auth.api.getSession({
          headers: fromNodeHeaders(request.headers),
        });
        if (!session) {
          return reply.status(401).send({
            type: "https://httpstatuses.com/401",
            title: "Unauthorized",
            status: 401,
            detail: "Session required for telemetry",
            request_id: request.id,
          });
        }
      } else if (process.env.NODE_ENV === "production") {
        // Fail closed in production if auth was not wired.
        return reply.status(503).send({
          type: "https://httpstatuses.com/503",
          title: "Service Unavailable",
          status: 503,
          detail: "Telemetry auth not configured",
          request_id: request.id,
        });
      }

      const body = z
        .object({
          event_name: z.string().min(1),
          org_id: z.string().optional(),
          plant_id: z.string().optional(),
          role: z.string().optional(),
          properties: z.record(z.string(), z.unknown()).optional(),
        })
        .parse(request.body ?? {});

      const sanitized = sanitizeTelemetry(body.event_name, body.properties ?? {});
      if (!sanitized.ok) {
        return reply.status(400).send({
          type: "https://httpstatuses.com/400",
          title: "Bad Request",
          status: 400,
          detail: sanitized.reason,
          request_id: request.id,
        });
      }

      if (deps.db) {
        await deps.db.insert(productTelemetry).values({
          orgId: body.org_id ?? null,
          plantId: body.plant_id ?? null,
          role: body.role ?? null,
          eventName: sanitized.eventName,
          properties: sanitized.properties,
        });
      }

      return { accepted: true };
    },
  );
}
