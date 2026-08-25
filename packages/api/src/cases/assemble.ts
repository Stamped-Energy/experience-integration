/** Assemble L6CasePayload from L5 detail + optional L2 series. */

import type { L2QueryClient } from "../upstream/l2/client.js";
import type { L5WorkflowClient } from "../upstream/l5/client.js";
import { toProductAlarm } from "../upstream/l5/client.js";
import type { ProductAlarm } from "../alarms/service.js";
import {
  mapL5PrescriptionToProduct,
  type ProductPrescription,
} from "../prescriptions/service.js";
import {
  buildCaseDetail,
  buildEvidencePack,
  fetchL2Series,
  packToSample,
  scopeFromRaw,
  seriesToSample,
} from "./build-evidence.js";
import {
  L6CasePayloadSchema,
  type CaseEnrichment,
  type EvidenceSeriesDto,
  type L6CasePayload,
} from "./contract.js";

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

function stringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.length > 0);
}

export async function assemblePrescriptionCase(input: {
  l5: L5WorkflowClient;
  l2?: L2QueryClient | null;
  orgId: string;
  plantId: string;
  prescriptionId: string;
}): Promise<L6CasePayload> {
  const raw = (await input.l5.getPrescription({
    orgId: input.orgId,
    plantId: input.plantId,
    prescriptionId: input.prescriptionId,
  })) as Record<string, unknown>;

  const prescription = mapL5PrescriptionToProduct({
    ...raw,
    plant_id: raw.plant_id ?? raw.plantId ?? input.plantId,
  });
  const enrichment = (raw.case_enrichment as CaseEnrichment | null | undefined) ?? null;
  const refs = stringArray(raw.evidence_refs ?? prescription.evidenceRefs);
  const findingWindow =
    typeof asRecord(asRecord(raw).impact).window === "string"
      ? null
      : null; // finding window not always on detail; seed puts window on tag refs
  const scope = scopeFromRaw(refs, findingWindow);
  const missing: string[] = [];

  let series: Awaited<ReturnType<typeof fetchL2Series>>["series"];
  let loadDialPct: Record<string, number> = {};

  if (input.l2) {
    const l2res = await fetchL2Series({
      l2: input.l2,
      plantId: input.plantId,
      scope,
    });
    series = l2res.series;
    loadDialPct = l2res.loadDialPct;
    missing.push(...l2res.missing);
    if (scope.baselineId) {
      try {
        await input.l2.getBaseline(scope.baselineId);
      } catch {
        missing.push("baseline");
      }
    }
  } else {
    missing.push("measurements");
    if (scope.baselineId) missing.push("baseline");
  }

  const alarmMeta = asRecord(raw.alarm);
  const alarmId =
    (typeof alarmMeta.alarm_id === "string" ? alarmMeta.alarm_id : undefined) ??
    prescription.relatedAlarmId;

  const pack = buildEvidencePack({
    plantId: input.plantId,
    title: `Proof · ${prescription.title}`,
    scope,
    why: prescription.why,
    ruleId: prescription.ruleId,
    alarmId,
    rxId: prescription.id,
    missing: [...new Set(missing)],
    loadDialPct,
  });

  const bundleId =
    typeof raw.evidence_bundle_id === "string" ? raw.evidence_bundle_id : undefined;
  // UI identity is always evd_{rxId}; L5 bundleId is download-only.
  const sampleId = `evd_${prescription.id}`;

  const sample = series
    ? seriesToSample({
        plantId: input.plantId,
        sampleId,
        issueTitle: prescription.title,
        pack,
        series,
        enrichment,
        alarmId,
        rxId: prescription.id,
      })
    : packToSample({
        plantId: input.plantId,
        sampleId,
        issueTitle: prescription.title,
        pack,
        enrichment,
        alarmId,
        rxId: prescription.id,
      });

  if (enrichment?.alarm_summary && alarmId) {
    // enrich alarm summary when we join alarm below
  }

  let alarm: ProductAlarm | undefined;
  if (alarmId && input.l5) {
    try {
      const listed = await input.l5.listAlarms({
        orgId: input.orgId,
        plantId: input.plantId,
      });
      const hit = listed.items.find((a) => a.id === alarmId);
      if (hit) {
        alarm = toProductAlarm(hit) as ProductAlarm;
        if (enrichment?.alarm_summary) {
          alarm = { ...alarm, summary: enrichment.alarm_summary };
        }
      }
    } catch {
      // ignore — prescription case still valid
    }
  }

  const caseDetail = buildCaseDetail({
    title: prescription.title,
    why: prescription.why,
    category: prescription.category,
    priority: prescription.priority,
    lane: prescription.lane,
    owner: prescription.whoLabel ?? prescription.ownerRole,
    billLine: prescription.billLine,
    effort: prescription.effort,
    dueLabel: prescription.dueLabel,
    confidence: prescription.confidence,
    impactInr: prescription.impactInrPerMonth,
    pack,
    enrichment,
    series,
  });

  const source = series ? "l5+l2" : missing.includes("measurements") ? "l5" : "l5";

  const payload: L6CasePayload = {
    source: series ? "l5+l2" : "l5",
    generatedAt: new Date().toISOString(),
    plantId: input.plantId,
    prescription: {
      ...prescription,
      ...(enrichment && !enrichment.error
        ? {
            actions: enrichment.commissioning,
            // caseDetail attached at top-level; keep rx clean
          }
        : {}),
    } as ProductPrescription,
    ...(alarm ? { alarm } : {}),
    enrichment,
    caseDetail: caseDetail as L6CasePayload["caseDetail"],
    evidence: {
      ...(bundleId ? { bundleId } : {}),
      refs,
      pack,
      sample,
      ...(series ? { series } : {}),
      ...(bundleId ? { downloadHref: `/api/evidence/${bundleId}/download` } : {}),
    },
    asset: {
      id: pack.scope.assetId,
      label: pack.scope.assetLabel,
      ...(loadDialPct[pack.scope.assetId] != null
        ? { loadPct: loadDialPct[pack.scope.assetId] }
        : {}),
    },
    links: {
      prescriptionHref: `/prescriptions/${prescription.id}`,
      ...(alarmId ? { alarmHref: `/alarms/${alarmId}` } : {}),
      evidenceHref: `/evidence/${sampleId}`,
    },
  };

  // silence unused
  void source;

  return L6CasePayloadSchema.parse(payload);
}

export async function assembleAlarmCase(input: {
  l5: L5WorkflowClient;
  l2?: L2QueryClient | null;
  orgId: string;
  plantId: string;
  alarmId: string;
}): Promise<L6CasePayload> {
  const listed = await input.l5.listAlarms({
    orgId: input.orgId,
    plantId: input.plantId,
  });
  const hit = listed.items.find((a) => a.id === input.alarmId);
  if (!hit) {
    return L6CasePayloadSchema.parse({
      source: "unavailable",
      generatedAt: new Date().toISOString(),
      plantId: input.plantId,
      detail: "Alarm not found",
      evidence: {
        refs: [],
        pack: buildEvidencePack({
          plantId: input.plantId,
          title: "Alarm",
          scope: scopeFromRaw([]),
          missing: ["alarm"],
        }),
      },
      links: { evidenceHref: "/evidence" },
    });
  }

  let alarm = toProductAlarm(hit) as ProductAlarm;
  const rxId = alarm.relatedPrescriptionId;
  if (rxId) {
    const casePayload = await assemblePrescriptionCase({
      l5: input.l5,
      l2: input.l2,
      orgId: input.orgId,
      plantId: input.plantId,
      prescriptionId: rxId,
    });
    if (casePayload.enrichment?.alarm_summary) {
      alarm = { ...alarm, summary: casePayload.enrichment.alarm_summary };
    }
    return L6CasePayloadSchema.parse({
      ...casePayload,
      alarm,
      links: {
        ...casePayload.links,
        alarmHref: `/alarms/${input.alarmId}`,
        prescriptionHref: `/prescriptions/${rxId}`,
      },
    });
  }

  const pack = buildEvidencePack({
    plantId: input.plantId,
    title: `Proof · ${alarm.assetLabel}`,
    scope: scopeFromRaw([]),
    why: alarm.summary,
    alarmId: alarm.id,
    missing: ["measurements", "evidence_refs"],
  });

  return L6CasePayloadSchema.parse({
    source: "l5",
    generatedAt: new Date().toISOString(),
    plantId: input.plantId,
    alarm,
    evidence: { refs: [], pack },
    links: {
      alarmHref: `/alarms/${alarm.id}`,
      evidenceHref: `/evidence`,
    },
  });
}
