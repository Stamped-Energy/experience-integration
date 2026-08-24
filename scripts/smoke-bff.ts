import { buildApp } from "../packages/api/src/app.js";
import { loadEnv } from "../packages/api/src/config.js";
import { createDb, createPool, pingDatabase } from "../packages/api/src/db/client.js";
import { runMigrations } from "../packages/api/src/db/migrate.js";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL required");
  await runMigrations(databaseUrl);
  const pool = createPool(databaseUrl);
  const db = createDb(pool);
  const app = await buildApp({
    env: loadEnv({
      NODE_ENV: "test",
      REQUIRE_DATABASE: "true",
      DATABASE_URL: databaseUrl,
      LOG_LEVEL: "silent",
      BETTER_AUTH_SECRET: "test-secret-stamped-l6-auth-32chars!",
      BETTER_AUTH_URL: "http://localhost:3001",
      WEB_ORIGIN: "http://localhost:3000",
    }),
    checkReady: () => pingDatabase(pool),
    db,
  });
  try {
    const health = await app.inject({ method: "GET", url: "/health" });
    const ready = await app.inject({ method: "GET", url: "/ready" });
    const meta = await app.inject({ method: "GET", url: "/api/meta" });
    const openapi = await app.inject({ method: "GET", url: "/v1/openapi.json" });
    const unauth = await app.inject({ method: "GET", url: "/v1/alarms?plant_id=x" });
    if (health.statusCode !== 200 || ready.statusCode !== 200) {
      throw new Error(
        `smoke failed health=${health.statusCode} ready=${ready.statusCode}`,
      );
    }
    if (openapi.statusCode !== 200) {
      throw new Error(`openapi failed ${openapi.statusCode}`);
    }
    if (unauth.statusCode !== 401) {
      throw new Error(`expected 401 for unauthenticated /v1, got ${unauth.statusCode}`);
    }
    const metaBody = meta.json() as { public_api?: boolean };
    console.log(
      JSON.stringify({
        health: health.statusCode,
        ready: ready.statusCode,
        public_api: metaBody.public_api === true,
        openapi: openapi.statusCode,
        v1_unauth: unauth.statusCode,
      }),
    );
  } finally {
    await app.close();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
