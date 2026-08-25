import { and, eq } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { plants, reportJobs } from "../db/schema.js";
import {
  canTransition,
  reportDedupeKey,
  transitionReport,
  type ReportState,
} from "./lifecycle.js";
import {
  renderSustainabilityHtml,
  type SustainabilityInputs,
} from "./sustainability.js";

export type CreateReportInput = {
  orgId: string;
  plantId: string;
  kind: string;
  periodStart: Date;
  periodEnd: Date;
  createdBy: string;
};

export async function createReportJob(db: Db, input: CreateReportInput) {
  const dedupeKey = reportDedupeKey({
    orgId: input.orgId,
    plantId: input.plantId,
    kind: input.kind,
    periodStart: input.periodStart.toISOString(),
    periodEnd: input.periodEnd.toISOString(),
  });

  const existing = await db
    .select()
    .from(reportJobs)
    .where(eq(reportJobs.dedupeKey, dedupeKey))
    .then((rows) => rows[0]);

  if (existing) return { job: existing, created: false as const };

  const [job] = await db
    .insert(reportJobs)
    .values({
      orgId: input.orgId,
      plantId: input.plantId,
      kind: input.kind,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      state: "queued",
      dedupeKey,
      createdBy: input.createdBy,
    })
    .returning();

  return { job: job!, created: true as const };
}

export async function markReportRunning(db: Db, id: string) {
  const job = await db
    .select()
    .from(reportJobs)
    .where(eq(reportJobs.id, id))
    .then((rows) => rows[0]);
  if (!job) throw new Error("report job not found");
  const from = job.state as ReportState;
  if (!canTransition(from, "start")) {
    return job; // idempotent no-op if already past queued
  }
  const state = transitionReport(from, "start");
  const [next] = await db
    .update(reportJobs)
    .set({
      state,
      attemptCount: job.attemptCount + 1,
      updatedAt: new Date(),
    })
    .where(eq(reportJobs.id, id))
    .returning();
  return next!;
}

/** Honest artifact: plant identity from DB; missing metrics stay null (never Jaipur fixture). */
export async function completeReportJob(
  db: Db,
  id: string,
  live?: Partial<SustainabilityInputs>,
) {
  const job = await db
    .select()
    .from(reportJobs)
    .where(eq(reportJobs.id, id))
    .then((rows) => rows[0]);
  if (!job) throw new Error("report job not found");

  let state = job.state as ReportState;
  if (canTransition(state, "start")) {
    state = transitionReport(state, "start");
  }
  if (!canTransition(state, "succeed")) {
    return job;
  }
  state = transitionReport(state, "succeed");
  state = transitionReport(state, "submit_for_approval");

  const plant = await db
    .select()
    .from(plants)
    .where(eq(plants.id, job.plantId))
    .then((rows) => rows[0]);

  const html = renderSustainabilityHtml({
    plantName: live?.plantName ?? plant?.name ?? "Plant",
    plantId: live?.plantId ?? plant?.externalPlantId ?? job.plantId,
    periodStart: job.periodStart.toISOString(),
    periodEnd: job.periodEnd.toISOString(),
    timezone: live?.timezone ?? plant?.timezone ?? "Asia/Kolkata",
    gridKwh: live?.gridKwh ?? null,
    renewableKwh: live?.renewableKwh ?? null,
    demandChargeInr: live?.demandChargeInr ?? null,
    powerFactor: live?.powerFactor ?? null,
    opsConfirmedSavingsInr: live?.opsConfirmedSavingsInr ?? null,
    emissionFactorTPerMwh: live?.emissionFactorTPerMwh ?? null,
    emissionFactorRef: live?.emissionFactorRef ?? null,
    productionUnits: live?.productionUnits ?? null,
    methodology:
      live?.methodology ??
      "IPMVP-aligned windows from L2 when available; missing metrics marked not_measured_by_stamped.",
  });

  const [next] = await db
    .update(reportJobs)
    .set({
      state,
      artifactHtml: html,
      error: null,
      updatedAt: new Date(),
    })
    .where(eq(reportJobs.id, id))
    .returning();
  return next!;
}

export async function approveReportJob(
  db: Db,
  id: string,
  approvedBy: string,
) {
  const job = await db
    .select()
    .from(reportJobs)
    .where(eq(reportJobs.id, id))
    .then((rows) => rows[0]);
  if (!job) throw new Error("report job not found");
  const state = transitionReport(job.state as ReportState, "approve");
  const [next] = await db
    .update(reportJobs)
    .set({
      state,
      approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(reportJobs.id, id))
    .returning();
  return next!;
}

export async function listReportJobs(
  db: Db,
  input: { orgId: string; plantId: string },
) {
  return db
    .select()
    .from(reportJobs)
    .where(
      and(
        eq(reportJobs.orgId, input.orgId),
        eq(reportJobs.plantId, input.plantId),
      ),
    );
}
