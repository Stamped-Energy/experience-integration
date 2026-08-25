import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { fromNodeHeaders } from "better-auth/node";
import { z } from "zod";
import type { Auth } from "../auth/index.js";
import { AuthzError, requirePermission } from "../authz/index.js";
import type { Db } from "../db/client.js";
import { reportJobs } from "../db/schema.js";
import { resolveActivePlant } from "../tenancy/service.js";
import {
  approveReportJob,
  completeReportJob,
  createReportJob,
  listReportJobs,
} from "./service.js";

export type ReportRouteDeps = {
  auth: Auth;
  db: Db;
  /** Optional enqueue — when absent, Auto completes the job inline. */
  enqueueGenerate?: (reportJobId: string) => Promise<string | null>;
};

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

const CreateBody = z.object({
  kind: z.string().min(1).default("sustainability_monthly"),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
  plantId: z.string().optional(),
  orgId: z.string().optional(),
});

async function resolvePlant(
  deps: ReportRouteDeps,
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

export async function registerReportRoutes(
  app: FastifyInstance,
  deps: ReportRouteDeps,
): Promise<void> {
  app.get("/api/reports", async (request, reply) => {
    const session = await deps.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) return problem(reply, 401, "Session required", request.id);

    const q = request.query as { plantId?: string; orgId?: string };
    const plant = await resolvePlant(
      deps,
      session.user.id,
      q.orgId,
      q.plantId,
    );
    if (!plant) return problem(reply, 403, "No plant membership", request.id);

    try {
      requirePermission(plant.role, "report:export");
    } catch (err) {
      if (err instanceof AuthzError) {
        return problem(reply, 403, err.message, request.id);
      }
      throw err;
    }

    const items = await listReportJobs(deps.db, {
      orgId: plant.orgId,
      plantId: plant.id,
    });
    return {
      items: items.map((j) => ({
        id: j.id,
        kind: j.kind,
        state: j.state,
        periodStart: j.periodStart.toISOString(),
        periodEnd: j.periodEnd.toISOString(),
        approvedAt: j.approvedAt?.toISOString() ?? null,
        hasArtifact: Boolean(j.artifactHtml),
      })),
    };
  });

  app.post("/api/reports", async (request, reply) => {
    const session = await deps.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) return problem(reply, 401, "Session required", request.id);

    const parsed = CreateBody.safeParse(request.body ?? {});
    if (!parsed.success) {
      return problem(reply, 400, parsed.error.message, request.id);
    }

    const plant = await resolvePlant(
      deps,
      session.user.id,
      parsed.data.orgId,
      parsed.data.plantId,
    );
    if (!plant) return problem(reply, 403, "No plant membership", request.id);

    try {
      requirePermission(plant.role, "report:export");
    } catch (err) {
      if (err instanceof AuthzError) {
        return problem(reply, 403, err.message, request.id);
      }
      throw err;
    }

    const { job, created } = await createReportJob(deps.db, {
      orgId: plant.orgId,
      plantId: plant.id,
      kind: parsed.data.kind,
      periodStart: new Date(parsed.data.periodStart),
      periodEnd: new Date(parsed.data.periodEnd),
      createdBy: session.user.id,
    });

    let current = job;
    if (created) {
      if (deps.enqueueGenerate) {
        const bossId = await deps.enqueueGenerate(job.id);
        if (bossId) {
          const [updated] = await deps.db
            .update(reportJobs)
            .set({ bossJobId: bossId, updatedAt: new Date() })
            .where(eq(reportJobs.id, job.id))
            .returning();
          current = updated ?? job;
        }
      } else {
        current = await completeReportJob(deps.db, job.id, {
          plantName: plant.name,
          plantId: plant.externalPlantId,
          timezone: plant.timezone,
        });
      }
    }

    return reply.status(created ? 201 : 200).send({
      id: current.id,
      state: current.state,
      created,
      dedupeKey: current.dedupeKey,
    });
  });

  app.post("/api/reports/:id/approve", async (request, reply) => {
    const session = await deps.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) return problem(reply, 401, "Session required", request.id);

    const q = request.query as { plantId?: string; orgId?: string };
    const plant = await resolvePlant(
      deps,
      session.user.id,
      q.orgId,
      q.plantId,
    );
    if (!plant) return problem(reply, 403, "No plant membership", request.id);

    try {
      requirePermission(plant.role, "report:export");
    } catch (err) {
      if (err instanceof AuthzError) {
        return problem(reply, 403, err.message, request.id);
      }
      throw err;
    }

    const { id } = request.params as { id: string };
    try {
      const job = await approveReportJob(deps.db, id, session.user.id);
      return {
        id: job.id,
        state: job.state,
        approvedAt: job.approvedAt?.toISOString() ?? null,
      };
    } catch (err) {
      return problem(
        reply,
        409,
        err instanceof Error ? err.message : "Cannot approve",
        request.id,
      );
    }
  });

  app.get("/api/reports/:id/artifact", async (request, reply) => {
    const session = await deps.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) return problem(reply, 401, "Session required", request.id);

    const q = request.query as { plantId?: string; orgId?: string };
    const plant = await resolvePlant(
      deps,
      session.user.id,
      q.orgId,
      q.plantId,
    );
    if (!plant) return problem(reply, 403, "No plant membership", request.id);

    try {
      requirePermission(plant.role, "report:export");
    } catch (err) {
      if (err instanceof AuthzError) {
        return problem(reply, 403, err.message, request.id);
      }
      throw err;
    }

    const { id } = request.params as { id: string };
    const job = await deps.db
      .select()
      .from(reportJobs)
      .where(eq(reportJobs.id, id))
      .then((rows) => rows[0]);

    if (!job || job.plantId !== plant.id) {
      return problem(reply, 404, "Report not found", request.id);
    }
    if (job.state !== "approved" && job.state !== "pending_approval") {
      return problem(
        reply,
        409,
        "Artifact not ready for review/download",
        request.id,
      );
    }
    if (!job.artifactHtml) {
      return problem(reply, 404, "Artifact missing", request.id);
    }

    return reply
      .status(200)
      .header("content-type", "text/html; charset=utf-8")
      .send(job.artifactHtml);
  });
}
