CREATE TABLE IF NOT EXISTS "notify_people" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "plant_id" uuid NOT NULL REFERENCES "plants"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "role" text NOT NULL,
  "phone_e164" text NOT NULL,
  "areas" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "asset_ids" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "skills" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "whatsapp_enabled" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notify_people_plant_idx" ON "notify_people" ("plant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notify_people_org_idx" ON "notify_people" ("org_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alarm_route_rules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "plant_id" uuid NOT NULL REFERENCES "plants"("id") ON DELETE CASCADE,
  "scope" text NOT NULL,
  "target" text NOT NULL,
  "label" text NOT NULL,
  "primary_person_id" uuid NOT NULL REFERENCES "notify_people"("id") ON DELETE RESTRICT,
  "backup_person_ids" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "severity_min" text NOT NULL DEFAULT 'warning',
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "alarm_route_rules_plant_scope_target_uidx" ON "alarm_route_rules" ("plant_id", "scope", "target");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alarm_route_rules_plant_idx" ON "alarm_route_rules" ("plant_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "whatsapp_notification_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "plant_id" uuid NOT NULL REFERENCES "plants"("id") ON DELETE CASCADE,
  "person_id" uuid REFERENCES "notify_people"("id") ON DELETE SET NULL,
  "template_id" text NOT NULL,
  "to_phone_e164" text NOT NULL,
  "mode" text NOT NULL,
  "status" text NOT NULL,
  "provider_message_id" text,
  "error" text,
  "context_type" text,
  "context_id" text,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "whatsapp_notification_log_plant_idx" ON "whatsapp_notification_log" ("plant_id", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "whatsapp_notification_log_person_idx" ON "whatsapp_notification_log" ("person_id");
