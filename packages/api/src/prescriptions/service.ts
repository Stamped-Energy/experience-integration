import {
  PrescriptionLaneSchema,
  RoleSchema,
  STAMPED_INTERNAL_WORKFLOW_STATUSES,
  WorkflowStatusSchema,
  workflowStatusToLane,
  type PrescriptionLane,
  type Role,
} from "@stamped/l6-contracts";
import { z } from "zod";
import { UpstreamError } from "../upstream/http.js";
import type { L5WorkflowClient } from "../upstream/l5/client.js";

export const ProductPrescriptionSchema = z.object({
  id: z.string(),
  plantId: z.string(),
  title: z.string(),
  why: z.string(),
  impactInrPerMonth: z.number(),
  confidence: z.number(),
  lane: PrescriptionLaneSchema,
  ownerRole: RoleSchema,
  dueAt: z.string(),
  category: z.string().optional(),
  priority: z.enum(["high", "med", "low"]).optional(),
  billLine: z.string().optional(),
  effort: z.string().optional(),
  ruleId: z.string().optional(),
  relatedAlarmId: z.string().optional(),
  dueLabel: z.string().optional(),
});
export type ProductPrescription = z.infer<typeof ProductPrescriptionSchema>;

function firstString(...values: unknown[]): string | undefined {
  for (const v of values) {
    if (typeof v === "string" && v.length > 0) return v;
  }
  return undefined;
}

function firstNumber(...values: unknown[]): number | undefined {
  for (const v of values) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) {
      return Number(v);
    }
  }
  return undefined;
}

export function isCustomerVisiblePrescription(raw: Record<string, unknown>): boolean {
  const status = firstString(raw.status, raw.workflow_status, raw.to_status);
  if (status && STAMPED_INTERNAL_WORKFLOW_STATUSES.has(status)) return false;
  return true;
}

function laneFromRaw(raw: Record<string, unknown>): PrescriptionLane {
  const status = firstString(raw.status, raw.workflow_status, raw.to_status);
  if (status && STAMPED_INTERNAL_WORKFLOW_STATUSES.has(status)) {
    throw new Error(`gated prescription leaked to customer mapper: ${status}`);
  }
  if (status) {
    const parsed = WorkflowStatusSchema.safeParse(status);
    if (parsed.success) return workflowStatusToLane(parsed.data);
  }
  const lane = firstString(raw.lane);
  if (lane) {
    const parsed = PrescriptionLaneSchema.safeParse(lane);
    if (parsed.success) return parsed.data;
  }
  return "needs_review";
}

function ownerRoleFromRaw(raw: Record<string, unknown>): Role {
  const role = firstString(raw.owner_role, raw.ownerRole, raw.assigned_role);
  const parsed = role ? RoleSchema.safeParse(role) : undefined;
  return parsed?.success ? parsed.data : "operator";
}

/** Map an L5 wire prescription (loosely typed upstream) → product shape. */
export function mapL5PrescriptionToProduct(
  raw: Record<string, unknown>,
): ProductPrescription {
  const id = firstString(raw.id, raw.prescription_id, raw.rx_id);
  if (!id) throw new Error("L5 prescription missing id/prescription_id");
  const plantId = firstString(raw.plant_id, raw.plantId);
  if (!plantId) throw new Error("L5 prescription missing plant_id");

  return ProductPrescriptionSchema.parse({
    id,
    plantId,
    title: firstString(raw.title, raw.action, raw.summary) ?? `Prescription ${id}`,
    why: firstString(raw.why, raw.reason, raw.description) ?? "",
    impactInrPerMonth:
      firstNumber(raw.impact_inr_per_month, raw.impact_inr, raw.savings_inr_per_month) ?? 0,
    confidence: firstNumber(raw.confidence) ?? 0,
    lane: laneFromRaw(raw),
    ownerRole: ownerRoleFromRaw(raw),
    dueAt: firstString(raw.due_at, raw.dueAt) ?? new Date().toISOString(),
    category: firstString(raw.category),
    priority: (firstString(raw.priority) as "high" | "med" | "low" | undefined) ?? undefined,
    billLine: firstString(raw.bill_line, raw.billLine),
    effort: firstString(raw.effort),
    ruleId: firstString(raw.rule_id, raw.ruleId),
    relatedAlarmId: firstString(raw.related_alarm_id, raw.relatedAlarmId),
    dueLabel: firstString(raw.due_label, raw.dueLabel),
  });
}

const LANE_RANK: Record<PrescriptionLane, number> = {
  needs_review: 0,
  active: 1,
  verifying: 2,
  closed: 3,
};

export function sortProductPrescriptions(
  rows: readonly ProductPrescription[],
): ProductPrescription[] {
  return [...rows].sort((a, b) => {
    const lane = LANE_RANK[a.lane] - LANE_RANK[b.lane];
    if (lane !== 0) return lane;
    return b.impactInrPerMonth - a.impactInrPerMonth;
  });
}

/** In-memory fixture store — Auto mode when L5 is unreachable / fixture-only. */
export function createFixturePrescriptionStore(seed: ProductPrescription[]) {
  const rows = seed.map((p) => ({ ...p }));
  return {
    list(plantId: string) {
      return sortProductPrescriptions(rows.filter((p) => p.plantId === plantId));
    },
  };
}
export type PrescriptionStore = ReturnType<typeof createFixturePrescriptionStore>;

export async function listPrescriptionsForPlant(input: {
  l5?: L5WorkflowClient | null;
  fixture: PrescriptionStore;
  orgId: string;
  plantId: string;
}): Promise<{ items: ProductPrescription[]; source: "l5" | "fixture" }> {
  if (input.l5) {
    try {
      const { items } = await input.l5.listPrescriptions({
        orgId: input.orgId,
        plantId: input.plantId,
      });
      return {
        source: "l5",
        items: sortProductPrescriptions(
          items.filter(isCustomerVisiblePrescription).map(mapL5PrescriptionToProduct),
        ),
      };
    } catch (err) {
      if (!(err instanceof UpstreamError)) throw err;
      // fall through to fixture
    }
  }
  return { source: "fixture", items: input.fixture.list(input.plantId) };
}
