import { createHmac, timingSafeEqual } from "node:crypto";
import type { WhatsAppTemplateId } from "./templates.js";

export type WhatsAppMode = "dry_run" | "live";

export type WhatsAppSendInput = {
  to: string;
  template: WhatsAppTemplateId;
  languageCode?: string;
  components?: unknown[];
};

export type WhatsAppSendResult = {
  mode: WhatsAppMode;
  status: "accepted" | "dry_run" | "failed";
  providerMessageId?: string;
  error?: string;
};

export type WhatsAppClientConfig = {
  mode: WhatsAppMode;
  token?: string;
  phoneNumberId?: string;
  apiVersion?: string;
  fetchImpl?: typeof fetch;
};

export function resolveWhatsAppMode(env: {
  WHATSAPP_MODE?: string;
  META_WA_TOKEN?: string;
  META_WA_PHONE_NUMBER_ID?: string;
}): WhatsAppMode {
  if (env.WHATSAPP_MODE === "live") {
    if (env.META_WA_TOKEN && env.META_WA_PHONE_NUMBER_ID) return "live";
    return "dry_run";
  }
  if (env.WHATSAPP_MODE === "dry_run") return "dry_run";
  // Auto: live only when credentials present
  if (env.META_WA_TOKEN && env.META_WA_PHONE_NUMBER_ID) return "live";
  return "dry_run";
}

export function createWhatsAppClient(config: WhatsAppClientConfig) {
  const fetchImpl = config.fetchImpl ?? fetch;
  const apiVersion = config.apiVersion ?? "v21.0";

  return {
    mode: config.mode,
    async sendTemplate(input: WhatsAppSendInput): Promise<WhatsAppSendResult> {
      if (config.mode === "dry_run") {
        return {
          mode: "dry_run",
          status: "dry_run",
          providerMessageId: `dryrun_${Date.now()}`,
        };
      }
      if (!config.token || !config.phoneNumberId) {
        return {
          mode: "live",
          status: "failed",
          error: "META_WA_TOKEN / META_WA_PHONE_NUMBER_ID missing",
        };
      }
      const url = `https://graph.facebook.com/${apiVersion}/${config.phoneNumberId}/messages`;
      try {
        const res = await fetchImpl(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: input.to.replace(/^\+/, ""),
            type: "template",
            template: {
              name: input.template,
              language: { code: input.languageCode ?? "en" },
              components: input.components ?? [],
            },
          }),
        });
        const body = (await res.json().catch(() => ({}))) as {
          messages?: Array<{ id?: string }>;
          error?: { message?: string };
        };
        if (!res.ok) {
          return {
            mode: "live",
            status: "failed",
            error: body.error?.message ?? `Meta HTTP ${res.status}`,
          };
        }
        return {
          mode: "live",
          status: "accepted",
          providerMessageId: body.messages?.[0]?.id,
        };
      } catch (err) {
        return {
          mode: "live",
          status: "failed",
          error: err instanceof Error ? err.message : "send failed",
        };
      }
    },
  };
}

export type WhatsAppClient = ReturnType<typeof createWhatsAppClient>;

/** Verify Meta X-Hub-Signature-256 (sha256=hex). */
export function verifyMetaSignature(
  rawBody: string | Buffer,
  signatureHeader: string | undefined,
  appSecret: string,
): boolean {
  if (!signatureHeader || !appSecret) return false;
  const expected =
    "sha256=" +
    createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
