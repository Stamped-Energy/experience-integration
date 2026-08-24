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
import { L4AnalystClient } from "./upstream/l4/client.js";
import { defaultL2FeaturesFromEnv } from "./upstream/l2/client.js";
import { createL2ClientFromOptions } from "./l2/routes.js";

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
const l5Live = !env.USE_FIXTURES && env.L5_LIVE && env.L6_L5_LIVE;
const l5 = l5Live
  ? new L5WorkflowClient({
      baseUrl: env.L5_BASE_URL,
      timeoutMs: env.L5_TIMEOUT_MS,
      authToken: env.L5_AUTH_TOKEN,
      features: defaultL5FeaturesFromEnv(process.env),
    })
  : null;

const l4Live = !env.USE_FIXTURES && env.L4_LIVE;
const l4 = new L4AnalystClient({
  baseUrl: env.L4_BASE_URL,
  timeoutMs: Math.max(env.L4_TIMEOUT_MS, l4Live ? 120_000 : env.L4_TIMEOUT_MS),
  authToken: env.L4_AUTH_TOKEN,
  live: l4Live,
});

const l2Live = !env.USE_FIXTURES && env.L2_LIVE;
const l2Opts = {
  baseUrl: env.L2_BASE_URL,
  timeoutMs: env.L2_TIMEOUT_MS,
  serviceKey: env.L2_SERVICE_KEY,
  live: l2Live,
  features: defaultL2FeaturesFromEnv(process.env),
};
const createL2Client = (orgId: string) => createL2ClientFromOptions(l2Opts, orgId);

const app = await startServer({
  env,
  auth,
  mailer,
  db,
  pool,
  l5,
  l4,
  createL2Client,
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

app.log.info({ l4Live, baseUrl: env.L4_BASE_URL }, "l4 analyst client ready");
app.log.info(
  {
    l2Live,
    baseUrl: env.L2_BASE_URL,
    hasServiceKey: Boolean(env.L2_SERVICE_KEY?.trim()),
  },
  l2Live && env.L2_SERVICE_KEY?.trim()
    ? "l2 live — BFF /api/l2 routes enabled"
    : "l2 live gate off — fixture-only L2 path",
);

async function shutdown(signal: string) {
  app.log.info({ signal }, "shutting down");
  if (l5PollInterval) clearInterval(l5PollInterval);
  await app.close();
  await pool.end();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
