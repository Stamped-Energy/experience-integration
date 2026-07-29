import type { FastifyInstance } from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import type { Auth } from "../auth/index.js";
import { AuthzError, requirePermission } from "../authz/index.js";
import type { Db } from "../db/client.js";
import { resolveActivePlant } from "../tenancy/service.js";
import type { L5WorkflowClient } from "../upstream/l5/client.js";
import { orgIdForExternalPlantId } from "../upstream/mappings.js";
import {
  createFixturePrescriptionStore,
  listPrescriptionsForPlant,
  type PrescriptionStore,
  type ProductPrescription,
} from "./service.js";

const DEFAULT_FIXTURE: ProductPrescription[] = [
  {
    id: "rx_9001",
    plantId: "plant_jaipur_01",
    title: "Stagger Kiln 1 co-start with Mill 2 by 10 minutes",
    why: "They started together and pushed MD over the TOD peak",
    impactInrPerMonth: 84000,
    confidence: 0.86,
    lane: "needs_review",
    ownerRole: "supervisor",
    dueAt: "2026-07-22T18:00:00+05:30",
    dueLabel: "This week",
    category: "Load management",
    priority: "high",
    billLine: "MD (kVA)",
    effort: "Sequence change · no new equipment",
    ruleId: "physics/md_overlap@v2.4",
    relatedAlarmId: "alm_1001",
  },
  {
    id: "rx_9002",
    plantId: "plant_jaipur_01",
    title: "APFC health check — Cement Mill 1",
    why: "PF 0.84 drifting toward the penalty slab this billing window",
    impactInrPerMonth: 38000,
    confidence: 0.91,
    lane: "active",
    ownerRole: "operator",
    dueAt: "2026-07-23T12:00:00+05:30",
    dueLabel: "Before bill close",
    category: "Power factor",
    priority: "high",
    billLine: "PF penalty",
    effort: "Inspection · stage swap if needed",
    ruleId: "pf/mill_1_slab@v3.0",
    relatedAlarmId: "alm_1002",
  },
  {
    id: "rx_v001",
    plantId: "plant_vinayak_1",
    title: "Stagger Kiln 1 co-start to cut MD coincidence",
    why: "Kiln 1 co-starts pushed load 112% into the TOD peak window",
    impactInrPerMonth: 79000,
    confidence: 0.83,
    lane: "needs_review",
    ownerRole: "supervisor",
    dueAt: "2026-07-22T18:00:00+05:30",
    dueLabel: "This week",
    category: "Load management",
    priority: "high",
    billLine: "MD (kVA)",
    effort: "Sequence change · no new equipment",
    ruleId: "physics/md_overlap@v2.4",
    relatedAlarmId: "alm_v1",
  },
  {
    id: "rx_v002",
    plantId: "plant_vinayak_1",
    title: "APFC health check — Cement Mill 1",
    why: "PF 0.86 drifting toward the penalty slab this billing window",
    impactInrPerMonth: 33000,
    confidence: 0.88,
    lane: "active",
    ownerRole: "operator",
    dueAt: "2026-07-23T12:00:00+05:30",
    dueLabel: "Before bill close",
    category: "Power factor",
    priority: "med",
    billLine: "PF penalty",
    effort: "Inspection · stage swap if needed",
    ruleId: "pf/mill_1_slab@v3.0",
    relatedAlarmId: "alm_v2",
  },
];

export type PrescriptionRouteDeps = {
  auth: Auth;
  db: Db;
  l5?: L5WorkflowClient | null;
  fixture?: PrescriptionStore;
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
    title: title ?? (status === 401 ? "Unauthorized" : "Forbidden"),
    status,
    detail,
    request_id: requestId,
  });
}

export async function registerPrescriptionRoutes(
  app: FastifyInstance,
  deps: PrescriptionRouteDeps,
): Promise<void> {
  const fixture = deps.fixture ?? createFixturePrescriptionStore(DEFAULT_FIXTURE);

  app.get("/api/prescriptions", async (request, reply) => {
    const session = await deps.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) {
      return problem(reply, 401, "Session required", request.id);
    }

    const q = request.query as { orgId?: string; plantId?: string };
    const resolved = await resolveActivePlant(deps.db, {
      userId: session.user.id,
      orgId: q.orgId,
    });
    const plant =
      resolved.authorized.find((p) => p.externalPlantId === q.plantId) ??
      resolved.activePlant ??
      resolved.authorized[0];
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

    const result = await listPrescriptionsForPlant({
      l5: deps.l5,
      fixture,
      orgId: orgIdForExternalPlantId(plant.externalPlantId),
      plantId: plant.externalPlantId,
    });
    return { items: result.items, source: result.source };
  });
}
