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
  whoLabel: z.string().optional(),
  valueDomain: z.enum(["energy_efficiency", "equipment_health"]).optional(),
  wasteCategory: z.number().int().min(1).max(6).optional(),
  evidenceRefs: z.array(z.string()).optional(),
  /** Issued — L4 first_recommended_at */
  firstRecommendedAt: z.string().nullable().optional(),
  acceptedAt: z.string().nullable().optional(),
  /** Actually done — L5 DONE */
  implementedAt: z.string().nullable().optional(),
  /** Ops-confirmed clearance — not bill verified */
  verifiedAt: z.string().nullable().optional(),
  opsLabel: z.string().optional(),
  billLabel: z.string().optional(),
  verificationStatus: z
    .enum(["pending", "ops_confirmed", "verified", "disputed", "modeled"])
    .optional(),
  realisedInr: z.number().optional(),
  potentialInr: z.number().optional(),
  opportunityCost: z
    .object({
      delayDays: z.number(),
      modeledInr: z.number(),
      verificationStatus: z.literal("modeled"),
    })
    .optional(),
  isMdDemand: z.boolean().optional(),
  mdEpisodeId: z.string().optional(),
  mdEpisode: z.record(z.string(), z.unknown()).optional(),
  actions: z.array(z.string()).optional(),
  risks: z.array(z.string()).optional(),
  evidenceBundleId: z.string().optional(),
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

function impactObject(raw: Record<string, unknown>): Record<string, unknown> | undefined {
  const impact = raw.impact;
  return impact && typeof impact === "object" && !Array.isArray(impact)
    ? (impact as Record<string, unknown>)
    : undefined;
}

function priorityFromRaw(raw: Record<string, unknown>): "high" | "med" | "low" | undefined {
  const label = firstString(raw.priority);
  if (label === "high" || label === "med" || label === "low") return label;
  const n = firstNumber(raw.priority);
  if (n === undefined) return undefined;
  if (n <= 2) return "high";
  if (n <= 3) return "med";
  return "low";
}

function evidenceRefsFromRaw(raw: Record<string, unknown>): string[] | undefined {
  const refs = raw.evidence_refs ?? raw.evidenceRefs;
  if (!Array.isArray(refs)) return undefined;
  const strings = refs.filter((r): r is string => typeof r === "string" && r.length > 0);
  return strings.length > 0 ? strings : undefined;
}

function valueDomainFromRaw(raw: Record<string, unknown>): "energy_efficiency" | "equipment_health" | undefined {
  const v = firstString(raw.value_domain, raw.valueDomain);
  if (v === "energy_efficiency" || v === "equipment_health") return v;
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

function ledgerSummaryFromRaw(raw: Record<string, unknown>): {
  potentialInr?: number;
  realisedInr?: number;
  opportunityCost?: {
    delayDays: number;
    modeledInr: number;
    verificationStatus: "modeled";
  };
  verificationStatus?: "pending" | "ops_confirmed" | "verified" | "disputed" | "modeled";
} {
  const ls = raw.ledger_summary;
  if (!ls || typeof ls !== "object" || Array.isArray(ls)) {
    return {};
  }
  const summary = ls as Record<string, unknown>;
  const potential = summary.potential as Record<string, unknown> | null | undefined;
  const realised = summary.realised_ops as Record<string, unknown> | null | undefined;
  const opp = summary.opportunity_cost as Record<string, unknown> | null | undefined;
  const out: ReturnType<typeof ledgerSummaryFromRaw> = {};
  const potInr = firstNumber(potential?.potential_inr);
  if (potInr !== undefined) out.potentialInr = potInr;
  const realInr = firstNumber(realised?.realised_inr);
  if (realInr !== undefined) {
    out.realisedInr = realInr;
    out.verificationStatus = "ops_confirmed";
  } else if (potential) {
    out.verificationStatus = "pending";
  }
  const delayDays = firstNumber(opp?.delay_days);
  const modeledInr = firstNumber(opp?.realised_inr);
  if (delayDays !== undefined && modeledInr !== undefined) {
    out.opportunityCost = {
      delayDays,
      modeledInr,
      verificationStatus: "modeled",
    };
  }
  return out;
}

/** Map an L5 wire prescription (loosely typed upstream) → product shape. */
export function mapL5PrescriptionToProduct(
  raw: Record<string, unknown>,
): ProductPrescription {
  const id = firstString(raw.id, raw.prescription_id, raw.rx_id);
  if (!id) throw new Error("L5 prescription missing id/prescription_id");
  const plantId = firstString(raw.plant_id, raw.plantId);
  if (!plantId) throw new Error("L5 prescription missing plant_id");
  const impact = impactObject(raw);
  const money = ledgerSummaryFromRaw(raw);
  const isMd =
    raw.is_md_demand === true ||
    raw.isMdDemand === true ||
    ["md_overlap", "md_exceedance_risk", "cmd_oversized", "1"].includes(
      String(firstString(raw.category) ?? ""),
    );

  const opsLabel = firstString(raw.ops_label, raw.opsLabel);
  let verificationStatus = money.verificationStatus;
  if (!verificationStatus && opsLabel === "ops_confirmed") {
    verificationStatus = "ops_confirmed";
  }

  return ProductPrescriptionSchema.parse({
    id,
    plantId,
    title: firstString(raw.title, raw.what, raw.action, raw.summary) ?? `Prescription ${id}`,
    why: firstString(raw.why, raw.reason, raw.description) ?? "",
    impactInrPerMonth:
      firstNumber(
        raw.impact_inr_per_month,
        raw.impact_inr,
        raw.savings_inr_per_month,
        impact?.inr_monthly,
      ) ?? 0,
    confidence: firstNumber(raw.confidence, impact?.confidence) ?? 0.75,
    lane: laneFromRaw(raw),
    ownerRole: ownerRoleFromRaw(raw),
    dueAt: firstString(raw.due_at, raw.dueAt) ?? new Date().toISOString(),
    category: firstString(raw.category),
    priority: priorityFromRaw(raw),
    billLine: firstString(raw.bill_line, raw.billLine),
    effort: firstString(raw.effort),
    ruleId: firstString(raw.rule_id, raw.ruleId, raw.template_id),
    relatedAlarmId:
      firstString(raw.related_alarm_id, raw.relatedAlarmId) ??
      (typeof (raw.alarm as { alarm_id?: string } | undefined)?.alarm_id === "string"
        ? (raw.alarm as { alarm_id: string }).alarm_id
        : undefined),
    dueLabel: firstString(raw.when, raw.due_label, raw.dueLabel),
    whoLabel: firstString(raw.who_label, raw.whoLabel, raw.who),
    valueDomain: valueDomainFromRaw(raw),
    wasteCategory: firstNumber(raw.waste_category, raw.wasteCategory),
    evidenceRefs: evidenceRefsFromRaw(raw),
    evidenceBundleId: firstString(raw.evidence_bundle_id, raw.evidenceBundleId),
    firstRecommendedAt: firstString(raw.first_recommended_at, raw.firstRecommendedAt) ?? null,
    acceptedAt: firstString(raw.accepted_at, raw.acceptedAt) ?? null,
    implementedAt: firstString(raw.implemented_at, raw.implementedAt) ?? null,
    verifiedAt: firstString(raw.verified_at, raw.verifiedAt) ?? null,
    opsLabel: opsLabel,
    billLabel: firstString(raw.bill_label, raw.billLabel),
    verificationStatus,
    realisedInr: money.realisedInr,
    potentialInr: money.potentialInr,
    opportunityCost: money.opportunityCost,
    isMdDemand: isMd,
    mdEpisodeId: firstString(raw.md_episode_id, raw.mdEpisodeId),
    mdEpisode:
      raw.md_episode && typeof raw.md_episode === "object" && !Array.isArray(raw.md_episode)
        ? (raw.md_episode as Record<string, unknown>)
        : undefined,
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

export type ListPrescriptionsSource = "l5" | "fixture" | "unavailable";

export async function listPrescriptionsForPlant(input: {
  l5?: L5WorkflowClient | null;
  fixture: PrescriptionStore;
  orgId: string;
  plantId: string;
  /** When true, never substitute in-memory fixtures. */
  strictLive?: boolean;
}): Promise<{
  items: ProductPrescription[];
  source: ListPrescriptionsSource;
  detail?: string;
}> {
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
      if (input.strictLive) {
        return {
          source: "unavailable",
          items: [],
          detail: err.message || "L5 unreachable",
        };
      }
      // fall through to fixture
    }
  }
  if (input.strictLive) {
    return {
      source: "unavailable",
      items: [],
      detail: input.l5 ? "L5 unreachable" : "L5 live gate off",
    };
  }
  return { source: "fixture", items: input.fixture.list(input.plantId) };
}
