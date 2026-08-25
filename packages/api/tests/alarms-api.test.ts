import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { hashPassword } from "better-auth/crypto";
import { buildApp } from "../src/app.js";
import { createAuth } from "../src/auth/index.js";
import { cookieHeader } from "../src/auth/routes.js";
import { loadEnv } from "../src/config.js";
import { account, user } from "../src/db/auth-schema.js";
import { createDb, createPool } from "../src/db/client.js";
import { runMigrations } from "../src/db/migrate.js";
import { createMailer } from "../src/mail/mailer.js";
import { seedDemoTenant } from "../src/tenancy/service.js";
import { resetDatabase } from "./helpers/db.js";

const databaseUrl = process.env.DATABASE_URL;

describe("alarms product API", () => {
  it("lists severity-sorted alarms and acks via fixture Auto path", async (t) => {
    if (!databaseUrl) {
      t.skip("DATABASE_URL not set");
      return;
    }

    await resetDatabase(databaseUrl);
    await runMigrations(databaseUrl);
    const pool = createPool(databaseUrl);
    const db = createDb(pool);
    const env = loadEnv({
      NODE_ENV: "test",
      LOG_LEVEL: "silent",
      DATABASE_URL: databaseUrl,
      BETTER_AUTH_SECRET: "test-secret-stamped-l6-auth-32chars!",
      BETTER_AUTH_URL: "http://localhost:3001",
      WEB_ORIGIN: "http://localhost:3000",
      L6_STRICT_LIVE: "false",
      USE_FIXTURES: "true",
    });
    const mailer = createMailer({ from: env.SMTP_FROM });
    const auth = createAuth(db, env, mailer);
    const app = await buildApp({ env, auth, mailer, db });

    const email = `op_${randomUUID().slice(0, 8)}@stamped.test`;
    const password = "operator-password-12+";
    const userId = randomUUID();
    await db.insert(user).values({
      id: userId,
      name: "Op",
      email,
      emailVerified: true,
      role: "user",
    });
    await db.insert(account).values({
      id: randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: await hashPassword(password),
    });
    await seedDemoTenant(db, { adminUserId: userId });

    const signIn = await app.inject({
      method: "POST",
      url: "/api/auth/sign-in/email",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      payload: { email, password },
    });
    assert.equal(signIn.statusCode, 200, signIn.body);
    const cookie = cookieHeader(signIn.headers["set-cookie"]);

    const list = await app.inject({
      method: "GET",
      url: "/api/alarms",
      headers: { cookie },
    });
    assert.equal(list.statusCode, 200, list.body);
    const body = list.json() as {
      items: Array<{ id: string; severity: string; state: string }>;
    };
    assert.ok(body.items.length >= 1);
    assert.equal(body.items[0]?.severity, "critical");

    const ack = await app.inject({
      method: "POST",
      url: "/api/alarms/alm_1001/actions",
      headers: {
        cookie,
        "content-type": "application/json",
        "idempotency-key": "idem-ack-1",
        origin: "http://localhost:3000",
      },
      payload: {
        action: "ack",
        orgId: "org_demo",
        plantId: "plant_jaipur_01",
      },
    });
    assert.equal(ack.statusCode, 200, ack.body);
    assert.equal(
      (ack.json() as { alarm: { state: string } }).alarm.state,
      "acked",
    );

    await app.close();
    await pool.end();
  });
});
