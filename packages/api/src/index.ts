import { createAuth } from "./auth/index.js";
import { startServer } from "./app.js";
import { loadEnv } from "./config.js";
import { createDb, createPool, pingDatabase } from "./db/client.js";
import { ingestL5Events } from "./events/ingest.js";
import { createMailer } from "./mail/mailer.js";
import {
  L5WorkflowClient,
  defaultL5FeaturesFromEnv,
} from "./upstream/l5/client.js";

const env = loadEnv();

if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to start the product BFF with auth");
}

const pool = createPool(env.DATABASE_URL);
const db = createDb(pool);
const mailer = createMailer({
  smtpHost: env.SMTP_HOST,
  smtpPort: env.SMTP_PORT,
  from: env.SMTP_FROM,
});
const auth = createAuth(db, env, mailer);

// C-L6a: construct the live L5 client by default; either gate flag set to
// "false" forces fixture-only mode. Per-request fixture fallback still
// applies (see alarms/prescriptions services) when L5 is live but down.
const l5Live = env.L5_LIVE && env.L6_L5_LIVE;
const l5 = l5Live
  ? new L5WorkflowClient({
      baseUrl: env.L5_BASE_URL,
      timeoutMs: env.L5_TIMEOUT_MS,
      authToken: env.L5_AUTH_TOKEN,
      features: defaultL5FeaturesFromEnv(process.env),
    })
  : null;

const app = await startServer({
  env,
  auth,
  mailer,
  db,
  pool,
  l5,
  checkReady: () => pingDatabase(pool),
});

const VINAYAK_LIVE_POLL = { orgId: "org_acme", plantId: "plant_vinayak_1" };
let l5PollInterval: ReturnType<typeof setInterval> | null = null;
if (l5) {
  l5PollInterval = setInterval(() => {
    void ingestL5Events(pool, l5, VINAYAK_LIVE_POLL).catch((err) => {
      app.log.warn({ err }, "l5 event poll failed");
    });
  }, 30_000);
  l5PollInterval.unref();
  app.log.info({ ...VINAYAK_LIVE_POLL }, "l5 live — event poll started (30s)");
} else {
  app.log.info("l5 live gate off — fixture-only mode");
}

async function shutdown(signal: string) {
  app.log.info({ signal }, "shutting down");
  if (l5PollInterval) clearInterval(l5PollInterval);
  await app.close();
  await pool.end();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
