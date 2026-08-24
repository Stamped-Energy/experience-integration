/**
 * Seed demo user + LNM Factory 1 plant membership (Phase E).
 *
 * Credentials are env-only — no inventable defaults (Phase S):
 *   DEMO_USER_EMAIL
 *   DEMO_USER_PASSWORD
 * Optional:
 *   DEMO_USER_NAME (default "LNM Demo")
 *   ORG_ID — reuse an existing org UUID
 *   ADMIN_USER_ID — if set, skip user create and only attach plant membership
 *
 * Usage:
 *   DEMO_USER_EMAIL=... DEMO_USER_PASSWORD=... DATABASE_URL=... \
 *     pnpm --filter @stamped/l6-api seed:lnm-demo
 */
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { loadEnv } from "../src/config.js";
import { account, user } from "../src/db/auth-schema.js";
import { createDb, createPool } from "../src/db/client.js";
import { seedLnmFactoryPlant } from "../src/tenancy/service.js";

async function main() {
  const env = loadEnv();
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed the LNM demo user");
  }

  const existingUserId = process.env.ADMIN_USER_ID?.trim();
  const email = process.env.DEMO_USER_EMAIL?.trim();
  const password = process.env.DEMO_USER_PASSWORD;
  const name = process.env.DEMO_USER_NAME?.trim() || "LNM Demo";

  if (!existingUserId) {
    if (!email) {
      throw new Error(
        "DEMO_USER_EMAIL is required (or set ADMIN_USER_ID to attach an existing user)",
      );
    }
    if (!password || password.length < 12) {
      throw new Error(
        "DEMO_USER_PASSWORD is required and must be at least 12 characters (no inventable default)",
      );
    }
  }

  const orgId = process.env.ORG_ID || undefined;
  const pool = createPool(env.DATABASE_URL);
  const db = createDb(pool);

  try {
    let adminUserId = existingUserId;
    if (!adminUserId) {
      const existing = await db
        .select()
        .from(user)
        .where(eq(user.email, email!))
        .then((rows) => rows[0]);
      if (existing) {
        adminUserId = existing.id;
        console.error(
          `User ${email} already exists (${adminUserId}) — attaching LNM membership only`,
        );
      } else {
        adminUserId = randomUUID();
        await db.insert(user).values({
          id: adminUserId,
          name,
          email: email!,
          emailVerified: true,
          role: "user",
        });
        await db.insert(account).values({
          id: randomUUID(),
          accountId: adminUserId,
          providerId: "credential",
          userId: adminUserId,
          password: await hashPassword(password!),
        });
      }
    }

    const seeded = await seedLnmFactoryPlant(db, {
      adminUserId,
      orgId,
    });

    console.log(
      JSON.stringify(
        {
          userId: adminUserId,
          email: email ?? null,
          orgId: seeded.org.id,
          orgSlug: seeded.org.slug,
          plantId: seeded.plant.id,
          externalPlantId: seeded.plant.externalPlantId,
          plantName: seeded.plant.name,
          membershipId: seeded.membership.id,
          plantIds: seeded.membership.plantIds,
        },
        null,
        2,
      ),
    );
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
