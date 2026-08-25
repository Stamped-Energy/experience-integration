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
import { loadDotEnv } from "../src/db/load-dotenv.js";
import { runMigrations } from "../src/db/migrate.js";
import { createMailer } from "../src/mail/mailer.js";
import { seedDemoTenant } from "../src/tenancy/service.js";
import { maskPhoneE164, normalizePhoneE164 } from "../src/assignments/service.js";
import { resetDatabase } from "./helpers/db.js";

loadDotEnv();
const databaseUrl = process.env.DATABASE_URL;

function testEnv() {
  return loadEnv({
    NODE_ENV: "test",
    LOG_LEVEL: "silent",
    DATABASE_URL: databaseUrl,
    BETTER_AUTH_SECRET: "test-secret-stamped-l6-auth-32chars!",
    BETTER_AUTH_URL: "http://localhost:3001",
    WEB_ORIGIN: "http://localhost:3000",
  });
}

async function seedAuthUser(
  db: ReturnType<typeof createDb>,
  opts: { email: string; password: string; role?: string; name?: string },
) {
  const userId = randomUUID();
  await db.insert(user).values({
    id: userId,
    name: opts.name ?? "User",
    email: opts.email,
    emailVerified: true,
    role: opts.role ?? "user",
  });
  await db.insert(account).values({
    id: randomUUID(),
    accountId: userId,
    providerId: "credential",
    userId,
    password: await hashPassword(opts.password),
  });
  return userId;
}

describe("assignments phone helpers", () => {
  it("normalizes and masks E.164 phones", () => {
    assert.equal(normalizePhoneE164("9876543210"), "+919876543210");
    assert.equal(normalizePhoneE164("+91 98765 43210"), "+919876543210");
    assert.match(maskPhoneE164("+919876543210"), /4410|3210/);
  });
});

describe("assignments CRUD API", () => {
  it("creates lists updates and deletes people and routes", async (t) => {
    if (!databaseUrl) {
      t.skip("DATABASE_URL not set");
      return;
    }

    await resetDatabase(databaseUrl);
    await runMigrations(databaseUrl);
    const pool = createPool(databaseUrl);
    const db = createDb(pool);
    const env = testEnv();
    const mailer = createMailer({ from: env.SMTP_FROM });
    const auth = createAuth(db, env, mailer);
    const app = await buildApp({ env, auth, mailer, db });

    const password = "admin-password-12+";
    const email = `assign_admin_${randomUUID().slice(0, 8)}@stamped.test`;
    const adminUserId = await seedAuthUser(db, {
      email,
      password,
      role: "admin",
    });
    await seedDemoTenant(db, { adminUserId });

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

    const empty = await app.inject({
      method: "GET",
      url: "/api/assignments/people",
      headers: { cookie },
    });
    assert.equal(empty.statusCode, 200, empty.body);
    assert.equal(empty.json().people.length, 0);

    const created = await app.inject({
      method: "POST",
      url: "/api/assignments/people",
      headers: { cookie, "content-type": "application/json" },
      payload: {
        name: "Imran Khan",
        role: "operator",
        phone: "9876544412",
        areas: ["Pyro"],
        assetIds: ["kiln_1"],
        skills: ["kiln"],
        whatsappEnabled: true,
      },
    });
    assert.equal(created.statusCode, 201, created.body);
    const person = created.json().person as {
      id: string;
      phoneMasked: string;
      phoneE164?: string;
    };
    assert.ok(person.id);
    assert.ok(person.phoneMasked.includes("4412"));
    assert.equal(person.phoneE164, undefined);

    const listed = await app.inject({
      method: "GET",
      url: "/api/assignments/people",
      headers: { cookie },
    });
    assert.equal(listed.json().people.length, 1);

    const revealed = await app.inject({
      method: "GET",
      url: "/api/assignments/people?reveal=1",
      headers: { cookie },
    });
    assert.equal(revealed.statusCode, 200);
    assert.equal(revealed.json().people[0].phoneE164, "+919876544412");

    const patched = await app.inject({
      method: "PATCH",
      url: `/api/assignments/people/${person.id}`,
      headers: { cookie, "content-type": "application/json" },
      payload: { whatsappEnabled: false, areas: ["Pyro", "Utilities"] },
    });
    assert.equal(patched.statusCode, 200, patched.body);
    assert.equal(patched.json().person.whatsappEnabled, false);

    const routeCreated = await app.inject({
      method: "POST",
      url: "/api/assignments/routes",
      headers: { cookie, "content-type": "application/json" },
      payload: {
        scope: "area",
        target: "Pyro",
        label: "Pyro primary",
        primaryPersonId: person.id,
        backupPersonIds: [],
        severityMin: "warning",
      },
    });
    assert.equal(routeCreated.statusCode, 201, routeCreated.body);
    const routeId = routeCreated.json().route.id as string;

    const routes = await app.inject({
      method: "GET",
      url: "/api/assignments/routes",
      headers: { cookie },
    });
    assert.equal(routes.json().routes.length, 1);

    const routePatched = await app.inject({
      method: "PATCH",
      url: `/api/assignments/routes/${routeId}`,
      headers: { cookie, "content-type": "application/json" },
      payload: { severityMin: "critical" },
    });
    assert.equal(routePatched.statusCode, 200);
    assert.equal(routePatched.json().route.severityMin, "critical");

    const delRoute = await app.inject({
      method: "DELETE",
      url: `/api/assignments/routes/${routeId}`,
      headers: { cookie },
    });
    assert.equal(delRoute.statusCode, 204);

    const delPerson = await app.inject({
      method: "DELETE",
      url: `/api/assignments/people/${person.id}`,
      headers: { cookie },
    });
    assert.equal(delPerson.statusCode, 204);

    const after = await app.inject({
      method: "GET",
      url: "/api/assignments/people",
      headers: { cookie },
    });
    assert.equal(after.json().people.length, 0);

    await app.close();
    await pool.end();
  });
});
