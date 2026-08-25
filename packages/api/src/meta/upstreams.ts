/**
 * Upstream reachability probe — cached ~15s so the nav banner can poll
 * without hammering L2/L5/L4.
 */
import type { L2QueryClient } from "../upstream/l2/client.js";
import type { L4AnalystClient } from "../upstream/l4/client.js";
import type { L5WorkflowClient } from "../upstream/l5/client.js";

export type UpstreamStatus = "live" | "down" | "off";

export type UpstreamProbeResult = {
  l2: UpstreamStatus;
  l5: UpstreamStatus;
  l4: UpstreamStatus;
  plantId: string;
  orgId: string;
  checkedAt: string;
  /** True when any configured live layer is down. */
  demoMode: boolean;
  detail: {
    l2?: string;
    l5?: string;
    l4?: string;
  };
};

type ProbeCache = {
  key: string;
  expiresAt: number;
  result: UpstreamProbeResult;
};

const CACHE_TTL_MS = 15_000;
let cache: ProbeCache | null = null;

export type UpstreamProbeDeps = {
  l5?: L5WorkflowClient | null;
  l4?: L4AnalystClient | null;
  createL2Client?: (orgId: string) => L2QueryClient | null;
  l2Live: boolean;
  l5Live: boolean;
  l4Live: boolean;
};

async function checkL2(
  createL2Client: ((orgId: string) => L2QueryClient | null) | undefined,
  orgId: string,
  plantId: string,
  l2Live: boolean,
): Promise<{ status: UpstreamStatus; detail?: string }> {
  if (!l2Live) return { status: "off", detail: "L2_LIVE=false or USE_FIXTURES" };
  const client = createL2Client?.(orgId) ?? null;
  if (!client) return { status: "off", detail: "L2 client not configured (missing service key)" };
  try {
    await client.listAssets(plantId);
    return { status: "live" };
  } catch (err) {
    return {
      status: "down",
      detail: err instanceof Error ? err.message : "L2 unreachable",
    };
  }
}

async function checkL5(
  l5: L5WorkflowClient | null | undefined,
  orgId: string,
  plantId: string,
  l5Live: boolean,
): Promise<{ status: UpstreamStatus; detail?: string }> {
  if (!l5Live || !l5) return { status: "off", detail: "L5 live gate off" };
  try {
    await l5.listAlarms({ orgId, plantId });
    return { status: "live" };
  } catch (err) {
    return {
      status: "down",
      detail: err instanceof Error ? err.message : "L5 unreachable",
    };
  }
}

async function checkL4(
  l4: L4AnalystClient | null | undefined,
  l4Live: boolean,
): Promise<{ status: UpstreamStatus; detail?: string }> {
  if (!l4Live || !l4) return { status: "off", detail: "L4_LIVE=false" };
  // L4 has no cheap health endpoint; report live when the client is wired
  // in live mode. Chat failures still surface on /analyst.
  return { status: "live" };
}

export async function probeUpstreams(
  deps: UpstreamProbeDeps,
  input: { orgId: string; plantId: string },
): Promise<UpstreamProbeResult> {
  const key = `${input.orgId}:${input.plantId}`;
  const now = Date.now();
  if (cache && cache.key === key && cache.expiresAt > now) {
    return cache.result;
  }

  const [l2, l5, l4] = await Promise.all([
    checkL2(deps.createL2Client, input.orgId, input.plantId, deps.l2Live),
    checkL5(deps.l5, input.orgId, input.plantId, deps.l5Live),
    checkL4(deps.l4, deps.l4Live),
  ]);

  const result: UpstreamProbeResult = {
    l2: l2.status,
    l5: l5.status,
    l4: l4.status,
    plantId: input.plantId,
    orgId: input.orgId,
    checkedAt: new Date().toISOString(),
    demoMode:
      (deps.l2Live && l2.status !== "live") ||
      (deps.l5Live && l5.status !== "live"),
    detail: {
      ...(l2.detail ? { l2: l2.detail } : {}),
      ...(l5.detail ? { l5: l5.detail } : {}),
      ...(l4.detail ? { l4: l4.detail } : {}),
    },
  };

  cache = { key, expiresAt: now + CACHE_TTL_MS, result };
  return result;
}

/** Test helper — clear the TTL cache. */
export function clearUpstreamProbeCache(): void {
  cache = null;
}
