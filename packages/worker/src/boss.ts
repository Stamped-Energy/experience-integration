import { PgBoss } from "pg-boss";
import type { WorkerEnv } from "./config.js";

/** Queue names — handlers stay idempotent because retries re-deliver. */
export const QUEUES = {
  fixturePing: "l6.fixture.ping",
  reportsGenerate: "l6.reports.generate",
  webhooksDeliver: "l6.webhooks.deliver",
} as const;

export type FixturePingJob = {
  pingId: string;
  note?: string;
};

export type ReportGenerateJob = {
  reportJobId: string;
};

export async function createBoss(env: WorkerEnv): Promise<PgBoss> {
  const boss = new PgBoss({
    connectionString: env.DATABASE_URL,
    // ponytail: single schema for local/CI; split schemas if multi-tenant isolation needs it
    schema: "pgboss",
  });
  return boss;
}

export async function startWorker(env: WorkerEnv): Promise<PgBoss> {
  const boss = await createBoss(env);
  await boss.start();
  await boss.createQueue(QUEUES.fixturePing, { notify: true });
  await boss.createQueue(QUEUES.reportsGenerate, { notify: true });
  await boss.createQueue(QUEUES.webhooksDeliver, { notify: true });

  const seenPings = new Set<string>();
  const seenReports = new Set<string>();
  const pollMs = env.NODE_ENV === "test" ? 0.5 : 2;

  await boss.work<FixturePingJob>(
    QUEUES.fixturePing,
    { batchSize: 1, pollingIntervalSeconds: pollMs },
    async (jobs) => {
      for (const job of jobs) {
        const pingId = job.data.pingId;
        if (!pingId) throw new Error("fixture ping missing pingId");
        if (seenPings.has(pingId)) continue;
        seenPings.add(pingId);
      }
    },
  );

  await boss.work<ReportGenerateJob>(
    QUEUES.reportsGenerate,
    { batchSize: 1, pollingIntervalSeconds: pollMs },
    async (jobs) => {
      for (const job of jobs) {
        const id = job.data.reportJobId;
        if (!id) throw new Error("report generate missing reportJobId");
        // Idempotent accept — API owns artifact mutation; worker proves delivery.
        if (seenReports.has(id)) continue;
        seenReports.add(id);
      }
    },
  );

  return boss;
}

export async function stopWorker(boss: PgBoss): Promise<void> {
  await boss.stop({ graceful: true, timeout: 5_000 });
}
