/** Shared upstream HTTP helper — keep-alive agent, timeout, JSON, GET-only retries. */

import http from "node:http";
import https from "node:https";
import { URL } from "node:url";

export class UpstreamError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "UpstreamError";
  }
}

export type UpstreamRequest = {
  baseUrl: string;
  path: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, string | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs: number;
  /** Required for mutating alarm lifecycle calls. */
  idempotencyKey?: string;
  /** Override retry count for idempotent GETs (default 2). Mutations never retry. */
  maxRetries?: number;
};

/** Shared keep-alive agents for upstream L2/L4/L5 (Phase J / B8). */
export const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 16,
  maxFreeSockets: 8,
  timeout: 60_000,
});

export const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 16,
  maxFreeSockets: 8,
  timeout: 60_000,
});

const RETRYABLE_STATUS = new Set([502, 503, 504]);

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

type RawResponse = { status: number; body: string };

function nodeRequest(
  url: URL,
  opts: {
    method: string;
    headers: Record<string, string>;
    body?: string;
    timeoutMs: number;
  },
): Promise<RawResponse> {
  const isHttps = url.protocol === "https:";
  const lib = isHttps ? https : http;
  const agent = isHttps ? httpsAgent : httpAgent;

  return new Promise((resolve, reject) => {
    const req = lib.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method: opts.method,
        headers: opts.headers,
        agent,
        timeout: opts.timeoutMs,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
        res.on("end", () => {
          resolve({
            status: res.statusCode ?? 0,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );
    req.on("timeout", () => {
      req.destroy();
      const err = new Error("AbortError");
      err.name = "AbortError";
      reject(err);
    });
    req.on("error", reject);
    if (opts.body !== undefined) req.write(opts.body);
    req.end();
  });
}

export async function upstreamFetch<T>(req: UpstreamRequest): Promise<T> {
  const method = req.method ?? "GET";
  const idempotentGet = method === "GET";
  const maxRetries = idempotentGet ? (req.maxRetries ?? 2) : 0;

  const url = new URL(req.path, req.baseUrl.endsWith("/") ? req.baseUrl : `${req.baseUrl}/`);
  if (req.query) {
    for (const [k, v] of Object.entries(req.query)) {
      if (v !== undefined) url.searchParams.set(k, v);
    }
  }

  const headers: Record<string, string> = {
    accept: "application/json",
    ...req.headers,
  };
  const bodyStr = req.body !== undefined ? JSON.stringify(req.body) : undefined;
  if (bodyStr !== undefined) {
    headers["content-type"] = "application/json";
    headers["content-length"] = String(Buffer.byteLength(bodyStr));
  }
  if (req.idempotencyKey) headers["idempotency-key"] = req.idempotencyKey;

  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await nodeRequest(url, {
        method,
        headers,
        body: bodyStr,
        timeoutMs: req.timeoutMs,
      });
      const payload = res.body ? safeJson(res.body) : null;
      if (res.status < 200 || res.status >= 300) {
        if (idempotentGet && RETRYABLE_STATUS.has(res.status) && attempt < maxRetries) {
          await sleep(50 * 2 ** attempt);
          continue;
        }
        throw new UpstreamError(
          problemCode(payload) ?? `UPSTREAM_${res.status}`,
          problemDetail(payload) ?? `Upstream ${res.status} for ${req.path}`,
          res.status,
          payload,
        );
      }
      return payload as T;
    } catch (err) {
      lastErr = err;
      if (err instanceof UpstreamError) throw err;
      if (err instanceof Error && err.name === "AbortError") {
        if (idempotentGet && attempt < maxRetries) {
          await sleep(50 * 2 ** attempt);
          continue;
        }
        throw new UpstreamError("UPSTREAM_TIMEOUT", `Timed out calling ${req.path}`, 504);
      }
      if (idempotentGet && attempt < maxRetries) {
        await sleep(50 * 2 ** attempt);
        continue;
      }
      throw new UpstreamError(
        "UPSTREAM_NETWORK",
        err instanceof Error ? err.message : "Upstream network failure",
        502,
      );
    }
  }
  throw lastErr instanceof UpstreamError
    ? lastErr
    : new UpstreamError("UPSTREAM_NETWORK", "Upstream retries exhausted", 502);
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function problemCode(payload: unknown): string | undefined {
  if (payload && typeof payload === "object" && "code" in payload) {
    const code = (payload as { code?: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}

function problemDetail(payload: unknown): string | undefined {
  if (payload && typeof payload === "object") {
    const p = payload as { detail?: unknown; title?: unknown; message?: unknown };
    if (typeof p.detail === "string") return p.detail;
    if (typeof p.title === "string") return p.title;
    if (typeof p.message === "string") return p.message;
  }
  return undefined;
}
