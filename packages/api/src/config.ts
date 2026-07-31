import { loadDotEnv } from "./db/load-dotenv.js";
import { z } from "zod";

// Load gitignored repo-root `.env` before parsing (local Supabase demo).
loadDotEnv();

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(3001),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  DATABASE_URL: z.string().min(1).optional(),
  /**
   * Direct Postgres URL for migrations (Supabase session / non-pgbouncer).
   * Prefer this over DATABASE_URL when applying drizzle/prisma migrations.
   */
  DIRECT_URL: z.string().min(1).optional(),
  /** Ready check requires DB when true. */
  REQUIRE_DATABASE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32)
    .default("dev-only-stamped-l6-auth-secret-change-me"),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3001"),
  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_FROM: z.string().email().default("noreply@stamped.local"),
  /** Password reset / invite token lifetime (seconds). */
  AUTH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
  /** L5 Closure & Verification base URL (server-side only). */
  L5_BASE_URL: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().url().default("http://127.0.0.1:8080"),
  ),
  L5_TIMEOUT_MS: z.coerce.number().int().positive().default(5_000),
  L5_AUTH_TOKEN: z.string().optional(),
  /**
   * Live-wire gate for the L5 client at boot (C-L6a). Both must be true
   * (the default) to construct a real client; either explicitly "false"
   * forces fixture-only mode. Fixture fallback still applies per-request
   * when L5 is live but unreachable.
   */
  L5_LIVE: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  L6_L5_LIVE: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  /** Upstream gaps — default off until OpenAPI publishes the routes. */
  L5_FEATURE_ALARM_ACK: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  L5_FEATURE_ALARM_ESCALATE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  L5_FEATURE_ALARM_UNSILENCE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  /** L2 query API — never L2_DATABASE_URL. */
  L2_BASE_URL: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().url().default("http://127.0.0.1:8091"),
  ),
  L2_TIMEOUT_MS: z.coerce.number().int().positive().default(5_000),
  L2_SERVICE_KEY: z.string().optional(),
  L2_FEATURE_LEDGER: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  L2_FEATURE_BASELINES: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  /** L4 Knowledge & Reasoning — fixture mode until live OpenAPI. */
  L4_BASE_URL: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().url().default("http://127.0.0.1:8000"),
  ),
  L4_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  L4_AUTH_TOKEN: z.string().optional(),
  L4_LIVE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  /** ADR-024 Discuss panel + negotiation proxies (rollback: DISCUSS_ENABLED=0). */
  DISCUSS_ENABLED: z
    .enum(["0", "1", "true", "false"])
    .default("1")
    .transform((v) => v !== "0" && v !== "false"),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(
  raw: NodeJS.ProcessEnv = process.env,
): Env {
  loadDotEnv();
  if (raw.L2_DATABASE_URL) {
    throw new Error(
      "L2_DATABASE_URL is forbidden in L6 — use L2_BASE_URL + L2_SERVICE_KEY only",
    );
  }
  const parsed = EnvSchema.safeParse(raw);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid environment: ${detail}`);
  }
  return parsed.data;
}
