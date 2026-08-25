/** ADR-021 P0 utility templates (Meta Cloud API names). */
export const WHATSAPP_TEMPLATES = {
  issue: "issue",
  reminder: "reminder",
  escalation: "escalation",
  ops_verified: "ops_verified",
} as const;

export type WhatsAppTemplateId = keyof typeof WHATSAPP_TEMPLATES;

export const WHATSAPP_BUTTON_ALLOWLIST = [
  "ack",
  "done",
  "defer",
  "escalate",
] as const;

export type WhatsAppButtonId = (typeof WHATSAPP_BUTTON_ALLOWLIST)[number];

export function isAllowedWhatsAppButton(id: string): id is WhatsAppButtonId {
  return (WHATSAPP_BUTTON_ALLOWLIST as readonly string[]).includes(id);
}
