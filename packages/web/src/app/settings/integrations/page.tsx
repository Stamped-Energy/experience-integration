"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyUpstreamState } from "@/components/ui/SourceIndicator";
import {
  GhostButton,
  PageHead,
  Panel,
  PrimaryButton,
  StatusChip,
  ToastRegion,
} from "@/components/ui/primitives";
import { useAuth } from "@/lib/auth-context";
import { useDataSource } from "@/lib/data-source-context";
import {
  createApiKey,
  createWebhook,
  getEntraStatus,
  getWhatsAppStatus,
  listApiKeys,
  listWebhooks,
  revokeApiKey,
  testWebhook,
  testWhatsAppSend,
  type ApiKeyItem,
  type EntraStatus,
  type WebhookItem,
  type WhatsAppStatus,
} from "@/lib/integrations-api";
import { usePlant } from "@/lib/plant-context";
import { connectionFromProbe, toShellRole } from "@/lib/shell-session";
import { formatIstDateTime } from "@/lib/format";

const SCOPE_LABELS: Record<string, string> = {
  "ledger:read": "Read savings data",
  "events:read": "Read live events",
  "alarms:read": "Read alarms",
  "prescriptions:read": "Read prescriptions",
};

const DEFAULT_SCOPES = ["alarms:read", "events:read", "ledger:read"];

export default function IntegrationsSettingsPage() {
  const { activePlant } = usePlant();
  const { membershipRole } = useAuth();
  const { probe } = useDataSource();

  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [entra, setEntra] = useState<EntraStatus | null>(null);
  const [whatsapp, setWhatsapp] = useState<WhatsAppStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [keyName, setKeyName] = useState("");
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState<string | null>(null);
  const [waPhone, setWaPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<"good" | "critical">("good");

  const flash = (msg: string, tone: "good" | "critical" = "good") => {
    setToastTone(tone);
    setToast(msg);
  };

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [k, w, e, wa] = await Promise.all([
        listApiKeys(),
        listWebhooks(),
        getEntraStatus(),
        getWhatsAppStatus(),
      ]);
      setKeys(k);
      setWebhooks(w);
      setEntra(e);
      setWhatsapp(wa);
    } catch (err) {
      setKeys([]);
      setWebhooks([]);
      setEntra(null);
      setWhatsapp(null);
      setLoadError(
        err instanceof Error ? err.message : "Integrations APIs unavailable",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function onCreateKey(e: React.FormEvent) {
    e.preventDefault();
    if (!keyName.trim()) return;
    setBusy(true);
    try {
      const created = await createApiKey({
        name: keyName.trim(),
        scopes: DEFAULT_SCOPES,
      });
      setCreatedSecret(created.api_key);
      setKeyName("");
      flash("API key created — copy it now; it will not be shown again");
      await reload();
    } catch (err) {
      flash(err instanceof Error ? err.message : "Create key failed", "critical");
    } finally {
      setBusy(false);
    }
  }

  async function onRevokeKey(id: string) {
    setBusy(true);
    try {
      await revokeApiKey(id);
      flash("API key revoked");
      await reload();
    } catch (err) {
      flash(err instanceof Error ? err.message : "Revoke failed", "critical");
    } finally {
      setBusy(false);
    }
  }

  async function onCreateWebhook(e: React.FormEvent) {
    e.preventDefault();
    if (!webhookUrl.trim()) return;
    setBusy(true);
    try {
      const created = await createWebhook({ url: webhookUrl.trim() });
      setWebhookSecret(created.secret);
      setWebhookUrl("");
      flash("Webhook created — copy the signing secret now");
      await reload();
    } catch (err) {
      flash(err instanceof Error ? err.message : "Create webhook failed", "critical");
    } finally {
      setBusy(false);
    }
  }

  async function onTestWebhook(id: string) {
    setBusy(true);
    try {
      const result = await testWebhook(id);
      flash(`Test delivery ${result.delivery_id.slice(0, 8)}… queued`);
    } catch (err) {
      flash(err instanceof Error ? err.message : "Test failed", "critical");
    } finally {
      setBusy(false);
    }
  }

  async function onTestWhatsApp(e: React.FormEvent) {
    e.preventDefault();
    if (!waPhone.trim()) return;
    setBusy(true);
    try {
      const result = await testWhatsAppSend({
        phone: waPhone.trim(),
        template: "issue",
      });
      flash(`WhatsApp test logged (${result.log_id.slice(0, 8)}…)`);
      await reload();
    } catch (err) {
      flash(err instanceof Error ? err.message : "WhatsApp test failed", "critical");
    } finally {
      setBusy(false);
    }
  }

  const activeKeys = keys.filter((k) => !k.revoked_at);

  return (
    <AppShell
      active="integrations"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      role={toShellRole(membershipRole)}
      connection={connectionFromProbe(probe)}
      screenTitle="Integrations"
      contextSummary={["Connections & exports", activePlant.plantName]}
      criticalAlarmCount={0}
    >
      <PageHead eyebrow="Admin" title="Integrations" />
      {loading ? (
        <p style={{ margin: 0, fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
          Loading integrations…
        </p>
      ) : loadError ? (
        <EmptyUpstreamState title="Integrations unavailable" detail={loadError} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel>
            <h2 style={{ margin: 0, fontFamily: "var(--forge-font-display)", fontSize: 16 }}>
              API keys
            </h2>
            <p style={{ margin: "8px 0 12px", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
              Keys for approved integrations. The full key is shown only once at creation.
            </p>
            <form
              onSubmit={(e) => void onCreateKey(e)}
              style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}
            >
              <input
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="Key name"
                style={{
                  flex: "1 1 180px",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--forge-outline-variant)",
                }}
              />
              <PrimaryButton type="submit" disabled={busy || !keyName.trim()}>
                Create key
              </PrimaryButton>
            </form>
            {createdSecret ? (
              <p
                role="status"
                style={{
                  margin: "0 0 12px",
                  padding: 10,
                  borderRadius: 8,
                  background: "var(--forge-surface-container-low)",
                  fontSize: 12,
                  wordBreak: "break-all",
                  fontFamily: "var(--forge-font-mono, monospace)",
                }}
              >
                {createdSecret}
              </p>
            ) : null}
            {activeKeys.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
                No active API keys.
              </p>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
                {activeKeys.map((k) => (
                  <li
                    key={k.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                      paddingBottom: 10,
                      borderBottom: "1px solid var(--forge-outline-variant)",
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontWeight: 700 }}>{k.name}</p>
                      <p
                        className="tabular"
                        style={{
                          margin: "4px 0 0",
                          fontSize: 12,
                          color: "var(--forge-on-surface-variant)",
                        }}
                      >
                        {k.prefix}••• · created {formatIstDateTime(k.created_at)}
                      </p>
                      <p
                        style={{
                          margin: "6px 0 0",
                          fontSize: 12,
                          display: "flex",
                          gap: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        {k.scopes.map((s) => (
                          <StatusChip key={s} tone="info">
                            {SCOPE_LABELS[s] ?? s}
                          </StatusChip>
                        ))}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <StatusChip tone={k.last_used_at ? "good" : "neutral"}>
                        {k.last_used_at
                          ? `Last used ${formatIstDateTime(k.last_used_at)}`
                          : "Never used"}
                      </StatusChip>
                      <GhostButton onClick={() => void onRevokeKey(k.id)} disabled={busy}>
                        Revoke
                      </GhostButton>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel>
            <h2 style={{ margin: 0, fontFamily: "var(--forge-font-display)", fontSize: 16 }}>
              Webhooks
            </h2>
            <p style={{ margin: "8px 0 12px", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
              Outbound delivery with signed payloads. Test sends a `l6.test` event.
            </p>
            <form
              onSubmit={(e) => void onCreateWebhook(e)}
              style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}
            >
              <input
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://example.com/hooks/stamped"
                style={{
                  flex: "1 1 240px",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--forge-outline-variant)",
                }}
              />
              <PrimaryButton type="submit" disabled={busy || !webhookUrl.trim()}>
                Add webhook
              </PrimaryButton>
            </form>
            {webhookSecret ? (
              <p
                role="status"
                style={{
                  margin: "0 0 12px",
                  padding: 10,
                  borderRadius: 8,
                  background: "var(--forge-surface-container-low)",
                  fontSize: 12,
                  wordBreak: "break-all",
                  fontFamily: "var(--forge-font-mono, monospace)",
                }}
              >
                Signing secret (once): {webhookSecret}
              </p>
            ) : null}
            {webhooks.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
                No webhooks configured.
              </p>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
                {webhooks.map((w) => (
                  <li
                    key={w.id}
                    style={{
                      paddingBottom: 10,
                      borderBottom: "1px solid var(--forge-outline-variant)",
                    }}
                  >
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <p style={{ margin: 0, fontWeight: 700, wordBreak: "break-all" }}>{w.url}</p>
                      <StatusChip tone={w.enabled ? "good" : "neutral"}>
                        {w.enabled ? "Enabled" : "Disabled"}
                      </StatusChip>
                      <GhostButton onClick={() => void onTestWebhook(w.id)} disabled={busy}>
                        Send test
                      </GhostButton>
                    </div>
                    <p
                      style={{
                        margin: "6px 0 0",
                        fontSize: 12,
                        color: "var(--forge-on-surface-variant)",
                      }}
                    >
                      Filters:{" "}
                      {w.event_filters?.length
                        ? w.event_filters.join(", ")
                        : "all events"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel>
            <h2 style={{ margin: 0, fontFamily: "var(--forge-font-display)", fontSize: 16 }}>
              Microsoft sign-in
            </h2>
            <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
              {entra?.note ??
                "Optional single sign-on with Microsoft Entra. Access and roles are managed in Stamped."}
            </p>
            <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <StatusChip tone={entra?.enabled ? "good" : "neutral"}>
                {entra?.enabled ? "Entra enabled" : "Not connected"}
              </StatusChip>
              {entra?.tenant_id ? (
                <StatusChip tone="info">Tenant configured</StatusChip>
              ) : (
                <StatusChip tone="info">Tenant pending setup</StatusChip>
              )}
              {entra?.local_auth_coexists ? (
                <StatusChip tone="neutral">Local auth coexists</StatusChip>
              ) : null}
            </div>
          </Panel>

          <Panel>
            <h2 style={{ margin: 0, fontFamily: "var(--forge-font-display)", fontSize: 16 }}>
              WhatsApp
            </h2>
            <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
              Meta Cloud API status for this deployment. Test send uses dry-run when not fully
              configured.
            </p>
            <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <StatusChip tone={whatsapp?.configured ? "good" : "warning"}>
                {whatsapp?.configured ? "Credentials set" : "Not fully configured"}
              </StatusChip>
              <StatusChip tone="info">Mode: {whatsapp?.mode ?? "unknown"}</StatusChip>
            </div>
            <form
              onSubmit={(e) => void onTestWhatsApp(e)}
              style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}
            >
              <input
                value={waPhone}
                onChange={(e) => setWaPhone(e.target.value)}
                placeholder="+9198XXXXXXXX"
                style={{
                  flex: "1 1 180px",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--forge-outline-variant)",
                }}
              />
              <PrimaryButton type="submit" disabled={busy || !waPhone.trim()}>
                Test send
              </PrimaryButton>
            </form>
            {whatsapp?.recent?.length ? (
              <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "grid", gap: 6 }}>
                {whatsapp.recent.slice(0, 5).map((log) => (
                  <li
                    key={log.id}
                    style={{ fontSize: 12, color: "var(--forge-on-surface-variant)" }}
                  >
                    {log.template_id} · {log.status} · {log.mode} ·{" "}
                    {formatIstDateTime(log.created_at)}
                  </li>
                ))}
              </ul>
            ) : null}
          </Panel>

          <Panel>
            <h2 style={{ margin: 0, fontFamily: "var(--forge-font-display)", fontSize: 16 }}>
              Power BI
            </h2>
            <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
              Scheduled Power BI sync is not wired in this build.
            </p>
            <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <StatusChip tone="warning">Unavailable</StatusChip>
            </div>
          </Panel>
        </div>
      )}
      <ToastRegion message={toast} tone={toastTone} />
    </AppShell>
  );
}
