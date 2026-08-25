import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { hashPassword } from "better-auth/crypto";
import { buildApp } from "../src/app.js";
import { createAuth } from "../src/auth/index.js";
import { cookieHeader } from "../src/auth/routes.js";
import { loadEnv } from "../src/config.js";
import { account, user } from "../src/db/auth-schema.js";
import { loadDotEnv } from "../src/db/load-dotenv.js";
import { createDb, createPool } from "../src/db/client.js";
import { runMigrations } from "../src/db/migrate.js";
import { createMailer } from "../src/mail/mailer.js";
import {
  listPrescriptionsForPlant,
  mapL5PrescriptionToProduct,
  createFixturePrescriptionStore,
} from "../src/prescriptions/service.js";
import { seedDemoTenant } from "../src/tenancy/service.js";
import { resetDatabase } from "./helpers/db.js";

loadDotEnv();
const databaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

describe("mapL5PrescriptionToProduct", () => {
  it("maps a loosely-typed L5 prescription record to the product shape", () => {
    const mapped = mapL5PrescriptionToProduct({
      prescription_id: "rx-1",
      plant_id: "plant_vinayak_1",
      title: "Stagger kiln co-start",
      why: "MD coincidence risk",
      impact_inr_per_month: 79000,
      confidence: 0.83,
      status: "open",
      owner_role: "supervisor",
      due_at: "2026-07-22T18:00:00+05:30",
    });
    assert.equal(mapped.id, "rx-1");
    assert.equal(mapped.plantId, "plant_vinayak_1");
    assert.equal(mapped.lane, "needs_review");
    assert.equal(mapped.ownerRole, "supervisor");
    assert.equal(mapped.impactInrPerMonth, 79000);
  });

  it("maps L5 wire fields what/who/when, pillars, and evidence refs", () => {
    const mapped = mapL5PrescriptionToProduct({
      id: "rx-2",
      plant_id: "plant_vinayak_1",
      what: "Hold second feeder",
      why: "MD spike",
      who: "electrical_supervisor",
      effort: "low_schedule_change",
      when: "next_monday_shift_start",
      waste_category: 1,
      value_domain: "energy_efficiency",
      evidence_refs: ["tag:incomer_1/apparent_power_kva?window=1h"],
      impact: { inr_monthly: 31200 },
      status: "open",
      owner_role: "supervisor",
    });
    assert.equal(mapped.title, "Hold second feeder");
    assert.equal(mapped.whoLabel, "electrical_supervisor");
    assert.equal(mapped.dueLabel, "next_monday_shift_start");
    assert.equal(mapped.impactInrPerMonth, 31200);
    assert.equal(mapped.wasteCategory, 1);
    assert.equal(mapped.valueDomain, "energy_efficiency");
    assert.deepEqual(mapped.evidenceRefs, [
      "tag:incomer_1/apparent_power_kva?window=1h",
    ]);
  });

  it("throws when id/plant_id missing so callers can fall back to fixture", () => {
    assert.throws(() => mapL5PrescriptionToProduct({ plant_id: "p1" }));
    assert.throws(() => mapL5PrescriptionToProduct({ id: "rx-1" }));
  });
});

describe("listPrescriptionsForPlant", () => {
  it("uses fixture when l5 is not provided", async () => {
    const fixture = createFixturePrescriptionStore([
      {
        id: "rx_1",
        plantId: "plant_vinayak_1",
        title: "Test",
        why: "Test why",
        impactInrPerMonth: 1000,
        confidence: 0.5,
        lane: "needs_review",
        ownerRole: "operator",
        dueAt: "2026-07-22T18:00:00+05:30",
      },
    ]);
    const result = await listPrescriptionsForPlant({
      fixture,
      orgId: "org_acme",
      plantId: "plant_vinayak_1",
    });
    assert.equal(result.source, "fixture");
    assert.equal(result.items.length, 1);
  });
});

describe("prescriptions product API", () => {
  it("lists prescriptions for the resolved active plant via fixture Auto path", async (t) => {
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
      url: "/api/prescriptions",
      headers: { cookie },
    });
    assert.equal(list.statusCode, 200, list.body);
    const body = list.json() as {
      items: Array<{ id: string; plantId: string; lane: string }>;
      source: string;
    };
    assert.equal(body.source, "fixture");
    assert.ok(body.items.length >= 1);
    assert.ok(body.items.every((p) => p.plantId === body.items[0]?.plantId));

    await app.close();
    await pool.end();
  });
});
