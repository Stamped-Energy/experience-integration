import { bffUrl } from "@/lib/bff";

export type ApiKeyItem = {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

export type WebhookItem = {
  id: string;
  url: string;
  enabled: boolean;
  event_filters: string[] | null;
};

export type EntraStatus = {
  enabled: boolean;
  tenant_id: string | null;
  client_id: string | null;
  mapping: string;
  note: string;
  local_auth_coexists: boolean;
};

export type WhatsAppStatus = {
  mode: string;
  configured: boolean;
  phone_number_id_set: boolean;
  verify_token_set: boolean;
  app_secret_set: boolean;
  recent?: Array<{
    id: string;
    template_id: string;
    status: string;
    mode: string;
    created_at: string;
  }>;
};

async function readProblem(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: string; message?: string };
    return body.detail || body.message || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

export async function listApiKeys(): Promise<ApiKeyItem[]> {
  const res = await fetch(bffUrl("/api/integrations/api-keys"), {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await readProblem(res));
  const body = (await res.json()) as { items?: ApiKeyItem[] };
  return Array.isArray(body.items) ? body.items : [];
}

export async function createApiKey(input: {
  name: string;
  scopes?: string[];
}): Promise<{
  id: string;
  prefix: string;
  scopes: string[];
  api_key: string;
}> {
  const res = await fetch(bffUrl("/api/integrations/api-keys"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readProblem(res));
  return (await res.json()) as {
    id: string;
    prefix: string;
    scopes: string[];
    api_key: string;
  };
}

export async function revokeApiKey(id: string): Promise<void> {
  const res = await fetch(
    bffUrl(`/api/integrations/api-keys/${encodeURIComponent(id)}`),
    { method: "DELETE", credentials: "include" },
  );
  if (!res.ok && res.status !== 204) throw new Error(await readProblem(res));
}

export async function listWebhooks(): Promise<WebhookItem[]> {
  const res = await fetch(bffUrl("/api/integrations/webhooks"), {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await readProblem(res));
  const body = (await res.json()) as { items?: WebhookItem[] };
  return Array.isArray(body.items) ? body.items : [];
}

export async function createWebhook(input: {
  url: string;
  eventFilters?: string[];
}): Promise<{ id: string; url: string; secret: string }> {
  const res = await fetch(bffUrl("/api/integrations/webhooks"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readProblem(res));
  return (await res.json()) as { id: string; url: string; secret: string };
}

export async function testWebhook(
  id: string,
): Promise<{ delivery_id: string; ok?: boolean; status?: string }> {
  const res = await fetch(
    bffUrl(`/api/integrations/webhooks/${encodeURIComponent(id)}/test`),
    { method: "POST", credentials: "include" },
  );
  if (!res.ok) throw new Error(await readProblem(res));
  return (await res.json()) as {
    delivery_id: string;
    ok?: boolean;
    status?: string;
  };
}

export async function getEntraStatus(): Promise<EntraStatus> {
  const res = await fetch(bffUrl("/api/integrations/entra"), {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await readProblem(res));
  return (await res.json()) as EntraStatus;
}

export async function getWhatsAppStatus(): Promise<WhatsAppStatus> {
  const res = await fetch(bffUrl("/api/integrations/whatsapp"), {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await readProblem(res));
  return (await res.json()) as WhatsAppStatus;
}

export async function testWhatsAppSend(input: {
  personId?: string;
  phone?: string;
  template?: string;
}): Promise<{ log_id: string }> {
  const res = await fetch(bffUrl("/api/integrations/whatsapp/test-send"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readProblem(res));
  return (await res.json()) as { log_id: string };
}
