import { and, eq } from "drizzle-orm";
import { RoleSchema, type Role } from "@stamped/l6-contracts";
import { requirePermission } from "../authz/index.js";
import type { Db } from "../db/client.js";
import { redactSensitive } from "../security/redact.js";
import {
  memberships,
  organizations,
  plantMemberships,
  plants,
  userPreferences,
  auditEvents,
} from "../db/schema.js";

export type MembershipRecord = {
  id: string;
  userId: string;
  orgId: string;
  role: Role;
  status: string;
  plantIds: string[];
};

export async function createOrganization(
  db: Db,
  input: { slug: string; name: string },
) {
  const [org] = await db
    .insert(organizations)
    .values({ slug: input.slug, name: input.name })
    .returning();
  return org;
}

export async function createPlant(
  db: Db,
  input: {
    orgId: string;
    externalPlantId: string;
    name: string;
    timezone?: string;
  },
) {
  const [plant] = await db
    .insert(plants)
    .values({
      orgId: input.orgId,
      externalPlantId: input.externalPlantId,
      name: input.name,
      timezone: input.timezone ?? "Asia/Kolkata",
    })
    .returning();
  return plant;
}

export async function addMembership(
  db: Db,
  input: {
    userId: string;
    orgId: string;
    role: Role;
    plantIds: string[];
  },
): Promise<MembershipRecord> {
  const role = RoleSchema.parse(input.role);
  const [membership] = await db
    .insert(memberships)
    .values({
      userId: input.userId,
      orgId: input.orgId,
      role,
      status: "active",
    })
    .returning();

  if (input.plantIds.length > 0) {
    await db.insert(plantMemberships).values(
      input.plantIds.map((plantId) => ({
        membershipId: membership.id,
        plantId,
      })),
    );
  }

  return {
    id: membership.id,
    userId: membership.userId,
    orgId: membership.orgId,
    role,
    status: membership.status,
    plantIds: input.plantIds,
  };
}

export async function listMembershipsForUser(
  db: Db,
  userId: string,
): Promise<MembershipRecord[]> {
  const rows = await db
    .select()
    .from(memberships)
    .where(eq(memberships.userId, userId));

  const result: MembershipRecord[] = [];
  for (const row of rows) {
    const plantRows = await db
      .select()
      .from(plantMemberships)
      .where(eq(plantMemberships.membershipId, row.id));
    result.push({
      id: row.id,
      userId: row.userId,
      orgId: row.orgId,
      role: RoleSchema.parse(row.role),
      status: row.status,
      plantIds: plantRows.map((p) => p.plantId),
    });
  }
  return result;
}

export async function assertPlantAccess(
  db: Db,
  input: { userId: string; orgId: string; plantId: string },
): Promise<MembershipRecord> {
  const membership = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, input.userId),
        eq(memberships.orgId, input.orgId),
        eq(memberships.status, "active"),
      ),
    )
    .then((rows) => rows[0]);

  if (!membership) {
    throw Object.assign(new Error("No active membership for organization"), {
      statusCode: 403,
      code: "TENANCY_FORBIDDEN",
    });
  }

  const plantRows = await db
    .select()
    .from(plantMemberships)
    .where(eq(plantMemberships.membershipId, membership.id));
  const plantIds = plantRows.map((p) => p.plantId);
  if (!plantIds.includes(input.plantId)) {
    throw Object.assign(new Error("Plant not in membership scope"), {
      statusCode: 403,
      code: "PLANT_FORBIDDEN",
    });
  }

  return {
    id: membership.id,
    userId: membership.userId,
    orgId: membership.orgId,
    role: RoleSchema.parse(membership.role),
    status: membership.status,
    plantIds,
  };
}

/**
 * Seed demo org + Jaipur plant (offline Playwright / test fixture baseline)
 * + Vinayak plant (C-L6a live path) + admin membership scoped to both,
 * with Vinayak set as the active plant.
 */
export async function seedDemoTenant(
  db: Db,
  input: { adminUserId: string },
) {
  const org = await createOrganization(db, {
    slug: "demo",
    name: "Demo Industries",
  });
  const plant = await createPlant(db, {
    orgId: org.id,
    externalPlantId: "plant_jaipur_01",
    name: "Jaipur Works",
  });
  const vinayakPlant = await createPlant(db, {
    orgId: org.id,
    externalPlantId: "plant_vinayak_1",
    name: "Vinayak Plant",
    timezone: "Asia/Kolkata",
  });
  const membership = await addMembership(db, {
    userId: input.adminUserId,
    orgId: org.id,
    role: "admin",
    plantIds: [plant.id, vinayakPlant.id],
  });
  await db.insert(userPreferences).values({
    userId: input.adminUserId,
    orgId: org.id,
    activePlantId: vinayakPlant.id,
    prefs: {},
  });
  return { org, plant, vinayakPlant, membership };
}

/**
 * Seed/attach the Vinayak Plant (C-L6b) live path — for use standalone
 * (creates org "acme") or against an existing org (e.g. one already seeded
 * by `seedDemoTenant`), in which case the admin membership is extended to
 * cover Vinayak alongside any plants it already has.
 */
export async function seedVinayakPlant(
  db: Db,
  input: { adminUserId: string; orgId?: string },
) {
  let org: { id: string; slug: string; name: string };
  if (input.orgId) {
    const [existingOrg] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, input.orgId));
    if (!existingOrg) {
      throw new Error(`Organization ${input.orgId} not found`);
    }
    org = existingOrg;
  } else {
    org = await createOrganization(db, { slug: "acme", name: "Acme" });
  }

  const existingVinayak = await db
    .select()
    .from(plants)
    .where(
      and(
        eq(plants.orgId, org.id),
        eq(plants.externalPlantId, "plant_vinayak_1"),
      ),
    )
    .then((rows) => rows[0]);
  const vinayakPlant =
    existingVinayak ??
    (await createPlant(db, {
      orgId: org.id,
      externalPlantId: "plant_vinayak_1",
      name: "Vinayak Plant",
      timezone: "Asia/Kolkata",
    }));

  const existingMembership = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, input.adminUserId),
        eq(memberships.orgId, org.id),
      ),
    )
    .then((rows) => rows[0]);

  let membership: MembershipRecord;
  if (existingMembership) {
    const existingPlantRows = await db
      .select()
      .from(plantMemberships)
      .where(eq(plantMemberships.membershipId, existingMembership.id));
    const plantIds = Array.from(
      new Set([...existingPlantRows.map((p) => p.plantId), vinayakPlant.id]),
    );
    membership = await updateMembershipRoleAndPlants(db, {
      membershipId: existingMembership.id,
      role: RoleSchema.parse(existingMembership.role),
      plantIds,
    });
  } else {
    membership = await addMembership(db, {
      userId: input.adminUserId,
      orgId: org.id,
      role: "admin",
      plantIds: [vinayakPlant.id],
    });
  }

  const existingPref = await db
    .select()
    .from(userPreferences)
    .where(
      and(
        eq(userPreferences.userId, input.adminUserId),
        eq(userPreferences.orgId, org.id),
      ),
    )
    .then((rows) => rows[0]);
  if (existingPref) {
    await db
      .update(userPreferences)
      .set({ activePlantId: vinayakPlant.id, updatedAt: new Date() })
      .where(eq(userPreferences.id, existingPref.id));
  } else {
    await db.insert(userPreferences).values({
      userId: input.adminUserId,
      orgId: org.id,
      activePlantId: vinayakPlant.id,
      prefs: {},
    });
  }

  return { org, plant: vinayakPlant, membership };
}

export async function listOrgMemberships(
  db: Db,
  orgId: string,
): Promise<MembershipRecord[]> {
  const rows = await db
    .select()
    .from(memberships)
    .where(eq(memberships.orgId, orgId));
  const result: MembershipRecord[] = [];
  for (const row of rows) {
    const plantRows = await db
      .select()
      .from(plantMemberships)
      .where(eq(plantMemberships.membershipId, row.id));
    result.push({
      id: row.id,
      userId: row.userId,
      orgId: row.orgId,
      role: RoleSchema.parse(row.role),
      status: row.status,
      plantIds: plantRows.map((p) => p.plantId),
    });
  }
  return result;
}

export async function updateMembershipRoleAndPlants(
  db: Db,
  input: {
    membershipId: string;
    role: Role;
    plantIds: string[];
  },
): Promise<MembershipRecord> {
  const role = RoleSchema.parse(input.role);
  const [membership] = await db
    .update(memberships)
    .set({ role, updatedAt: new Date() })
    .where(eq(memberships.id, input.membershipId))
    .returning();
  if (!membership) {
    throw Object.assign(new Error("Membership not found"), {
      statusCode: 404,
      code: "MEMBERSHIP_NOT_FOUND",
    });
  }
  await db
    .delete(plantMemberships)
    .where(eq(plantMemberships.membershipId, membership.id));
  if (input.plantIds.length > 0) {
    await db.insert(plantMemberships).values(
      input.plantIds.map((plantId) => ({
        membershipId: membership.id,
        plantId,
      })),
    );
  }
  return {
    id: membership.id,
    userId: membership.userId,
    orgId: membership.orgId,
    role,
    status: membership.status,
    plantIds: input.plantIds,
  };
}

export async function setMembershipStatus(
  db: Db,
  input: { membershipId: string; status: "active" | "inactive" },
) {
  const [membership] = await db
    .update(memberships)
    .set({ status: input.status, updatedAt: new Date() })
    .where(eq(memberships.id, input.membershipId))
    .returning();
  if (!membership) {
    throw Object.assign(new Error("Membership not found"), {
      statusCode: 404,
      code: "MEMBERSHIP_NOT_FOUND",
    });
  }
  return membership;
}

export async function writeAudit(
  db: Db,
  input: {
    orgId?: string | null;
    actorUserId?: string | null;
    action: string;
    resourceType: string;
    resourceId?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  await db.insert(auditEvents).values({
    orgId: input.orgId ?? null,
    actorUserId: input.actorUserId ?? null,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId ?? null,
    metadata: (redactSensitive(input.metadata ?? {}) ?? {}) as Record<
      string,
      unknown
    >,
  });
}

export type AuthorizedPlant = {
  id: string;
  orgId: string;
  externalPlantId: string;
  name: string;
  timezone: string;
  role: Role;
};

export async function listAuthorizedPlants(
  db: Db,
  userId: string,
): Promise<AuthorizedPlant[]> {
  const membershipRows = await db
    .select()
    .from(memberships)
    .where(
      and(eq(memberships.userId, userId), eq(memberships.status, "active")),
    );
  const out: AuthorizedPlant[] = [];
  for (const membership of membershipRows) {
    const plantRows = await db
      .select({
        plant: plants,
      })
      .from(plantMemberships)
      .innerJoin(plants, eq(plants.id, plantMemberships.plantId))
      .where(eq(plantMemberships.membershipId, membership.id));
    for (const row of plantRows) {
      out.push({
        id: row.plant.id,
        orgId: row.plant.orgId,
        externalPlantId: row.plant.externalPlantId,
        name: row.plant.name,
        timezone: row.plant.timezone,
        role: RoleSchema.parse(membership.role),
      });
    }
  }
  return out;
}

/**
 * Resolve active plant: preference if still authorized, else first authorized,
 * else null (caller recovers to empty state).
 */
export async function resolveActivePlant(
  db: Db,
  input: { userId: string; orgId?: string },
): Promise<{
  activePlant: AuthorizedPlant | null;
  authorized: AuthorizedPlant[];
  recovered: boolean;
}> {
  const authorized = await listAuthorizedPlants(db, input.userId);
  const scoped = input.orgId
    ? authorized.filter((p) => p.orgId === input.orgId)
    : authorized;

  if (scoped.length === 0) {
    return { activePlant: null, authorized: scoped, recovered: false };
  }

  const prefs = input.orgId
    ? await db
        .select()
        .from(userPreferences)
        .where(
          and(
            eq(userPreferences.userId, input.userId),
            eq(userPreferences.orgId, input.orgId),
          ),
        )
        .then((rows) => rows[0])
    : undefined;

  if (prefs?.activePlantId) {
    const match = scoped.find((p) => p.id === prefs.activePlantId);
    if (match) {
      return { activePlant: match, authorized: scoped, recovered: false };
    }
  }

  const fallback = scoped[0]!;
  if (prefs && input.orgId) {
    await db
      .update(userPreferences)
      .set({ activePlantId: fallback.id, updatedAt: new Date() })
      .where(eq(userPreferences.id, prefs.id));
  } else if (input.orgId) {
    await db.insert(userPreferences).values({
      userId: input.userId,
      orgId: input.orgId,
      activePlantId: fallback.id,
      prefs: {},
    });
  }
  return {
    activePlant: fallback,
    authorized: scoped,
    recovered: Boolean(prefs?.activePlantId),
  };
}

export async function setActivePlant(
  db: Db,
  input: { userId: string; orgId: string; plantId: string },
): Promise<AuthorizedPlant> {
  const membership = await assertPlantAccess(db, input);
  requirePermission(membership.role, "plant:switch");

  const existing = await db
    .select()
    .from(userPreferences)
    .where(
      and(
        eq(userPreferences.userId, input.userId),
        eq(userPreferences.orgId, input.orgId),
      ),
    )
    .then((rows) => rows[0]);

  if (existing) {
    await db
      .update(userPreferences)
      .set({ activePlantId: input.plantId, updatedAt: new Date() })
      .where(eq(userPreferences.id, existing.id));
  } else {
    await db.insert(userPreferences).values({
      userId: input.userId,
      orgId: input.orgId,
      activePlantId: input.plantId,
      prefs: {},
    });
  }

  const authorized = await listAuthorizedPlants(db, input.userId);
  const plant = authorized.find((p) => p.id === input.plantId);
  if (!plant) {
    throw Object.assign(new Error("Plant not found after switch"), {
      statusCode: 404,
      code: "PLANT_NOT_FOUND",
    });
  }
  return plant;
}
