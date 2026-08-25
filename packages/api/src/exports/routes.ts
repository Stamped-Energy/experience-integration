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
} from "../prescriptions/service.js";
import {
  ledgerRowsToCsv,
  prescriptionAuditRowsToCsv,
  type LedgerCsvRow,
  type PrescriptionAuditCsvRow,
} from "./csv.js";

export type ExportRouteDeps = {
  auth: Auth;
  db: Db;
  l5?: L5WorkflowClient | null;
  prescriptionFixture?: PrescriptionStore;
  strictLive?: boolean;
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

async function resolvePlant(
  deps: ExportRouteDeps,
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

function monthBoundsIso(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function registerExportRoutes(
  app: FastifyInstance,
  deps: ExportRouteDeps,
): Promise<void> {
  app.get("/api/exports/ledger.csv", async (request, reply) => {
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
    if (!plant) {
      return problem(reply, 403, "No plant membership", request.id);
    }

    try {
      requirePermission(plant.role, "report:export");
      requirePermission(plant.role, "ledger:read");
    } catch (err) {
      if (err instanceof AuthzError) {
        return problem(reply, 403, err.message, request.id);
      }
      throw err;
    }

    const orgId = orgIdForExternalPlantId(plant.externalPlantId);
    const listed = await listPrescriptionsForPlant({
      l5: deps.l5 ?? null,
      fixture: deps.prescriptionFixture ?? createFixturePrescriptionStore([]),
      orgId,
      plantId: plant.externalPlantId,
      strictLive: deps.strictLive ?? true,
    });

    const { start, end } = monthBoundsIso();
    const rows: LedgerCsvRow[] = listed.items.map((rx) => {
      const realised = rx.realisedInr ?? 0;
      const potential = rx.potentialInr ?? rx.impactInrPerMonth ?? 0;
      return {
        entry_id: `led_${rx.id}`,
        plant_id: rx.plantId,
        prescription_id: rx.id,
        entry_type: realised > 0 ? "realised_savings" : "potential_savings",
        period_start_ist: start,
        period_end_ist: end,
        potential_inr: potential,
        realised_inr: realised,
        verification_status: rx.verificationStatus ?? "pending",
        mv_method: "ledger_summary",
        baseline_id: "not_measured_by_stamped",
        emission_factor_ref: "not_measured_by_stamped",
        timezone: "Asia/Kolkata" as const,
      };
    });

    const body = ledgerRowsToCsv(rows);
    return reply
      .status(200)
      .header("content-type", "text/csv; charset=utf-8")
      .header(
        "content-disposition",
        `attachment; filename="ledger_${plant.externalPlantId}.csv"`,
      )
      .send(body);
  });

  app.get("/api/exports/prescriptions.csv", async (request, reply) => {
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
    if (!plant) {
      return problem(reply, 403, "No plant membership", request.id);
    }

    try {
      requirePermission(plant.role, "report:export");
    } catch (err) {
      if (err instanceof AuthzError) {
        return problem(reply, 403, err.message, request.id);
      }
      throw err;
    }

    const orgId = orgIdForExternalPlantId(plant.externalPlantId);
    const listed = await listPrescriptionsForPlant({
      l5: deps.l5 ?? null,
      fixture: deps.prescriptionFixture ?? createFixturePrescriptionStore([]),
      orgId,
      plantId: plant.externalPlantId,
      strictLive: deps.strictLive ?? true,
    });

    const rows: PrescriptionAuditCsvRow[] = listed.items.map((rx) => ({
      prescription_id: rx.id,
      plant_id: rx.plantId,
      title: rx.title,
      lane: rx.lane,
      impact_inr_per_month: rx.impactInrPerMonth,
      confidence: rx.confidence,
      owner_role: rx.ownerRole,
      due_at_ist: rx.dueAt,
      verification_status: rx.verificationStatus ?? "",
      realised_inr: rx.realisedInr ?? "",
      timezone: "Asia/Kolkata" as const,
    }));

    const body = prescriptionAuditRowsToCsv(rows);
    return reply
      .status(200)
      .header("content-type", "text/csv; charset=utf-8")
      .header(
        "content-disposition",
        `attachment; filename="prescription_audit_${plant.externalPlantId}.csv"`,
      )
      .send(body);
  });
}
