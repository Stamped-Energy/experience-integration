/** Fixture negotiation responses when USE_FIXTURES / L4_LIVE=false. */

const idemCache = new Map<string, Record<string, unknown>>();

export function reviseFixture(input: {
  orgId: string;
  plantId: string;
  prescriptionId: string;
  constraints: Record<string, unknown>;
  constraintSummary?: string;
  idempotencyKey: string;
}) {
  if (idemCache.has(input.idempotencyKey)) {
    return idemCache.get(input.idempotencyKey)!;
  }
  const revision = {
    schema_version: "1.0.0",
    id: `rxrev-fixture-${input.prescriptionId}`,
    org_id: input.orgId,
    plant_id: input.plantId,
    supersedes_rx_id: input.prescriptionId,
    finding_refs: ["f-fixture"],
    negotiation_thread_id: `neg-fixture-${input.prescriptionId}`,
    constraint_summary:
      input.constraintSummary ?? "Fixture supervisor constraint",
    constraints: input.constraints,
    revised_prescription: {
      id: `rx-rev-${input.prescriptionId}`,
      org_id: input.orgId,
      plant_id: input.plantId,
      decision_class: "mgmt_schedule",
      impact: { inr_monthly: 18500, kwh_monthly: 2100, tco2e_monthly: 1.6 },
    },
    diff_summary: "Excluded line_2; stagger line_3 only; impact ₹84.0k → ₹18.5k/mo",
    tradeoff: {
      energy_benefit_inr_monthly: 18500,
      throughput_risk: "PO-8842 protected",
      recommended_window: "Stagger Line 3",
      alternatives: ["HVAC shed"],
      department_owners: ["electrical_supervisor"],
      order_context: "known",
    },
    confirmation: { status: "proposed" },
    proposed_at: new Date().toISOString(),
  };
  idemCache.set(input.idempotencyKey, revision);
  return revision;
}

export function acceptFixture(input: {
  orgId: string;
  plantId: string;
  threadId: string;
  idempotencyKey: string;
}) {
  if (idemCache.has(input.idempotencyKey)) {
    return idemCache.get(input.idempotencyKey)!;
  }
  const result = {
    status: "accepted",
    org_id: input.orgId,
    plant_id: input.plantId,
    negotiation_thread_id: input.threadId,
    prescription_id: `rx-rev-${input.threadId}`,
  };
  idemCache.set(input.idempotencyKey, result);
  return result;
}

export function rejectFixture(input: {
  orgId: string;
  plantId: string;
  threadId: string;
  idempotencyKey: string;
}) {
  if (idemCache.has(input.idempotencyKey)) {
    return idemCache.get(input.idempotencyKey)!;
  }
  const result = {
    status: "rejected",
    org_id: input.orgId,
    plant_id: input.plantId,
    negotiation_thread_id: input.threadId,
  };
  idemCache.set(input.idempotencyKey, result);
  return result;
}
