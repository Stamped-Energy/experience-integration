import { LedgerEntrySchema, VerificationStatusSchema } from "@stamped/l6-contracts";
import { z } from "zod";
import { UpstreamError, upstreamFetch } from "../http.js";

export type L2FeatureFlags = {
  ledgerEntries: boolean;
  baselines: boolean;
};

export type L2ClientOptions = {
  baseUrl: string;
  timeoutMs: number;
  orgId: string;
  serviceKey: string;
  features: L2FeatureFlags;
};

export const MeasurementGranularitySchema = z.enum([
  "raw",
  "15min",
  "hour",
  "day",
]);
export type MeasurementGranularity = z.infer<typeof MeasurementGranularitySchema>;

const MeasurementPointSchema = z.object({
  ts: z.string().min(1),
  value: z.number(),
  quality: z.number().int().optional(),
});

const MeasurementsResponseSchema = z.object({
  org_id: z.string().min(1),
  plant_id: z.string().min(1),
  asset_id: z.string().min(1),
  metric: z.string().min(1),
  granularity: MeasurementGranularitySchema,
  points: z.array(MeasurementPointSchema),
  partial: z.boolean().optional(),
});

const AssetSchema = z.object({
  asset_id: z.string().min(1),
  name: z.string().min(1),
  level: z.string().optional(),
  asset_class: z.string().optional(),
});

/** L2 query-api returns `assets`; older sketches used `items`. Accept either. */
const AssetsResponseSchema = z
  .object({
    items: z.array(AssetSchema).optional(),
    assets: z.array(AssetSchema).optional(),
  })
  .transform((raw) => ({
    items: raw.items ?? raw.assets ?? [],
  }));

const BaselineSchema = z.object({
  baseline_id: z.string().min(1),
  org_id: z.string().min(1),
  plant_id: z.string().min(1),
  asset_id: z.string().min(1),
  metric: z.string().min(1),
  method: z.string().optional(),
  granularity: MeasurementGranularitySchema.optional(),
  lower: z.array(MeasurementPointSchema).optional(),
  expected: z.array(MeasurementPointSchema).optional(),
  upper: z.array(MeasurementPointSchema).optional(),
  quality: z.string().optional(),
  version: z.string().optional(),
});

const LedgerListSchema = z.object({
  items: z.array(LedgerEntrySchema),
  next_cursor: z.string().nullable().optional(),
});

/** Caps from L2 query sketch — enforce client-side before calling upstream. */
export function assertGranularityWindow(
  granularity: MeasurementGranularity,
  fromIso: string,
  toIso: string,
): void {
  const from = Date.parse(fromIso);
  const to = Date.parse(toIso);
  if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) {
    throw new UpstreamError(
      "INVALID_WINDOW",
      "Measurement window requires valid from/to ISO timestamps",
      400,
    );
  }
  const days = (to - from) / 86_400_000;
  const maxDays =
    granularity === "raw" ? 7 : granularity === "15min" ? 45 : granularity === "hour" ? 180 : 730;
  if (days > maxDays) {
    throw new UpstreamError(
      "GRANULARITY_WINDOW_EXCEEDED",
      `${granularity} windows are capped at ${maxDays} days`,
      400,
      { granularity, days, maxDays },
    );
  }
}

export type PartialSlice<T> =
  | { ok: true; data: T }
  | { ok: false; error: UpstreamError };

export class L2QueryClient {
  constructor(private readonly opts: L2ClientOptions) {
    if (!opts.orgId.trim() || !opts.serviceKey.trim()) {
      throw new UpstreamError(
        "L2_AUTH_CONFIG",
        "L2 client requires orgId and serviceKey (never browser-exposed)",
        500,
      );
    }
  }

  private headers(): Record<string, string> {
    return {
      "x-org-id": this.opts.orgId,
      "x-service-key": this.opts.serviceKey,
    };
  }

  async listMeasurements(input: {
    plantId: string;
    assetId: string;
    metric: string;
    from: string;
    to: string;
    granularity?: MeasurementGranularity;
  }) {
    const granularity = input.granularity ?? "15min";
    assertGranularityWindow(granularity, input.from, input.to);
    const raw = await upstreamFetch<unknown>({
      baseUrl: this.opts.baseUrl,
      path: `v1/plants/${encodeURIComponent(input.plantId)}/measurements`,
      query: {
        asset_id: input.assetId,
        metric: input.metric,
        from: input.from,
        to: input.to,
        granularity,
      },
      timeoutMs: this.opts.timeoutMs,
      headers: this.headers(),
    });
    return MeasurementsResponseSchema.parse(raw);
  }

  async listAssets(plantId: string) {
    const raw = await upstreamFetch<unknown>({
      baseUrl: this.opts.baseUrl,
      path: `v1/plants/${encodeURIComponent(plantId)}/assets`,
      timeoutMs: this.opts.timeoutMs,
      headers: this.headers(),
    });
    return AssetsResponseSchema.parse(raw);
  }

  async listLedgerEntries(input: {
    plantId: string;
    prescriptionId?: string;
    verificationStatus?: z.infer<typeof VerificationStatusSchema>;
    entryType?: string;
    from?: string;
    to?: string;
    cursor?: string;
    limit?: number;
  }) {
    if (!this.opts.features.ledgerEntries) {
      throw new UpstreamError(
        "UPSTREAM_FEATURE_UNAVAILABLE",
        "L2 ledger entries are not published yet — feature-gated in L6",
        501,
        { x_stamped_status: "upstream_missing" },
      );
    }
    const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);
    const raw = await upstreamFetch<unknown>({
      baseUrl: this.opts.baseUrl,
      path: "v1/ledger/entries",
      query: {
        plant_id: input.plantId,
        prescription_id: input.prescriptionId,
        verification_status: input.verificationStatus,
        entry_type: input.entryType,
        from: input.from,
        to: input.to,
        cursor: input.cursor,
        limit: String(limit),
      },
      timeoutMs: this.opts.timeoutMs,
      headers: this.headers(),
    });
    return LedgerListSchema.parse(raw);
  }

  async getBaseline(baselineId: string) {
    if (!this.opts.features.baselines) {
      throw new UpstreamError(
        "UPSTREAM_FEATURE_UNAVAILABLE",
        "L2 baseline reads are not published yet — feature-gated in L6",
        501,
        { x_stamped_status: "upstream_missing" },
      );
    }
    const raw = await upstreamFetch<unknown>({
      baseUrl: this.opts.baseUrl,
      path: `v1/baselines/${encodeURIComponent(baselineId)}`,
      timeoutMs: this.opts.timeoutMs,
      headers: this.headers(),
    });
    return BaselineSchema.parse(raw);
  }

  async listBaselines(input: {
    plantId: string;
    assetId?: string;
    category?: string;
  }) {
    if (!this.opts.features.baselines) {
      throw new UpstreamError(
        "UPSTREAM_FEATURE_UNAVAILABLE",
        "L2 baselines are not published yet — feature-gated in L6",
        501,
        { x_stamped_status: "upstream_missing" },
      );
    }
    const raw = await upstreamFetch<unknown>({
      baseUrl: this.opts.baseUrl,
      path: `v1/plants/${encodeURIComponent(input.plantId)}/baselines`,
      query: {
        asset_id: input.assetId,
        category: input.category,
      },
      timeoutMs: this.opts.timeoutMs,
      headers: this.headers(),
    });
    return z
      .object({
        baselines: z.array(z.record(z.string(), z.unknown())).optional(),
        items: z.array(z.record(z.string(), z.unknown())).optional(),
        next_cursor: z.union([z.string(), z.number(), z.null()]).optional(),
      })
      .transform((r) => ({
        items: r.baselines ?? r.items ?? [],
        nextCursor:
          r.next_cursor === undefined || r.next_cursor === null
            ? null
            : String(r.next_cursor),
      }))
      .parse(raw);
  }

  async listBills(input: { plantId: string; billMonth?: string }) {
    const raw = await upstreamFetch<unknown>({
      baseUrl: this.opts.baseUrl,
      path: `v1/plants/${encodeURIComponent(input.plantId)}/bills`,
      query: { bill_month: input.billMonth },
      timeoutMs: this.opts.timeoutMs,
      headers: this.headers(),
    });
    return z
      .object({
        bills: z.array(z.record(z.string(), z.unknown())).default([]),
        next_cursor: z.union([z.string(), z.number(), z.null()]).optional(),
      })
      .parse(raw);
  }

  async getBillLines(input: { plantId: string; billId: string }) {
    const raw = await upstreamFetch<unknown>({
      baseUrl: this.opts.baseUrl,
      path: `v1/plants/${encodeURIComponent(input.plantId)}/bills/${encodeURIComponent(input.billId)}/lines`,
      timeoutMs: this.opts.timeoutMs,
      headers: this.headers(),
    });
    return z
      .object({
        bill_id: z.string().optional(),
        bill_month: z.string().optional(),
        lines: z.array(z.record(z.string(), z.unknown())).default([]),
      })
      .parse(raw);
  }

  async getActiveTariff(plantId: string) {
    const raw = await upstreamFetch<unknown>({
      baseUrl: this.opts.baseUrl,
      path: "v1/tariffs/active",
      query: { plant_id: plantId },
      timeoutMs: this.opts.timeoutMs,
      headers: this.headers(),
    });
    return z.record(z.string(), z.unknown()).parse(raw);
  }

  async getSecFeature(input: { plantId: string; window: string }) {
    const raw = await upstreamFetch<unknown>({
      baseUrl: this.opts.baseUrl,
      path: "v1/features/sec",
      query: { plant_id: input.plantId, window: input.window },
      timeoutMs: this.opts.timeoutMs,
      headers: this.headers(),
    });
    return z.record(z.string(), z.unknown()).parse(raw);
  }

  /** Plant Intelligence Score — stored as sec_feature window_key plant_intelligence_score. */
  async getPlantIntelligenceScore(plantId: string) {
    return this.getSecFeature({
      plantId,
      window: "plant_intelligence_score",
    });
  }

  async getDepartmentGraph(plantId: string) {
    const raw = await upstreamFetch<unknown>({
      baseUrl: this.opts.baseUrl,
      path: `v1/plants/${encodeURIComponent(plantId)}/department-graph`,
      timeoutMs: this.opts.timeoutMs,
      headers: this.headers(),
    });
    return z.record(z.string(), z.unknown()).parse(raw);
  }

  async listProductionOrders(input: {
    plantId: string;
    status?: string;
    from?: string;
    to?: string;
  }) {
    const raw = await upstreamFetch<unknown>({
      baseUrl: this.opts.baseUrl,
      path: `v1/plants/${encodeURIComponent(input.plantId)}/production-orders`,
      query: {
        status: input.status,
        from: input.from,
        to: input.to,
      },
      timeoutMs: this.opts.timeoutMs,
      headers: this.headers(),
    });
    return z
      .object({
        orders: z.array(z.record(z.string(), z.unknown())).default([]),
        next_cursor: z.union([z.string(), z.number(), z.null()]).optional(),
      })
      .parse(raw);
  }

  async getEvidenceWindow(input: {
    plantId: string;
    assetId: string;
    from: string;
    to: string;
    baselineId?: string;
    category?: string;
  }) {
    const raw = await upstreamFetch<unknown>({
      baseUrl: this.opts.baseUrl,
      path: `v1/plants/${encodeURIComponent(input.plantId)}/evidence/window`,
      query: {
        asset_id: input.assetId,
        from: input.from,
        to: input.to,
        baseline_id: input.baselineId,
        category: input.category,
      },
      timeoutMs: this.opts.timeoutMs,
      headers: this.headers(),
    });
    return z.record(z.string(), z.unknown()).parse(raw);
  }

  /**
   * Honest partial fetch — never invent missing ledger/baseline slices.
   * Measurements/assets failures surface as slice errors; gaps stay empty.
   */
  async loadEvidenceBundle(input: {
    plantId: string;
    assetId: string;
    metric: string;
    from: string;
    to: string;
    baselineId?: string;
  }): Promise<{
    measurements: PartialSlice<z.infer<typeof MeasurementsResponseSchema>>;
    assets: PartialSlice<z.infer<typeof AssetsResponseSchema>>;
    baseline: PartialSlice<z.infer<typeof BaselineSchema> | null>;
    missing: string[];
  }> {
    const [measurements, assets, baseline] = await Promise.all([
      this.safe(() =>
        this.listMeasurements({
          plantId: input.plantId,
          assetId: input.assetId,
          metric: input.metric,
          from: input.from,
          to: input.to,
          granularity: "15min",
        }),
      ),
      this.safe(() => this.listAssets(input.plantId)),
      input.baselineId
        ? this.safe(() => this.getBaseline(input.baselineId!))
        : Promise.resolve({ ok: true as const, data: null }),
    ]);

    const missing: string[] = [];
    if (!measurements.ok) missing.push("measurements");
    if (!assets.ok) missing.push("assets");
    if (input.baselineId && !baseline.ok) missing.push("baseline");
    if (input.baselineId && !this.opts.features.baselines) {
      if (!missing.includes("baseline")) missing.push("baseline");
    }

    return { measurements, assets, baseline, missing };
  }

  private async safe<T>(fn: () => Promise<T>): Promise<PartialSlice<T>> {
    try {
      return { ok: true, data: await fn() };
    } catch (err) {
      if (err instanceof UpstreamError) return { ok: false, error: err };
      return {
        ok: false,
        error: new UpstreamError(
          "UPSTREAM_UNKNOWN",
          err instanceof Error ? err.message : "Unknown upstream error",
          502,
        ),
      };
    }
  }
}

export function defaultL2FeaturesFromEnv(env: NodeJS.ProcessEnv): L2FeatureFlags {
  return {
    ledgerEntries: env.L2_FEATURE_LEDGER === "true",
    baselines: env.L2_FEATURE_BASELINES === "true",
  };
}

/** Hard refuse — L6 must never hold an L2 database URL. */
export function assertNoL2DatabaseUrl(env: NodeJS.ProcessEnv = process.env): void {
  if (env.L2_DATABASE_URL) {
    throw new Error(
      "L2_DATABASE_URL is forbidden in L6 — use L2_BASE_URL + service key only",
    );
  }
}
