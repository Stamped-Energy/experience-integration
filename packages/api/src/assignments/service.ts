import { and, eq } from "drizzle-orm";
import {
  AlarmSeveritySchema,
  RoleSchema,
} from "@stamped/l6-contracts";
import { z } from "zod";
import type { Db } from "../db/client.js";
import { alarmRouteRules, notifyPeople } from "../db/schema.js";

export function maskPhoneE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "+•• •••• •• ----";
  const last4 = digits.slice(-4);
  const cc = digits.length > 10 ? digits.slice(0, digits.length - 10) : "91";
  return `+${cc} •••• •• ${last4}`;
}

export function normalizePhoneE164(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("Phone is required");
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 10) throw new Error("Phone must have at least 10 digits");
  if (trimmed.startsWith("+")) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
}

export const PersonCreateBody = z.object({
  name: z.string().min(1).max(120),
  role: RoleSchema,
  phone: z.string().min(8).max(24),
  areas: z.array(z.string()).default([]),
  assetIds: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  whatsappEnabled: z.boolean().default(true),
});

export const PersonPatchBody = PersonCreateBody.partial();

export const RouteCreateBody = z.object({
  scope: z.enum(["area", "asset"]),
  target: z.string().min(1).max(120),
  label: z.string().min(1).max(160),
  primaryPersonId: z.string().uuid(),
  backupPersonIds: z.array(z.string().uuid()).default([]),
  severityMin: AlarmSeveritySchema.default("warning"),
});

export const RoutePatchBody = RouteCreateBody.partial();

export type PersonDto = {
  id: string;
  name: string;
  role: string;
  phoneMasked: string;
  phoneE164?: string;
  areas: string[];
  assetIds: string[];
  skills: string[];
  whatsappEnabled: boolean;
};

export type RouteDto = {
  id: string;
  scope: "area" | "asset";
  target: string;
  label: string;
  primaryPersonId: string;
  backupPersonIds: string[];
  severityMin: string;
};

function toPersonDto(
  row: typeof notifyPeople.$inferSelect,
  revealPhone: boolean,
): PersonDto {
  const dto: PersonDto = {
    id: row.id,
    name: row.name,
    role: row.role,
    phoneMasked: maskPhoneE164(row.phoneE164),
    areas: row.areas ?? [],
    assetIds: row.assetIds ?? [],
    skills: row.skills ?? [],
    whatsappEnabled: row.whatsappEnabled,
  };
  if (revealPhone) dto.phoneE164 = row.phoneE164;
  return dto;
}

function toRouteDto(row: typeof alarmRouteRules.$inferSelect): RouteDto {
  return {
    id: row.id,
    scope: row.scope as "area" | "asset",
    target: row.target,
    label: row.label,
    primaryPersonId: row.primaryPersonId,
    backupPersonIds: row.backupPersonIds ?? [],
    severityMin: row.severityMin,
  };
}

export async function listNotifyPeople(
  db: Db,
  input: { plantId: string; revealPhone?: boolean },
): Promise<PersonDto[]> {
  const rows = await db
    .select()
    .from(notifyPeople)
    .where(eq(notifyPeople.plantId, input.plantId));
  return rows.map((r) => toPersonDto(r, Boolean(input.revealPhone)));
}

export async function createNotifyPerson(
  db: Db,
  input: {
    orgId: string;
    plantId: string;
    body: z.infer<typeof PersonCreateBody>;
  },
): Promise<PersonDto> {
  const phoneE164 = normalizePhoneE164(input.body.phone);
  const [row] = await db
    .insert(notifyPeople)
    .values({
      orgId: input.orgId,
      plantId: input.plantId,
      name: input.body.name,
      role: input.body.role,
      phoneE164,
      areas: input.body.areas,
      assetIds: input.body.assetIds,
      skills: input.body.skills,
      whatsappEnabled: input.body.whatsappEnabled,
    })
    .returning();
  return toPersonDto(row!, false);
}

export async function updateNotifyPerson(
  db: Db,
  input: {
    plantId: string;
    personId: string;
    body: z.infer<typeof PersonPatchBody>;
  },
): Promise<PersonDto | null> {
  const existing = await db
    .select()
    .from(notifyPeople)
    .where(
      and(
        eq(notifyPeople.id, input.personId),
        eq(notifyPeople.plantId, input.plantId),
      ),
    )
    .then((rows) => rows[0]);
  if (!existing) return null;

  const patch: Partial<typeof notifyPeople.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (input.body.name !== undefined) patch.name = input.body.name;
  if (input.body.role !== undefined) patch.role = input.body.role;
  if (input.body.phone !== undefined) {
    patch.phoneE164 = normalizePhoneE164(input.body.phone);
  }
  if (input.body.areas !== undefined) patch.areas = input.body.areas;
  if (input.body.assetIds !== undefined) patch.assetIds = input.body.assetIds;
  if (input.body.skills !== undefined) patch.skills = input.body.skills;
  if (input.body.whatsappEnabled !== undefined) {
    patch.whatsappEnabled = input.body.whatsappEnabled;
  }

  const [row] = await db
    .update(notifyPeople)
    .set(patch)
    .where(eq(notifyPeople.id, input.personId))
    .returning();
  return toPersonDto(row!, false);
}

export async function deleteNotifyPerson(
  db: Db,
  input: { plantId: string; personId: string },
): Promise<boolean> {
  const deleted = await db
    .delete(notifyPeople)
    .where(
      and(
        eq(notifyPeople.id, input.personId),
        eq(notifyPeople.plantId, input.plantId),
      ),
    )
    .returning({ id: notifyPeople.id });
  return deleted.length > 0;
}

export async function listAlarmRouteRules(
  db: Db,
  plantId: string,
): Promise<RouteDto[]> {
  const rows = await db
    .select()
    .from(alarmRouteRules)
    .where(eq(alarmRouteRules.plantId, plantId));
  return rows.map(toRouteDto);
}

export async function createAlarmRouteRule(
  db: Db,
  input: {
    orgId: string;
    plantId: string;
    body: z.infer<typeof RouteCreateBody>;
  },
): Promise<RouteDto> {
  const primary = await db
    .select()
    .from(notifyPeople)
    .where(
      and(
        eq(notifyPeople.id, input.body.primaryPersonId),
        eq(notifyPeople.plantId, input.plantId),
      ),
    )
    .then((rows) => rows[0]);
  if (!primary) throw Object.assign(new Error("Primary person not found"), { statusCode: 400 });

  const [row] = await db
    .insert(alarmRouteRules)
    .values({
      orgId: input.orgId,
      plantId: input.plantId,
      scope: input.body.scope,
      target: input.body.target,
      label: input.body.label,
      primaryPersonId: input.body.primaryPersonId,
      backupPersonIds: input.body.backupPersonIds,
      severityMin: input.body.severityMin,
    })
    .returning();
  return toRouteDto(row!);
}

export async function updateAlarmRouteRule(
  db: Db,
  input: {
    plantId: string;
    ruleId: string;
    body: z.infer<typeof RoutePatchBody>;
  },
): Promise<RouteDto | null> {
  const existing = await db
    .select()
    .from(alarmRouteRules)
    .where(
      and(
        eq(alarmRouteRules.id, input.ruleId),
        eq(alarmRouteRules.plantId, input.plantId),
      ),
    )
    .then((rows) => rows[0]);
  if (!existing) return null;

  if (input.body.primaryPersonId) {
    const primary = await db
      .select()
      .from(notifyPeople)
      .where(
        and(
          eq(notifyPeople.id, input.body.primaryPersonId),
          eq(notifyPeople.plantId, input.plantId),
        ),
      )
      .then((rows) => rows[0]);
    if (!primary) {
      throw Object.assign(new Error("Primary person not found"), {
        statusCode: 400,
      });
    }
  }

  const patch: Partial<typeof alarmRouteRules.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (input.body.scope !== undefined) patch.scope = input.body.scope;
  if (input.body.target !== undefined) patch.target = input.body.target;
  if (input.body.label !== undefined) patch.label = input.body.label;
  if (input.body.primaryPersonId !== undefined) {
    patch.primaryPersonId = input.body.primaryPersonId;
  }
  if (input.body.backupPersonIds !== undefined) {
    patch.backupPersonIds = input.body.backupPersonIds;
  }
  if (input.body.severityMin !== undefined) {
    patch.severityMin = input.body.severityMin;
  }

  const [row] = await db
    .update(alarmRouteRules)
    .set(patch)
    .where(eq(alarmRouteRules.id, input.ruleId))
    .returning();
  return toRouteDto(row!);
}

export async function deleteAlarmRouteRule(
  db: Db,
  input: { plantId: string; ruleId: string },
): Promise<boolean> {
  const deleted = await db
    .delete(alarmRouteRules)
    .where(
      and(
        eq(alarmRouteRules.id, input.ruleId),
        eq(alarmRouteRules.plantId, input.plantId),
      ),
    )
    .returning({ id: alarmRouteRules.id });
  return deleted.length > 0;
}
