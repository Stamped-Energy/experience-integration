import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { createDb, createPool } from "../src/db/client.js";
import { runMigrations } from "../src/db/migrate.js";
import {
  addMembership,
  createOrganization,
  createPlant,
  listAuthorizedPlants,
  resolveActivePlant,
  seedVinayakPlant,
} from "../src/tenancy/service.js";
import { resetDatabase } from "./helpers/db.js";

const databaseUrl = process.env.DATABASE_URL;

describe("seedVinayakPlant", () => {
  it("creates a standalone org (acme) + Vinayak plant when no orgId given", async (t) => {
    if (!databaseUrl) {
      t.skip("DATABASE_URL not set");
      return;
    }

    await resetDatabase(databaseUrl);
    await runMigrations(databaseUrl);
    const pool = createPool(databaseUrl);
    const db = createDb(pool);

    const adminUserId = `user_${randomUUID()}`;
    const seeded = await seedVinayakPlant(db, { adminUserId });

    assert.equal(seeded.org.slug, "acme");
    assert.equal(seeded.org.name, "Acme");
    assert.equal(seeded.plant.externalPlantId, "plant_vinayak_1");
    assert.equal(seeded.plant.name, "Vinayak Plant");
    assert.equal(seeded.plant.timezone, "Asia/Kolkata");
    assert.equal(seeded.membership.role, "admin");
    assert.deepEqual(seeded.membership.plantIds, [seeded.plant.id]);

    const active = await resolveActivePlant(db, {
      userId: adminUserId,
      orgId: seeded.org.id,
    });
    assert.equal(active.activePlant?.externalPlantId, "plant_vinayak_1");

    await pool.end();
  });

  it("extends an existing org's admin membership to include Vinayak alongside Jaipur", async (t) => {
    if (!databaseUrl) {
      t.skip("DATABASE_URL not set");
      return;
    }

    await resetDatabase(databaseUrl);
    await runMigrations(databaseUrl);
    const pool = createPool(databaseUrl);
    const db = createDb(pool);

    const adminUserId = `user_${randomUUID()}`;
    // Simulate a pre-existing org that only has Jaipur (no Vinayak yet).
    const org = await createOrganization(db, {
      slug: "jaipur-only",
      name: "Jaipur Only Co",
    });
    const jaipurPlant = await createPlant(db, {
      orgId: org.id,
      externalPlantId: "plant_jaipur_01",
      name: "Jaipur Works",
    });
    await addMembership(db, {
      userId: adminUserId,
      orgId: org.id,
      role: "admin",
      plantIds: [jaipurPlant.id],
    });

    const seeded = await seedVinayakPlant(db, {
      adminUserId,
      orgId: org.id,
    });

    assert.equal(seeded.org.id, org.id);
    assert.equal(seeded.plant.externalPlantId, "plant_vinayak_1");

    const authorized = await listAuthorizedPlants(db, adminUserId);
    const externalIds = authorized.map((p) => p.externalPlantId).sort();
    assert.deepEqual(externalIds, ["plant_jaipur_01", "plant_vinayak_1"]);

    const active = await resolveActivePlant(db, {
      userId: adminUserId,
      orgId: org.id,
    });
    assert.equal(active.activePlant?.externalPlantId, "plant_vinayak_1");

    await pool.end();
  });
});
