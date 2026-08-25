"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { StaffPlantTools } from "@/components/settings/StaffPlantTools";
import { EmptyUpstreamState } from "@/components/ui/SourceIndicator";
import { PageHead, Panel, PrimaryButton, StatusChip } from "@/components/ui/primitives";
import {
  addOrgMember,
  inviteUser,
  listAuditEvents,
  listOrgMembers,
  type AuditEvent,
  type OrgMember,
} from "@/lib/admin-api";
import { useAuth } from "@/lib/auth-context";
import { useDataSource } from "@/lib/data-source-context";
import { formatIstDateTime } from "@/lib/format";
import { usePlant } from "@/lib/plant-context";
import { connectionFromProbe, toShellRole } from "@/lib/shell-session";
import type { Role } from "@/lib/types";

const INVITE_ROLES: Role[] = [
  "operator",
  "supervisor",
  "plant_head",
  "energy_manager",
  "admin",
];

export default function AdminSettingsPage() {
  const { activePlant } = usePlant();
  const { user, orgId, plantId, membershipRole, signOut } = useAuth();
  const { probe } = useDataSource();
  const router = useRouter();

  const [members, setMembers] = useState<OrgMember[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("operator");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!orgId) {
      setMembers([]);
      setAuditEvents([]);
      setLoadError("No organization on this session.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const [m, a] = await Promise.all([
        listOrgMembers(orgId),
        listAuditEvents(orgId, 40),
      ]);
      setMembers(m);
      setAuditEvents(a);
    } catch (err) {
      setMembers([]);
      setAuditEvents([]);
      setLoadError(err instanceof Error ? err.message : "Admin APIs unavailable");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const onSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  const onInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !plantId) {
      setInviteMsg("Need org and plant on session before inviting.");
      return;
    }
    setInviteBusy(true);
    setInviteMsg(null);
    try {
      const invited = await inviteUser({
        email: inviteEmail.trim(),
        name: inviteName.trim(),
      });
      await addOrgMember(orgId, {
        userId: invited.user.id,
        role: inviteRole,
        plantIds: [plantId],
      });
      setInviteName("");
      setInviteEmail("");
      setInviteMsg(`Invited ${invited.user.email} as ${inviteRole.replaceAll("_", " ")}`);
      await reload();
    } catch (err) {
      setInviteMsg(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setInviteBusy(false);
    }
  };

  return (
    <AppShell
      active="admin"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      role={toShellRole(membershipRole)}
      connection={connectionFromProbe(probe)}
      screenTitle="Admin"
      contextSummary={[
        loading ? "Loading…" : `${members.length} members`,
        activePlant.orgName,
      ]}
      criticalAlarmCount={0}
    >
      <PageHead eyebrow="Admin" title="Organization admin" />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Panel>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <p className="forge-eyebrow" style={{ margin: 0 }}>
                Signed in
              </p>
              <h2
                style={{
                  margin: "4px 0 0",
                  fontFamily: "var(--forge-font-display)",
                  fontSize: 16,
                }}
              >
                {user?.name || "Account"}
              </h2>
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: 13,
                  color: "var(--forge-on-surface-variant)",
                }}
              >
                {user?.email}
                {membershipRole ? ` · ${membershipRole.replaceAll("_", " ")}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void onSignOut()}
              style={{
                alignSelf: "flex-start",
                border: "1px solid var(--forge-outline-variant)",
                background: "transparent",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                color: "var(--forge-on-surface)",
              }}
            >
              Sign out
            </button>
          </div>
        </Panel>

        <StaffPlantTools />

        <Panel>
          <h2
            style={{
              margin: "0 0 12px",
              fontFamily: "var(--forge-font-display)",
              fontSize: 16,
            }}
          >
            Invite member
          </h2>
          <form
            onSubmit={(e) => void onInvite(e)}
            style={{ display: "grid", gap: 10, maxWidth: 420 }}
          >
            <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
              Name
              <input
                required
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--forge-outline-variant)",
                }}
              />
            </label>
            <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
              Email
              <input
                required
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--forge-outline-variant)",
                }}
              />
            </label>
            <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
              Role
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as Role)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--forge-outline-variant)",
                }}
              >
                {INVITE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <PrimaryButton type="submit" disabled={inviteBusy || !orgId || !plantId}>
              {inviteBusy ? "Sending…" : "Send invite & grant membership"}
            </PrimaryButton>
            {inviteMsg ? (
              <p style={{ margin: 0, fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
                {inviteMsg}
              </p>
            ) : null}
          </form>
        </Panel>

        <Panel>
          <h2
            style={{
              margin: "0 0 12px",
              fontFamily: "var(--forge-font-display)",
              fontSize: 16,
            }}
          >
            Memberships · {activePlant.plantName}
          </h2>
          {loading ? (
            <p style={{ margin: 0, fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
              Loading members…
            </p>
          ) : loadError ? (
            <EmptyUpstreamState title="Members unavailable" detail={loadError} />
          ) : members.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
              No membership rows for this organization yet.
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
                    <p style={{ margin: 0, fontWeight: 700 }}>
                      User {m.userId.slice(0, 8)}…
                    </p>
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 12,
                        color: "var(--forge-on-surface-variant)",
                        fontFamily: "var(--forge-font-mono, monospace)",
                      }}
                    >
                      {m.userId}
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
                      {m.plantIds.length} plant{m.plantIds.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <h2
            style={{
              margin: "0 0 12px",
              fontFamily: "var(--forge-font-display)",
              fontSize: 16,
            }}
          >
            Recent audit events
          </h2>
          {loading ? (
            <p style={{ margin: 0, fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
              Loading audit…
            </p>
          ) : loadError ? (
            <EmptyUpstreamState title="Audit unavailable" detail={loadError} />
          ) : auditEvents.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
              No audit events for this organization yet.
            </p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
              {auditEvents.map((ev) => (
                <li
                  key={ev.id}
                  style={{
                    paddingBottom: 10,
                    borderBottom: "1px solid var(--forge-outline-variant)",
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 600 }}>{ev.action}</p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 12,
                      color: "var(--forge-on-surface-variant)",
                    }}
                  >
                    {ev.actorUserId ? `actor ${ev.actorUserId.slice(0, 8)}…` : "system"} ·{" "}
                    {ev.resourceType}
                    {ev.resourceId ? ` ${ev.resourceId.slice(0, 8)}…` : ""} ·{" "}
                    {formatIstDateTime(
                      typeof ev.createdAt === "string"
                        ? ev.createdAt
                        : new Date(ev.createdAt).toISOString(),
                    )}
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
