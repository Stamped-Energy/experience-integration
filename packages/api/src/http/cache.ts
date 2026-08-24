/** ETag / Cache-Control helpers for immutable historical responses (Phase J / B7). */

import { createHash } from "node:crypto";

/** Closed historical window: `to` is at least this far in the past. */
const CLOSED_SKEW_MS = 60_000;

export function isClosedHistoricalWindow(toIso: string, now = Date.now()): boolean {
  const t = Date.parse(toIso);
  if (Number.isNaN(t)) return false;
  return t <= now - CLOSED_SKEW_MS;
}

export function weakEtag(body: unknown): string {
  const json = typeof body === "string" ? body : JSON.stringify(body);
  const hash = createHash("sha256").update(json).digest("hex").slice(0, 16);
  return `W/"${hash}"`;
}

export type CacheHeaders = {
  etag: string;
  cacheControl: string;
};

/** Safe to cache: closed measurement windows only — never live open-ended state. */
export function cacheHeadersForHistorical(body: unknown): CacheHeaders {
  return {
    etag: weakEtag(body),
    cacheControl: "public, max-age=60, stale-while-revalidate=300",
  };
}

export function ifNoneMatchMatches(
  ifNoneMatch: string | string[] | undefined,
  etag: string,
): boolean {
  if (!ifNoneMatch) return false;
  const raw = Array.isArray(ifNoneMatch) ? ifNoneMatch.join(",") : ifNoneMatch;
  return raw
    .split(",")
    .map((s) => s.trim())
    .some((t) => t === etag || t === "*");
}
