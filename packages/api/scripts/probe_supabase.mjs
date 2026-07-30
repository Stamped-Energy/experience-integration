import { readFileSync } from "node:fs";
import pg from "pg";

const envPath =
  process.argv[2] ??
  "D:/Startups/Stamped_Energy/L1-L6/experience-integration/.env";

const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      let v = l.slice(i + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      return [l.slice(0, i).trim(), v];
    }),
);

async function tryUrl(name) {
  let url = env[name];
  if (!url) {
    console.log(name, "MISSING");
    return;
  }
  // Do not put sslmode=require in the URL — pg v8 treats it as verify-full.
  // Rely on Pool ssl: { rejectUnauthorized: false } for Supabase.
  const pool = new pg.Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20_000,
  });
  try {
    const r = await pool.query(
      "select current_database() as db, current_user as usr",
    );
    console.log(name, "OK", r.rows[0]);
  } catch (e) {
    console.log(name, "FAIL", e.code || "", e.message);
  } finally {
    await pool.end();
  }
}

await tryUrl("DIRECT_URL");
await tryUrl("DATABASE_URL");
