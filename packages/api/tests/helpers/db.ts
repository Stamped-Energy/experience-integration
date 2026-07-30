import { createPool, isSupabaseUrl } from "../../src/db/client.js";

/**
 * L6 product tables only — never DROP SCHEMA public on a shared Supabase
 * project (content-os and other apps live there too).
 */
const L6_TABLES = [
  "plant_memberships",
  "memberships",
  "user_preferences",
  "audit_events",
  "l5_event_cursors",
  "l5_events",
  "report_jobs",
  "webhook_deliveries",
  "webhooks",
  "api_keys",
  "plants",
  "organizations",
  "two_factor",
  "session",
  "account",
  "verification",
  "user",
] as const;

/** Full reset for integration tests — local Docker only drops schemas. */
export async function resetDatabase(databaseUrl: string): Promise<void> {
  const pool = createPool(databaseUrl);
  try {
    if (isSupabaseUrl(databaseUrl)) {
      // Avoid parameterized DO blocks — Supabase/pgbouncer rejects bind on DO $$.
      // Table names are a fixed allowlist (not user input).
      for (const table of L6_TABLES) {
        // Missing tables are fine (partial migrate); ignore errors.
        await pool
          .query(`TRUNCATE TABLE ${quoteIdent(table)} CASCADE`)
          .catch(() => undefined);
      }
      return;
    }

    await pool.query(`
      DROP SCHEMA IF EXISTS drizzle CASCADE;
      DROP SCHEMA IF EXISTS public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO CURRENT_USER;
      GRANT ALL ON SCHEMA public TO public;
    `);
  } finally {
    await pool.end();
  }
}

function quoteIdent(name: string): string {
  if (!/^[a-z_][a-z0-9_]*$/i.test(name)) {
    throw new Error(`refusing to truncate non-ident table: ${name}`);
  }
  return `"${name}"`;
}
