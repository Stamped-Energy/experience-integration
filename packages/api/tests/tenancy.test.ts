import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { createDb, createPool } from "../src/db/client.js";
import { runMigrations } from "../src/db/migrate.js";
import {
  addMembership,
  assertPlantAccess,
  createOrganization,
  createPlant,
  listAuthorizedPlants,
  listMembershipsForUser,
  resolveActivePlant,
  seedDemoTenant,
} from "../src/tenancy/service.js";
import { resetDatabase } from "./helpers/db.js";

const databaseUrl = process.env.DATABASE_URL;

describe("tenancy model", () => {
  it("models org, plants, memberships and seeded admin", async (t) => {
    if (!databaseUrl) {
      t.skip("DATABASE_URL not set");
      return;
    }

    await resetDatabase(databaseUrl);
    await runMigrations(databaseUrl);
    const pool = createPool(databaseUrl);
    const db = createDb(pool);

    const adminUserId = `user_${randomUUID()}`;
    const seeded = await seedDemoTenant(db, { adminUserId });
    assert.equal(seeded.org.slug, "demo");
    assert.equal(seeded.membership.role, "admin");
    // Membership now spans Jaipur (offline fixture baseline) + Vinayak (live path).
    assert.deepEqual(seeded.membership.plantIds, [
      seeded.plant.id,
      seeded.vinayakPlant.id,
    ]);
    assert.equal(seeded.vinayakPlant.externalPlantId, "plant_vinayak_1");

    const listed = await listMembershipsForUser(db, adminUserId);
    assert.equal(listed.length, 1);
    assert.equal(listed[0]?.role, "admin");
    assert.deepEqual(
      new Set(listed[0]?.plantIds),
      new Set([seeded.plant.id, seeded.vinayakPlant.id]),
    );

    // Vinayak is listed among the admin's authorized plants, active by default.
    const authorized = await listAuthorizedPlants(db, adminUserId);
    assert.ok(
      authorized.some((p) => p.externalPlantId === "plant_vinayak_1"),
    );
    const activeResolution = await resolveActivePlant(db, {
      userId: adminUserId,
      orgId: seeded.org.id,
    });
    assert.equal(
      activeResolution.activePlant?.externalPlantId,
      "plant_vinayak_1",
    );

    await assertPlantAccess(db, {
      userId: adminUserId,
      orgId: seeded.org.id,
      plantId: seeded.plant.id,
    });

    const otherPlant = await createPlant(db, {
      orgId: seeded.org.id,
      externalPlantId: "plant_pune_02",
      name: "Pune Works",
    });

    await assert.rejects(
      () =>
        assertPlantAccess(db, {
          userId: adminUserId,
          orgId: seeded.org.id,
          plantId: otherPlant.id,
        }),
      (err: Error & { code?: string }) => err.code === "PLANT_FORBIDDEN",
    );

    const operatorId = `user_${randomUUID()}`;
    const org2 = await createOrganization(db, {
      slug: "acme",
      name: "Acme",
    });
    const plant2 = await createPlant(db, {
      orgId: org2.id,
      externalPlantId: "plant_1",
      name: "Plant 1",
    });
    await addMembership(db, {
      userId: operatorId,
      orgId: org2.id,
      role: "operator",
      plantIds: [plant2.id],
    });

    // Cross-tenant: operator cannot access demo plant
    await assert.rejects(
      () =>
        assertPlantAccess(db, {
          userId: operatorId,
          orgId: seeded.org.id,
          plantId: seeded.plant.id,
        }),
      (err: Error & { code?: string }) => err.code === "TENANCY_FORBIDDEN",
    );

    await pool.end();
  });
});
