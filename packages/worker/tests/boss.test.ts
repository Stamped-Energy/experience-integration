import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import { describe, it } from "node:test";
import { QUEUES, createBoss, startWorker, stopWorker } from "../src/boss.js";
import { loadWorkerEnv } from "../src/config.js";

const databaseUrl = process.env.DATABASE_URL;

describe("pg-boss worker", () => {
  it("runs an idempotent fixture job", async (t) => {
    if (!databaseUrl) {
      t.skip("DATABASE_URL not set");
      return;
    }

    const env = loadWorkerEnv({
      NODE_ENV: "test",
      DATABASE_URL: databaseUrl,
      LOG_LEVEL: "silent",
    });

    const boss = await startWorker(env);
    const pingId = randomUUID();

    const jobId = await boss.send(QUEUES.fixturePing, { pingId, note: "first" });
    assert.ok(jobId);

    // Re-send same logical ping — handler must remain idempotent.
    await boss.send(QUEUES.fixturePing, { pingId, note: "retry" });

    // Wait for workers to process (pg-boss polls; allow slow CI).
    let attempts = 0;
    let completed = await boss.getJobById(QUEUES.fixturePing, jobId);
    while (attempts < 80 && completed?.state !== "completed") {
      await sleep(100);
      completed = await boss.getJobById(QUEUES.fixturePing, jobId);
      attempts += 1;
    }

    assert.equal(
      completed?.state,
      "completed",
      `fixture ping still ${completed?.state ?? "missing"} after ${attempts} polls`,
    );

    await stopWorker(boss);

    // Fresh boss can start again (schema already present).
    const again = await createBoss(env);
    await again.start();
    await again.stop({ graceful: true, timeout: 5_000 });
  });
});
