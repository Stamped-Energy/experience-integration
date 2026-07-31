import { AppShell } from "@/components/shell/AppShell";
import { PageHead, Panel, StatusChip } from "@/components/ui/primitives";
import {
  DEMO_SHELL_ROLE,
  DEMO_PLANT,
  apiKeysFixture,
  connectionFixture,
  webhooksFixture,
} from "@/fixtures/demo";

const SCOPE_LABELS: Record<string, string> = {
  "ledger:read": "Read savings data",
  "events:read": "Read live events",
  "alarms:read": "Read alarms",
  "prescriptions:read": "Read prescriptions",
};

const WEBHOOK_STATUS_LABELS: Record<string, string> = {
  delivered: "Delivered",
  pending: "Pending",
  dlq: "Failed - retry pending",
};

export default function IntegrationsSettingsPage() {
  return (
    <AppShell
      active="integrations"
      plantName={DEMO_PLANT.plantName}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Integrations"
      contextSummary={["Connections & exports", DEMO_PLANT.plantName]}
      criticalAlarmCount={0}
    >
      <PageHead eyebrow="Admin" title="Integrations" />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Panel>
          <h2 style={{ margin: 0, fontFamily: "var(--forge-font-display)", fontSize: 16 }}>
            API keys
          </h2>
          <p style={{ margin: "8px 0 12px", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
            Keys for approved integrations. You will only see the full key once when it is created.
          </p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
            {apiKeysFixture.map((k) => (
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
                    {k.prefix}••• · created {k.createdAt}
                  </p>
                  <p style={{ margin: "6px 0 0", fontSize: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {k.scopes.map((s) => (
                      <StatusChip key={s} tone="info">
                        {SCOPE_LABELS[s] ?? s}
                      </StatusChip>
                    ))}
                  </p>
                </div>
                <StatusChip tone={k.lastUsedAt ? "good" : "neutral"}>
                  {k.lastUsedAt ? `Last used ${k.lastUsedAt}` : "Never used"}
                </StatusChip>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <h2 style={{ margin: 0, fontFamily: "var(--forge-font-display)", fontSize: 16 }}>
            Webhooks
          </h2>
          <p style={{ margin: "8px 0 12px", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
            Secure webhook delivery with automatic retries when a destination is temporarily unavailable.
          </p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
            {webhooksFixture.map((w) => (
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
                  <StatusChip
                    tone={
                      w.lastStatus === "delivered"
                        ? "good"
                        : w.lastStatus === "dlq"
                          ? "critical"
                          : "warning"
                    }
                  >
                    {WEBHOOK_STATUS_LABELS[w.lastStatus] ?? w.lastStatus}
                  </StatusChip>
                </div>
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: 12,
                    color: "var(--forge-on-surface-variant)",
                  }}
                >
                  Events: savings confirmed, alarms, prescriptions · Last delivery {w.lastDelivery}
                </p>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <h2 style={{ margin: 0, fontFamily: "var(--forge-font-display)", fontSize: 16 }}>
            Microsoft sign-in
          </h2>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
            Optional single sign-on with Microsoft Entra. Access and roles are managed in Stamped.
          </p>
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <StatusChip tone="neutral">Not connected</StatusChip>
            <StatusChip tone="info">Tenant pending setup</StatusChip>
          </div>
        </Panel>

        <Panel>
          <h2 style={{ margin: 0, fontFamily: "var(--forge-font-display)", fontSize: 16 }}>
            Power BI
          </h2>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
            Scheduled data sync to Power BI. Confirmed savings stay labeled as operations-confirmed until
            matched to utility bills.
          </p>
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <StatusChip tone="good">Last sync: savings ledger Jul MTD</StatusChip>
            <StatusChip tone="warning">Claims: operations-confirmed only</StatusChip>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
