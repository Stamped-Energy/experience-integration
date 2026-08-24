import pino from "pino";
import { loadWorkerEnv } from "./config.js";
import { startWorker, stopWorker } from "./boss.js";

const log = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: "l6-worker" },
  redact: ["password", "token", "authorization"],
});

const env = loadWorkerEnv();
const boss = await startWorker(env);
log.info({ queues: ["l6.fixture.ping", "l6.reports.generate"] }, "l6-worker started");

async function shutdown(signal: string) {
  log.info({ signal }, "l6-worker shutting down");
  await stopWorker(boss);
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
