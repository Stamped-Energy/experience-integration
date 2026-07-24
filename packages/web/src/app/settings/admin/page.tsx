import { AppShell } from "@/components/shell/AppShell";
import { PageHead, Panel, StatusChip } from "@/components/ui/primitives";
import {
  DEMO_SHELL_ROLE,
  DEMO_PLANT,
  auditEventsFixture,
  connectionFixture,
  membersFixture,
} from "@/fixtures/demo";
import { formatIstDateTime } from "@/lib/format";
export default function AdminSettingsPage() {
  return (
    <AppShell
      active="admin"
      plantName={DEMO_PLANT.plantName}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Admin"
      contextSummary={[
        `${membersFixture.length} members`,
        DEMO_PLANT.orgName,
      ]}
      criticalAlarmCount={0}
    >
      <PageHead eyebrow="Admin" title="Organization admin" />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Panel>
          <h2 style={{ margin: "0 0 12px", fontFamily: "var(--forge-font-display)", fontSize: 16 }}>
            Memberships · {DEMO_PLANT.plantName}
          </h2>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
            {membersFixture.map((m) => (
              <li
                key={m.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  alignItems: "center",
                  paddingBottom: 10,
                  borderBottom: "1px solid var(--forge-outline-variant)",
                }}
              >
                <div>
                  <p style={{ margin: 0, fontWeight: 700 }}>{m.name}</p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 12,
                      color: "var(--forge-on-surface-variant)",
                    }}
                  >
                    {m.email}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <StatusChip tone="info">{m.role.replaceAll("_", " ")}</StatusChip>
                  <StatusChip tone={m.status === "active" ? "good" : "warning"}>
                    {m.status}
                  </StatusChip>
                  <span
                    className="tabular"
                    style={{ fontSize: 12, color: "var(--forge-on-surface-variant)" }}
                  >
                    {formatIstDateTime(m.lastActive)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <h2 style={{ margin: "0 0 12px", fontFamily: "var(--forge-font-display)", fontSize: 16 }}>
            Recent audit events
          </h2>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
            {auditEventsFixture.map((e) => (
              <li
                key={e.id}
                style={{
                  paddingBottom: 10,
                  borderBottom: "1px solid var(--forge-outline-variant)",
                }}
              >
                <p style={{ margin: 0, fontWeight: 700 }}>
                  {e.action} · {e.actor}
                </p>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 12,
                    color: "var(--forge-on-surface-variant)",
                  }}
                >
                  {e.detail} · {formatIstDateTime(e.at)}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}
