import assert from "node:assert/strict";
import http from "node:http";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";
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
  L2QueryClient,
  defaultL2FeaturesFromEnv,
} from "../src/upstream/l2/client.js";
import {
  addMembership,
  createOrganization,
  createPlant,
  seedLnmFactoryPlant,
} from "../src/tenancy/service.js";
import { resetDatabase } from "./helpers/db.js";

loadDotEnv();
const databaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

function createMockL2(portHolder: { port: number }) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    const send = (status: number, body: unknown) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    };

    if (
      req.headers["x-org-id"] !== "org_acme" ||
      req.headers["x-service-key"] !== "svc-lnm-test"
    ) {
      return send(403, { code: "FORBIDDEN", detail: "bad tenancy headers" });
    }

    const assets = url.pathname.match(/^\/v1\/plants\/([^/]+)\/assets$/);
    if (req.method === "GET" && assets) {
      return send(200, {
        items: [
          {
            asset_id: "cnc_vtl_01",
            name: "VTL-01",
            level: "equipment",
            asset_class: "cnc_machine",
          },
        ],
      });
    }

    const meas = url.pathname.match(/^\/v1\/plants\/([^/]+)\/measurements$/);
    if (req.method === "GET" && meas) {
      return send(200, {
        org_id: "org_acme",
        plant_id: meas[1],
        asset_id: url.searchParams.get("asset_id"),
        metric: url.searchParams.get("metric"),
        granularity: url.searchParams.get("granularity") ?? "15min",
        points: [{ ts: "2026-08-25T00:00:00Z", value: 42, quality: 0 }],
      });
    }

    return send(404, { detail: "not found" });
  });

  return new Promise<http.Server>((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (addr && typeof addr === "object") portHolder.port = addr.port;
      resolve(server);
    });
  });
}

describe("L2 BFF routes", () => {
  const portHolder = { port: 0 };
  let mock: http.Server;

  before(async () => {
    mock = await createMockL2(portHolder);
  });
  after(async () => {
    await new Promise<void>((resolve, reject) =>
      mock.close((err) => (err ? reject(err) : resolve())),
    );
  });

  it("returns L2 assets for an authorised plant and 403 for foreign plant", async (t) => {
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
      L2_BASE_URL: `http://127.0.0.1:${portHolder.port}`,
      L2_SERVICE_KEY: "svc-lnm-test",
      L2_LIVE: "true",
    });
    const mailer = createMailer({ from: env.SMTP_FROM });
    const auth = createAuth(db, env, mailer);

    const createL2Client = (orgId: string) =>
      new L2QueryClient({
        baseUrl: env.L2_BASE_URL,
        timeoutMs: env.L2_TIMEOUT_MS,
        orgId,
        serviceKey: env.L2_SERVICE_KEY!,
        features: defaultL2FeaturesFromEnv(process.env),
      });

    const app = await buildApp({
      env,
      auth,
      mailer,
      db,
      createL2Client,
    });

    const email = `lnm_${randomUUID().slice(0, 8)}@stamped.test`;
    const password = "operator-password-12+";
    const userId = randomUUID();
    await db.insert(user).values({
      id: userId,
      name: "LNM Op",
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

    const seeded = await seedLnmFactoryPlant(db, { adminUserId: userId });

    // Foreign plant in another org — not in membership
    const otherOrg = await createOrganization(db, {
      slug: `other_${randomUUID().slice(0, 6)}`,
      name: "Other Co",
    });
    await createPlant(db, {
      orgId: otherOrg.id,
      externalPlantId: "plant_foreign_1",
      name: "Foreign Plant",
    });

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

    const ok = await app.inject({
      method: "GET",
      url: `/api/l2/assets?plantId=${encodeURIComponent(seeded.plant.externalPlantId)}`,
      headers: { cookie },
    });
    assert.equal(ok.statusCode, 200, ok.body);
    const body = ok.json() as {
      items: Array<{ asset_id: string }>;
      source: string;
    };
    assert.equal(body.source, "l2");
    assert.equal(body.items[0]?.asset_id, "cnc_vtl_01");

    const forbidden = await app.inject({
      method: "GET",
      url: "/api/l2/assets?plantId=plant_foreign_1",
      headers: { cookie },
    });
    assert.equal(forbidden.statusCode, 403, forbidden.body);

    const meas = await app.inject({
      method: "GET",
      url:
        `/api/l2/measurements?plantId=${encodeURIComponent(seeded.plant.externalPlantId)}` +
        `&assetId=cnc_vtl_01&metric=active_power_kw` +
        `&from=2026-08-25T00:00:00Z&to=2026-08-25T01:00:00Z`,
      headers: { cookie },
    });
    assert.equal(meas.statusCode, 200, meas.body);
    const mbody = meas.json() as { source: string; points: unknown[] };
    assert.equal(mbody.source, "l2");
    assert.equal(mbody.points.length, 1);

    await app.close();
    await pool.end();
  });

  it("returns 503 when L2 client is not configured", async (t) => {
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
      L2_LIVE: "false",
    });
    const mailer = createMailer({ from: env.SMTP_FROM });
    const auth = createAuth(db, env, mailer);
    const app = await buildApp({ env, auth, mailer, db, l2: null });

    const email = `lnm2_${randomUUID().slice(0, 8)}@stamped.test`;
    const password = "operator-password-12+";
    const userId = randomUUID();
    await db.insert(user).values({
      id: userId,
      name: "LNM Op",
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
    const seeded = await seedLnmFactoryPlant(db, { adminUserId: userId });

    const signIn = await app.inject({
      method: "POST",
      url: "/api/auth/sign-in/email",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      payload: { email, password },
    });
    const cookie = cookieHeader(signIn.headers["set-cookie"]);

    const res = await app.inject({
      method: "GET",
      url: `/api/l2/assets?plantId=${encodeURIComponent(seeded.plant.externalPlantId)}`,
      headers: { cookie },
    });
    assert.equal(res.statusCode, 503, res.body);

    await app.close();
    await pool.end();
  });
});

describe("public /v1 rate limit", () => {
  it("applies a stricter ceiling than the global BFF limit", async (t) => {
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
    });
    const app = await buildApp({
      env,
      db,
      publicRateLimitMax: 3,
    });

    // Unauthenticated hits still count against the public limiter
    let lastStatus = 0;
    for (let i = 0; i < 5; i++) {
      const res = await app.inject({ method: "GET", url: "/v1/openapi.json" });
      lastStatus = res.statusCode;
    }
    assert.equal(lastStatus, 429);

    await app.close();
    await pool.end();
  });
});

describe("seedLnmFactoryPlant", () => {
  it("creates acme org + LNM plant and authorises the admin", async (t) => {
    if (!databaseUrl) {
      t.skip("DATABASE_URL not set");
      return;
    }

    await resetDatabase(databaseUrl);
    await runMigrations(databaseUrl);
    const pool = createPool(databaseUrl);
    const db = createDb(pool);

    const adminUserId = `user_${randomUUID()}`;
    const seeded = await seedLnmFactoryPlant(db, { adminUserId });

    assert.equal(seeded.org.slug, "acme");
    assert.equal(seeded.plant.externalPlantId, "plant_lnm_faridabad_1");
    assert.equal(seeded.plant.name, "LNM Factory 1");
    assert.deepEqual(seeded.membership.plantIds, [seeded.plant.id]);

    await pool.end();
  });

  it("extends membership when Vinayak already exists on acme", async (t) => {
    if (!databaseUrl) {
      t.skip("DATABASE_URL not set");
      return;
    }

    await resetDatabase(databaseUrl);
    await runMigrations(databaseUrl);
    const pool = createPool(databaseUrl);
    const db = createDb(pool);

    const adminUserId = `user_${randomUUID()}`;
    const org = await createOrganization(db, { slug: "acme", name: "Acme" });
    const vinayak = await createPlant(db, {
      orgId: org.id,
      externalPlantId: "plant_vinayak_1",
      name: "Vinayak Plant",
    });
    await addMembership(db, {
      userId: adminUserId,
      orgId: org.id,
      role: "admin",
      plantIds: [vinayak.id],
    });

    const seeded = await seedLnmFactoryPlant(db, {
      adminUserId,
      orgId: org.id,
    });
    assert.equal(seeded.membership.plantIds.length, 2);
    assert.ok(seeded.membership.plantIds.includes(vinayak.id));
    assert.ok(seeded.membership.plantIds.includes(seeded.plant.id));

    await pool.end();
  });
});
