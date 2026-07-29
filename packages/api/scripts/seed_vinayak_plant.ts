/**
 * Seed the Vinayak Plant (C-L6b live path) against DATABASE_URL.
 *
 * Usage:
 *   DATABASE_URL=postgres://... ADMIN_USER_ID=user_xyz \
 *     tsx packages/api/scripts/seed_vinayak_plant.ts
 *
 * Optional env:
 *   ORG_ID — reuse an existing org (e.g. one already seeded with Jaipur).
 *            When omitted, creates org slug "acme" / name "Acme".
 */
import { loadEnv } from "../src/config.js";
import { createDb, createPool } from "../src/db/client.js";
import { seedVinayakPlant } from "../src/tenancy/service.js";

async function main() {
  const env = loadEnv();
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed the Vinayak plant");
  }
  const adminUserId = process.env.ADMIN_USER_ID;
  if (!adminUserId) {
    throw new Error("ADMIN_USER_ID env var is required (existing auth user id)");
  }
  const orgId = process.env.ORG_ID || undefined;

  const pool = createPool(env.DATABASE_URL);
  const db = createDb(pool);
  try {
    const seeded = await seedVinayakPlant(db, { adminUserId, orgId });
    console.log(
      JSON.stringify(
        {
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
