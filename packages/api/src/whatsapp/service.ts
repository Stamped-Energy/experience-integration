import { desc, eq } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { whatsappNotificationLog } from "../db/schema.js";
import {
  createWhatsAppClient,
  resolveWhatsAppMode,
  type WhatsAppClient,
  type WhatsAppSendResult,
} from "./client.js";
import type { WhatsAppTemplateId } from "./templates.js";

export type EnqueueWhatsAppInput = {
  orgId: string;
  plantId: string;
  personId?: string | null;
  toPhoneE164: string;
  template: WhatsAppTemplateId;
  contextType?: string;
  contextId?: string;
  components?: unknown[];
  metadata?: Record<string, unknown>;
};

export type EnqueueWhatsAppResult = {
  logId: string;
  result: WhatsAppSendResult;
};

export function whatsappClientFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): WhatsAppClient {
  const mode = resolveWhatsAppMode({
    WHATSAPP_MODE: env.WHATSAPP_MODE,
    META_WA_TOKEN: env.META_WA_TOKEN,
    META_WA_PHONE_NUMBER_ID: env.META_WA_PHONE_NUMBER_ID,
  });
  return createWhatsAppClient({
    mode,
    token: env.META_WA_TOKEN,
    phoneNumberId: env.META_WA_PHONE_NUMBER_ID,
  });
}

export async function enqueueWhatsAppNotification(
  db: Db,
  input: EnqueueWhatsAppInput,
  client: WhatsAppClient = whatsappClientFromEnv(),
): Promise<EnqueueWhatsAppResult> {
  const result = await client.sendTemplate({
    to: input.toPhoneE164,
    template: input.template,
    components: input.components,
  });

  const [row] = await db
    .insert(whatsappNotificationLog)
    .values({
      orgId: input.orgId,
      plantId: input.plantId,
      personId: input.personId ?? null,
      templateId: input.template,
      toPhoneE164: input.toPhoneE164,
      mode: result.mode,
      status: result.status,
      providerMessageId: result.providerMessageId ?? null,
      error: result.error ?? null,
      contextType: input.contextType ?? null,
      contextId: input.contextId ?? null,
      metadata: input.metadata ?? {},
    })
    .returning();

  return { logId: row!.id, result };
}

export async function listRecentWhatsAppLogs(
  db: Db,
  plantId: string,
  limit = 20,
) {
  return db
    .select()
    .from(whatsappNotificationLog)
    .where(eq(whatsappNotificationLog.plantId, plantId))
    .orderBy(desc(whatsappNotificationLog.createdAt))
    .limit(limit);
}

export function whatsappConnectionStatus(env: NodeJS.ProcessEnv = process.env) {
  const mode = resolveWhatsAppMode({
    WHATSAPP_MODE: env.WHATSAPP_MODE,
    META_WA_TOKEN: env.META_WA_TOKEN,
    META_WA_PHONE_NUMBER_ID: env.META_WA_PHONE_NUMBER_ID,
  });
  return {
    mode,
    configured: Boolean(env.META_WA_TOKEN && env.META_WA_PHONE_NUMBER_ID),
    phone_number_id_set: Boolean(env.META_WA_PHONE_NUMBER_ID),
    verify_token_set: Boolean(env.META_WA_VERIFY_TOKEN),
    app_secret_set: Boolean(env.META_WA_APP_SECRET),
  };
}
