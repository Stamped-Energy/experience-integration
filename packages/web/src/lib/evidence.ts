import {
  findEvidenceSample,
  resolvePrimaryEvidenceId,
  type EvidenceSample,
} from "@/fixtures/evidence-samples";
import type { Alarm, Prescription } from "@/lib/types";
import { resolveRouteState, type RouteStateModel } from "@/lib/route-state";

export type { EvidenceSample } from "@/fixtures/evidence-samples";
export {
  evidenceSamplesFixture,
  findEvidenceSample,
  resolveEvidenceIdForAlarm,
  resolveEvidenceIdForFinding,
  resolveEvidenceIdForRx,
  resolvePrimaryEvidenceId,
} from "@/fixtures/evidence-samples";

export type EvidenceScope = {
  plantId: string;
  assetId: string;
  assetLabel: string;
  metric: string;
  from: string;
  to: string;
  baselineId: string | null;
  alarmId?: string;
  rxId?: string;
  title: string;
};

export type EvidenceLineage = {
  ruleId: string;
  ruleLabel: string;
  tariffId: string;
  tariffLabel: string;
  findingId?: string;
  sources: string[];
};

export type EvidencePack = {
  scope: EvidenceScope;
  lineage: EvidenceLineage;
  anomaly: { from: string; to: string; summary: string };
  /** Honest missing upstream slices — never invent baseline when gated. */
  missing: string[];
  loadDialPct: Record<string, number>;
};

export function resolveEvidenceScope(input: {
  plantId: string;
  alarmId?: string;
  rxId?: string;
  alarms: readonly Alarm[];
  prescriptions: readonly Prescription[];
}): EvidenceScope {
  const alarm = input.alarmId
    ? input.alarms.find((a) => a.id === input.alarmId)
    : undefined;
  const rx = input.rxId
    ? input.prescriptions.find((p) => p.id === input.rxId)
    : alarm?.relatedPrescriptionId
      ? input.prescriptions.find((p) => p.id === alarm.relatedPrescriptionId)
      : undefined;

  if (alarm) {
    const sampleId = resolvePrimaryEvidenceId({
      alarmId: alarm.id,
      findingId: alarm.findingId,
    });
    const sample = sampleId ? findEvidenceSample(sampleId) : undefined;
    return {
      plantId: input.plantId,
      assetId: alarm.assetId,
      assetLabel: alarm.assetLabel,
      metric: "active_power_kw",
      from: "2026-06-21T00:00:00+05:30",
      to: "2026-07-21T00:00:00+05:30",
      baselineId: sample?.baselineId ?? "bl_kiln_1_7d",
      alarmId: alarm.id,
      rxId: rx?.id ?? alarm.relatedPrescriptionId,
      title: `Proof · ${alarm.assetLabel}`,
    };
  }

  if (rx) {
    const sample = resolvePrimaryEvidenceId({ rxId: rx.id })
      ? findEvidenceSample(resolvePrimaryEvidenceId({ rxId: rx.id })!)
      : undefined;
    const linkedAlarm = input.alarms.find((a) => a.relatedPrescriptionId === rx.id);
    return {
      plantId: input.plantId,
      assetId: sample?.assetId ?? linkedAlarm?.assetId ?? "kiln_1",
      assetLabel: sample?.assetLabel ?? linkedAlarm?.assetLabel ?? "Kiln 1",
      metric: "active_power_kw",
      from: "2026-06-21T00:00:00+05:30",
      to: "2026-07-21T00:00:00+05:30",
      baselineId: sample?.baselineId ?? "bl_kiln_1_7d",
      rxId: rx.id,
      title: `Proof · ${rx.title}`,
    };
  }

  return {
    plantId: input.plantId,
    assetId: "kiln_1",
    assetLabel: "Kiln 1",
    metric: "active_power_kw",
    from: "2026-06-21T00:00:00+05:30",
    to: "2026-07-21T00:00:00+05:30",
    baselineId: "bl_kiln_1_7d",
    title: "Evidence explorer",
  };
}

/** Fixture Auto pack — baseline slice gated until L2 publishes reads. */
export function buildEvidencePack(
  scope: EvidenceScope,
  opts: { baselineAvailable?: boolean } = {},
): EvidencePack {
  const baselineAvailable = opts.baselineAvailable === true;
  const missing: string[] = [];
  if (!baselineAvailable) missing.push("baseline");

  return {
    scope,
    lineage: {
      ruleId: "rule_md_coincidence_v3",
      ruleLabel: "MD coincidence · peak TOD window",
      tariffId: "tariff_rvpnl_ht_2026",
      tariffLabel: "Rajasthan HT industrial TOD",
      findingId: scope.alarmId ? "fnd_4401" : undefined,
      sources: ["Detection rule", "Meter readings", ...(baselineAvailable ? ["Baseline comparison"] : [])],
    },
    anomaly: {
      from: "2026-07-21T09:30:00+05:30",
      to: "2026-07-21T11:00:00+05:30",
      summary: "Demand 14% above design during 10–11 TOD peak; MD coincidence risk.",
    },
    missing,
    loadDialPct: {
      kiln_1: 108,
      mill_1: 72,
      comp_2: 54,
    },
  };
}

export function evidenceRouteState(pack: EvidencePack): RouteStateModel {
  return resolveRouteState({ missing: pack.missing });
}
