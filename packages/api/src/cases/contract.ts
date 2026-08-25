/** L6CasePayload — unified envelope for FullCase / AlarmFullCase / EvidenceDetail. */

import { z } from "zod";
import { ProductAlarmSchema } from "../alarms/service.js";
import { ProductPrescriptionSchema } from "../prescriptions/service.js";

export const CaseEnrichmentSchema = z
  .object({
    alarm_summary: z.string().nullable().optional(),
    root_cause: z.array(z.string()).optional(),
    manager_takeaway: z.string().nullable().optional(),
    commissioning: z.array(z.string()).optional(),
    event_snapshot_labels: z.array(z.string()).optional(),
    category_badge: z
      .object({
        label: z.string(),
        tone: z.enum(["critical", "warning", "info", "good"]),
      })
      .nullable()
      .optional(),
    chart_title: z.string().nullable().optional(),
    mv_footer: z.string().nullable().optional(),
    tag_row_labels: z.array(z.string()).optional(),
    model: z.string().optional(),
    enriched_at: z.string().optional(),
    prompt_version: z.string().optional(),
    error: z.boolean().optional(),
    error_detail: z.string().optional(),
    provider: z.string().optional(),
  })
  .passthrough();

export const EvidenceScopeSchema = z.object({
  plantId: z.string(),
  assetId: z.string(),
  assetLabel: z.string(),
  metric: z.string(),
  from: z.string(),
  to: z.string(),
  baselineId: z.string().nullable(),
  alarmId: z.string().optional(),
  rxId: z.string().optional(),
  title: z.string(),
});

export const EvidencePackSchema = z.object({
  scope: EvidenceScopeSchema,
  lineage: z.object({
    ruleId: z.string(),
    ruleLabel: z.string(),
    tariffId: z.string(),
    tariffLabel: z.string(),
    findingId: z.string().optional(),
    sources: z.array(z.string()),
  }),
  anomaly: z.object({
    from: z.string(),
    to: z.string(),
    summary: z.string(),
  }),
  missing: z.array(z.string()),
  loadDialPct: z.record(z.string(), z.number()),
});

export const EvidenceSampleSchema = z.object({
  id: z.string(),
  plantId: z.string(),
  chartTitle: z.string(),
  categoryBadge: z.object({
    label: z.string(),
    tone: z.enum(["critical", "warning", "info", "good"]),
  }),
  chart: z.union([
    z.object({
      kind: z.literal("line"),
      yAxisLabel: z.string(),
      points: z.array(z.object({ x: z.number(), y: z.number() })),
      highlight: z
        .object({ from: z.number(), to: z.number(), label: z.string() })
        .optional(),
    }),
    z.object({
      kind: z.literal("bar"),
      yAxisLabel: z.string(),
      bars: z.array(
        z.object({
          label: z.string(),
          value: z.number(),
          highlight: z.boolean().optional(),
        }),
      ),
      annotation: z.string().optional(),
    }),
  ]),
  tagRows: z.array(
    z.object({
      tag: z.string(),
      value: z.string(),
      window: z.string(),
    }),
  ),
  metadata: z.string(),
  mvFooter: z.string(),
  dials: z.array(
    z.object({
      label: z.string(),
      needle: z.number(),
      needleMax: z.number().optional(),
      display: z.string(),
      unit: z.string().optional(),
    }),
  ),
  alarmId: z.string().optional(),
  rxId: z.string().optional(),
  findingId: z.string().optional(),
  baselineId: z.string().optional(),
  assetLabel: z.string(),
  assetId: z.string(),
  issueTitle: z.string(),
});

export const EvidenceSeriesSchema = z.object({
  assetId: z.string(),
  metric: z.string(),
  from: z.string(),
  to: z.string(),
  granularity: z.string(),
  unit: z.string(),
  points: z.array(z.object({ ts: z.string(), value: z.number() })),
});

export const CaseDetailSchema = z
  .object({
    createdAt: z.string().optional(),
    description: z.string().optional(),
    savingsRange: z.string().optional(),
    rootCause: z.array(z.string()).optional(),
    managerTakeaway: z.string().optional(),
    commissioning: z.array(z.string()).optional(),
    metadata: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
    lineage: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
    eventSnapshot: z
      .object({
        timestamp: z.string(),
        caption: z.string(),
        columns: z.array(
          z.object({
            key: z.string(),
            header: z.string(),
            align: z.enum(["left", "right"]).optional(),
          }),
        ),
        rows: z.array(z.record(z.string(), z.string())),
        interpretation: z.string(),
        sanityCheck: z.string().optional(),
      })
      .optional(),
    costBenefit: z
      .object({
        wasteIdentified: z.string(),
        capexNote: z.string().optional(),
        sideGains: z.array(z.string()).optional(),
      })
      .optional(),
  })
  .passthrough();

export const L6CasePayloadSchema = z.object({
  source: z.enum(["l5", "l5+l2", "unavailable"]),
  generatedAt: z.string(),
  plantId: z.string(),
  detail: z.string().optional(),
  prescription: ProductPrescriptionSchema.optional(),
  alarm: ProductAlarmSchema.extend({
    ownerRole: z.string().optional(),
  }).optional(),
  enrichment: CaseEnrichmentSchema.nullable().optional(),
  caseDetail: CaseDetailSchema.optional(),
  evidence: z.object({
    bundleId: z.string().optional(),
    refs: z.array(z.string()),
    pack: EvidencePackSchema,
    sample: EvidenceSampleSchema.optional(),
    series: EvidenceSeriesSchema.optional(),
    downloadHref: z.string().optional(),
  }),
  asset: z
    .object({
      id: z.string(),
      label: z.string(),
      area: z.string().optional(),
      loadPct: z.number().optional(),
      kwhMtd: z.number().optional(),
      pf: z.number().optional(),
      mdContributionKva: z.number().optional(),
    })
    .optional(),
  links: z.object({
    prescriptionHref: z.string().optional(),
    alarmHref: z.string().optional(),
    evidenceHref: z.string(),
  }),
});

export type L6CasePayload = z.infer<typeof L6CasePayloadSchema>;
export type CaseEnrichment = z.infer<typeof CaseEnrichmentSchema>;
export type EvidencePackDto = z.infer<typeof EvidencePackSchema>;
export type EvidenceSampleDto = z.infer<typeof EvidenceSampleSchema>;
export type EvidenceSeriesDto = z.infer<typeof EvidenceSeriesSchema>;
