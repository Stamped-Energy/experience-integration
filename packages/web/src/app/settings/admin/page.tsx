"use client";

import { AppShell } from "@/components/shell/AppShell";
import { StaffPlantTools } from "@/components/settings/StaffPlantTools";
import { PageHead, Panel, StatusChip } from "@/components/ui/primitives";
import { DEMO_SHELL_ROLE, connectionFixture } from "@/lib/plant-catalog";
import { formatIstDateTime } from "@/lib/format";
import { usePlant } from "@/lib/plant-context";

type MemberRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastActive: string;
};

type AuditRow = {
  id: string;
  action: string;
  actor: string;
  detail: string;
  at: string;
};

/** Empty until L6 members/audit APIs are wired — keep panel chrome. */
const members: MemberRow[] = [];
const auditEvents: AuditRow[] = [];

export default function AdminSettingsPage() {
  const { activePlant } = usePlant();

  return (
    <AppShell
      active="admin"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Admin"
      contextSummary={[`${members.length} members`, activePlant.orgName]}
      criticalAlarmCount={0}
    >
      <PageHead eyebrow="Admin" title="Organization admin" />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <StaffPlantTools />

        <Panel>
          <h2 style={{ margin: "0 0 12px", fontFamily: "var(--forge-font-display)", fontSize: 16 }}>
            Memberships · {activePlant.plantName}
          </h2>
          {members.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
              No membership rows from upstream yet.
            </p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
              {members.map((m) => (
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
          )}
        </Panel>

        <Panel>
          <h2 style={{ margin: "0 0 12px", fontFamily: "var(--forge-font-display)", fontSize: 16 }}>
            Recent audit events
          </h2>
          {auditEvents.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
              No audit events from upstream yet.
            </p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
              {auditEvents.map((e) => (
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
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
