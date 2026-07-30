import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { schema } from "./schema.js";

export type Db = ReturnType<typeof createDb>;

/** Supabase pooler / direct hosts need TLS; local Docker usually does not. */
export function isSupabaseUrl(databaseUrl: string): boolean {
  return /supabase\.(co|com)|pooler\.supabase\.com/i.test(databaseUrl);
}

export function createPool(databaseUrl: string): pg.Pool {
  const supabase = isSupabaseUrl(databaseUrl);
  return new pg.Pool({
    connectionString: databaseUrl,
    max: supabase ? 5 : 10,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: supabase ? 15_000 : 5_000,
    ssl: supabase ? { rejectUnauthorized: false } : undefined,
  });
}

export function createDb(pool: pg.Pool) {
  return drizzle(pool, { schema });
}

export async function pingDatabase(pool: pg.Pool): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query("select 1");
    return true;
  } finally {
    client.release();
  }
}
