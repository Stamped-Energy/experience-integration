import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  uniqueIndex,
  index,
  bigserial,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { authSchema } from "./auth-schema.js";

export {
  user,
  session,
  account,
  verification,
  twoFactor,
  authSchema,
} from "./auth-schema.js";

/** Organization (tenant root). */
export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (t) => [uniqueIndex("organizations_slug_uidx").on(t.slug)]);

export const plants = pgTable(
  "plants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    externalPlantId: text("external_plant_id").notNull(),
    name: text("name").notNull(),
    timezone: text("timezone").notNull().default("Asia/Kolkata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("plants_org_external_uidx").on(t.orgId, t.externalPlantId),
  ],
);

/** User preference bag — active plant, nav pins, etc. */
export const userPreferences = pgTable(
  "user_preferences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    activePlantId: uuid("active_plant_id").references(() => plants.id, {
      onDelete: "set null",
    }),
    prefs: jsonb("prefs").$type<Record<string, unknown>>().notNull().default({}),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("user_preferences_user_org_uidx").on(t.userId, t.orgId)],
);

/** Append-only audit trail (no PII payloads). */
export const auditEvents = pgTable("audit_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, {
    onDelete: "set null",
  }),
  actorUserId: text("actor_user_id"),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id"),
  metadata: jsonb("metadata")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * L6 product membership — plant-scoped RBAC role (ADR-023).
 * Distinct from Better Auth plugin `user.role` (admin|user).
 */
export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("memberships_user_org_uidx").on(t.userId, t.orgId),
  ],
);

export const plantMemberships = pgTable(
  "plant_memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    plantId: uuid("plant_id")
      .notNull()
      .references(() => plants.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("plant_memberships_member_plant_uidx").on(
      t.membershipId,
      t.plantId,
    ),
  ],
);

/** Per-plant L5 poll cursor — advanced only after durable append. */
export const l5EventCursors = pgTable(
  "l5_event_cursors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgExternalId: text("org_external_id").notNull(),
    plantExternalId: text("plant_external_id").notNull(),
    cursor: text("cursor").notNull().default(""),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("l5_event_cursors_org_plant_uidx").on(
      t.orgExternalId,
      t.plantExternalId,
    ),
  ],
);

/** Append-only L5 event mirror — dedupe_key unique. SSE resumes via id/seq. */
export const l5Events = pgTable(
  "l5_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgExternalId: text("org_external_id").notNull(),
    plantExternalId: text("plant_external_id").notNull(),
    eventId: text("event_id").notNull(),
    dedupeKey: text("dedupe_key").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    /** Monotonic order for Last-Event-ID resume. */
    seq: bigserial("seq", { mode: "number" }).notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    ingestedAt: timestamp("ingested_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("l5_events_dedupe_uidx").on(t.dedupeKey),
    uniqueIndex("l5_events_event_id_uidx").on(t.eventId),
    index("l5_events_plant_seq_idx").on(
      t.orgExternalId,
      t.plantExternalId,
      t.seq,
    ),
  ],
);

/** Sustainability / ledger report job — approval-gated before external send. */
export const reportJobs = pgTable(
  "report_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    plantId: uuid("plant_id")
      .notNull()
      .references(() => plants.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    state: text("state").notNull().default("queued"),
    dedupeKey: text("dedupe_key").notNull(),
    bossJobId: text("boss_job_id"),
    artifactHtml: text("artifact_html"),
    error: text("error"),
    createdBy: text("created_by"),
    approvedBy: text("approved_by"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    attemptCount: integer("attempt_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("report_jobs_dedupe_uidx").on(t.dedupeKey),
    index("report_jobs_plant_state_idx").on(t.plantId, t.state),
  ],
);

/** Org-scoped public API keys — store hash only. */
export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    prefix: text("prefix").notNull(),
    secretHash: text("secret_hash").notNull(),
    scopes: jsonb("scopes").$type<string[]>().notNull().default([]),
    createdBy: text("created_by"),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("api_keys_prefix_uidx").on(t.prefix),
    index("api_keys_org_idx").on(t.orgId),
  ],
);

export const webhookEndpoints = pgTable(
  "webhook_endpoints",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    secret: text("secret").notNull(),
    eventFilters: jsonb("event_filters").$type<string[]>().notNull().default(["*"]),
    enabled: boolean("enabled").notNull().default(true),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("webhook_endpoints_org_idx").on(t.orgId)],
);

export const webhookDeliveries = pgTable(
  "webhook_deliveries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    endpointId: uuid("endpoint_id")
      .notNull()
      .references(() => webhookEndpoints.id, { onDelete: "cascade" }),
    eventId: text("event_id").notNull(),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    status: text("status").notNull().default("pending"),
    attemptCount: integer("attempt_count").notNull().default(0),
    lastError: text("last_error"),
    responseStatus: integer("response_status"),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("webhook_deliveries_endpoint_idx").on(t.endpointId, t.status),
    uniqueIndex("webhook_deliveries_event_endpoint_uidx").on(
      t.endpointId,
      t.eventId,
    ),
  ],
);

export const powerbiCheckpoints = pgTable(
  "powerbi_checkpoints",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    plantId: uuid("plant_id")
      .notNull()
      .references(() => plants.id, { onDelete: "cascade" }),
    datasetId: text("dataset_id").notNull(),
    cursor: text("cursor").notNull().default(""),
    rowsPushed: integer("rows_pushed").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("powerbi_checkpoints_org_plant_uidx").on(
      t.orgId,
      t.plantId,
      t.datasetId,
    ),
  ],
);

export const productTelemetry = pgTable(
  "product_telemetry",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: text("org_id"),
    plantId: text("plant_id"),
    role: text("role"),
    eventName: text("event_name").notNull(),
    properties: jsonb("properties")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("product_telemetry_event_idx").on(t.eventName, t.createdAt)],
);

/**
 * Notify-people roster — plant-scoped assignees for WhatsApp + Rx assign.
 * Store E.164 phone; API responses mask by default (phoneMasked).
 */
export const notifyPeople = pgTable(
  "notify_people",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    plantId: uuid("plant_id")
      .notNull()
      .references(() => plants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    role: text("role").notNull(),
    phoneE164: text("phone_e164").notNull(),
    areas: jsonb("areas").$type<string[]>().notNull().default([]),
    assetIds: jsonb("asset_ids").$type<string[]>().notNull().default([]),
    skills: jsonb("skills").$type<string[]>().notNull().default([]),
    whatsappEnabled: boolean("whatsapp_enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("notify_people_plant_idx").on(t.plantId),
    index("notify_people_org_idx").on(t.orgId),
  ],
);

/** Alarm routing: area/asset → primary + backup notify people. */
export const alarmRouteRules = pgTable(
  "alarm_route_rules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    plantId: uuid("plant_id")
      .notNull()
      .references(() => plants.id, { onDelete: "cascade" }),
    scope: text("scope").notNull(),
    target: text("target").notNull(),
    label: text("label").notNull(),
    primaryPersonId: uuid("primary_person_id")
      .notNull()
      .references(() => notifyPeople.id, { onDelete: "restrict" }),
    backupPersonIds: jsonb("backup_person_ids")
      .$type<string[]>()
      .notNull()
      .default([]),
    severityMin: text("severity_min").notNull().default("warning"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("alarm_route_rules_plant_scope_target_uidx").on(
      t.plantId,
      t.scope,
      t.target,
    ),
    index("alarm_route_rules_plant_idx").on(t.plantId),
  ],
);

/** Outbound WhatsApp delivery log (dry-run and live). */
export const whatsappNotificationLog = pgTable(
  "whatsapp_notification_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    plantId: uuid("plant_id")
      .notNull()
      .references(() => plants.id, { onDelete: "cascade" }),
    personId: uuid("person_id").references(() => notifyPeople.id, {
      onDelete: "set null",
    }),
    templateId: text("template_id").notNull(),
    toPhoneE164: text("to_phone_e164").notNull(),
    mode: text("mode").notNull(),
    status: text("status").notNull(),
    providerMessageId: text("provider_message_id"),
    error: text("error"),
    contextType: text("context_type"),
    contextId: text("context_id"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("whatsapp_notification_log_plant_idx").on(t.plantId, t.createdAt),
    index("whatsapp_notification_log_person_idx").on(t.personId),
  ],
);

export const schema = {
  ...authSchema,
  organizations,
  plants,
  userPreferences,
  auditEvents,
  memberships,
  plantMemberships,
  l5EventCursors,
  l5Events,
  reportJobs,
  apiKeys,
  webhookEndpoints,
  webhookDeliveries,
  powerbiCheckpoints,
  productTelemetry,
  notifyPeople,
  alarmRouteRules,
  whatsappNotificationLog,
};
