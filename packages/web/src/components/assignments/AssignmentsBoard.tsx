"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createPerson,
  createRoute,
  listPeople,
  listRoutes,
  patchRoute,
  type AlarmRouteDto,
  type NotifyPersonDto,
} from "@/lib/assignments-api";
import type { Role } from "@/lib/types";
import { EmptyUpstreamState } from "@/components/ui/SourceIndicator";
import {
  GhostButton,
  Panel,
  PrimaryButton,
  StatusChip,
  ToastRegion,
} from "@/components/ui/primitives";

const ROLES: Role[] = [
  "operator",
  "supervisor",
  "plant_head",
  "energy_manager",
  "sustainability",
  "cfo",
  "admin",
];

type LoadState = "loading" | "ready" | "unavailable";

/** Admin screen: who owns which area/asset for alarm WhatsApp + Rx assign. */
export function AssignmentsBoard() {
  const [rules, setRules] = useState<AlarmRouteDto[]>([]);
  const [people, setPeople] = useState<NotifyPersonDto[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<"good" | "critical">("good");
  const [editing, setEditing] = useState<string | null>(null);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showAddRoute, setShowAddRoute] = useState(false);
  const [newPerson, setNewPerson] = useState({
    name: "",
    role: "operator" as Role,
    phone: "",
    areas: "",
    skills: "",
    whatsappEnabled: true,
  });
  const [newRoute, setNewRoute] = useState({
    scope: "area" as "area" | "asset",
    target: "",
    label: "",
    primaryPersonId: "",
    severityMin: "warning",
  });

  const reload = useCallback(async () => {
    setLoadState("loading");
    setLoadError(null);
    try {
      const [peopleRes, routesRes] = await Promise.all([
        listPeople(),
        listRoutes(),
      ]);
      setPeople(peopleRes.people);
      setRules(routesRes.routes);
      setLoadState("ready");
    } catch (err) {
      setPeople([]);
      setRules([]);
      setLoadState("unavailable");
      setLoadError(err instanceof Error ? err.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const areas = useMemo(
    () => [...new Set(people.flatMap((p) => p.areas))].sort(),
    [people],
  );

  function flash(message: string, tone: "good" | "critical" = "good") {
    setToastTone(tone);
    setToast(message);
  }

  async function setPrimary(ruleId: string, personId: string) {
    setBusy(true);
    try {
      const route = await patchRoute(ruleId, { primaryPersonId: personId });
      setRules((rows) => rows.map((r) => (r.id === ruleId ? route : r)));
      flash("Primary contact saved");
      setEditing(null);
    } catch (err) {
      flash(err instanceof Error ? err.message : "Save failed", "critical");
    } finally {
      setBusy(false);
    }
  }

  async function toggleBackup(ruleId: string, personId: string) {
    const current = rules.find((r) => r.id === ruleId);
    if (!current) return;
    const has = current.backupPersonIds.includes(personId);
    const backupPersonIds = has
      ? current.backupPersonIds.filter((id) => id !== personId)
      : [...current.backupPersonIds, personId].slice(0, 3);
    setBusy(true);
    try {
      const route = await patchRoute(ruleId, { backupPersonIds });
      setRules((rows) => rows.map((r) => (r.id === ruleId ? route : r)));
      flash("Backup contacts saved");
    } catch (err) {
      flash(err instanceof Error ? err.message : "Save failed", "critical");
    } finally {
      setBusy(false);
    }
  }

  async function addPerson() {
    const name = newPerson.name.trim();
    const phone = newPerson.phone.trim();
    if (!name || !phone) return;
    setBusy(true);
    try {
      const person = await createPerson({
        name,
        role: newPerson.role,
        phone,
        areas: newPerson.areas.split(",").map((a) => a.trim()).filter(Boolean),
        skills: newPerson.skills.split(",").map((s) => s.trim()).filter(Boolean),
        assetIds: [],
        whatsappEnabled: newPerson.whatsappEnabled,
      });
      setPeople((prev) => [...prev, person]);
      setNewPerson({
        name: "",
        role: "operator",
        phone: "",
        areas: "",
        skills: "",
        whatsappEnabled: true,
      });
      setShowAddPerson(false);
      flash(`${name} saved to roster`);
    } catch (err) {
      flash(err instanceof Error ? err.message : "Could not add person", "critical");
    } finally {
      setBusy(false);
    }
  }

  async function addRoute() {
    const label = newRoute.label.trim();
    const target = newRoute.target.trim();
    if (!label || !target || !newRoute.primaryPersonId) return;
    setBusy(true);
    try {
      const route = await createRoute({
        scope: newRoute.scope,
        target,
        label,
        primaryPersonId: newRoute.primaryPersonId,
        backupPersonIds: [],
        severityMin: newRoute.severityMin,
      });
      setRules((prev) => [...prev, route]);
      setNewRoute({
        scope: "area",
        target: "",
        label: "",
        primaryPersonId: "",
        severityMin: "warning",
      });
      setShowAddRoute(false);
      flash("Route saved");
    } catch (err) {
      flash(err instanceof Error ? err.message : "Could not add route", "critical");
    } finally {
      setBusy(false);
    }
  }

  if (loadState === "loading") {
    return (
      <Panel data-assignments-board>
        <p style={{ margin: 0, fontSize: 14, color: "var(--forge-on-surface-variant)" }}>
          Loading assignments…
        </p>
      </Panel>
    );
  }

  if (loadState === "unavailable") {
    return (
      <div data-assignments-board>
        <EmptyUpstreamState
          title="Assignments unavailable"
          detail={loadError ?? "Sign in with plant membership to manage notify roster and routes."}
        />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }} data-assignments-board>
      <Panel>
        <p className="forge-eyebrow">Responsibility matrix</p>
        <h2 className="forge-card-title" style={{ fontSize: 18 }}>
          Alarm & prescription ownership
        </h2>
        <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--forge-on-surface-variant)", maxWidth: 720 }}>
          Decide who is responsible for each plant area or asset. Alarm WhatsApp alerts follow these
          routes. Changes save to your plant immediately.
        </p>
      </Panel>

      <div className="forge-grid-40-60">
        <Panel>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <p className="forge-eyebrow">People</p>
              <h3 className="forge-card-title">Notify roster</h3>
            </div>
            <GhostButton onClick={() => setShowAddPerson((v) => !v)} disabled={busy}>
              {showAddPerson ? "Cancel" : "+ Add person"}
            </GhostButton>
          </div>

          {showAddPerson ? (
            <div
              style={{
                marginTop: 16,
                padding: 14,
                borderRadius: 12,
                border: "1px solid var(--forge-outline-variant)",
                background: "var(--forge-surface-container-low)",
                display: "grid",
                gap: 10,
              }}
            >
              <p className="forge-eyebrow">New team member</p>
              <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
                Full name
                <input
                  value={newPerson.name}
                  onChange={(e) => setNewPerson((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Rahul Mehta"
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--forge-outline-variant)" }}
                />
              </label>
              <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
                Role
                <select
                  value={newPerson.role}
                  onChange={(e) => setNewPerson((p) => ({ ...p, role: e.target.value as Role }))}
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--forge-outline-variant)" }}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r.replaceAll("_", " ")}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
                Phone (E.164 or 10-digit India)
                <input
                  value={newPerson.phone}
                  onChange={(e) => setNewPerson((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+9198XXXXXXXX"
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--forge-outline-variant)" }}
                />
              </label>
              <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
                Plant areas (comma-separated)
                <input
                  value={newPerson.areas}
                  onChange={(e) => setNewPerson((p) => ({ ...p, areas: e.target.value }))}
                  placeholder="Kiln Line, Grinding Hall, Utilities"
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--forge-outline-variant)" }}
                />
              </label>
              <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
                Skills (comma-separated)
                <input
                  value={newPerson.skills}
                  onChange={(e) => setNewPerson((p) => ({ ...p, skills: e.target.value }))}
                  placeholder="shift lead, compressors"
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--forge-outline-variant)" }}
                />
              </label>
              <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={newPerson.whatsappEnabled}
                  onChange={(e) => setNewPerson((p) => ({ ...p, whatsappEnabled: e.target.checked }))}
                />
                WhatsApp notifications enabled
              </label>
              <PrimaryButton
                onClick={() => void addPerson()}
                disabled={busy || !newPerson.name.trim() || !newPerson.phone.trim()}
              >
                Save to roster
              </PrimaryButton>
            </div>
          ) : null}

          {people.length === 0 ? (
            <p style={{ margin: "16px 0 0", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
              No people on this plant yet. Add someone to start routing.
            </p>
          ) : (
            <ul style={{ listStyle: "none", margin: "16px 0 0", padding: 0, display: "grid", gap: 10 }}>
              {people.map((p) => (
                <PersonRow key={p.id} person={p} />
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <p className="forge-eyebrow">Routes</p>
              <h3 className="forge-card-title">Alarm notification routing</h3>
            </div>
            <GhostButton
              onClick={() => setShowAddRoute((v) => !v)}
              disabled={busy || people.length === 0}
            >
              {showAddRoute ? "Cancel" : "+ Add route"}
            </GhostButton>
          </div>

          {showAddRoute ? (
            <div
              style={{
                marginTop: 16,
                padding: 14,
                borderRadius: 12,
                border: "1px solid var(--forge-outline-variant)",
                background: "var(--forge-surface-container-low)",
                display: "grid",
                gap: 10,
              }}
            >
              <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
                Label
                <input
                  value={newRoute.label}
                  onChange={(e) => setNewRoute((r) => ({ ...r, label: e.target.value }))}
                  placeholder="Pyro critical alarms"
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--forge-outline-variant)" }}
                />
              </label>
              <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
                Scope
                <select
                  value={newRoute.scope}
                  onChange={(e) =>
                    setNewRoute((r) => ({
                      ...r,
                      scope: e.target.value as "area" | "asset",
                    }))
                  }
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--forge-outline-variant)" }}
                >
                  <option value="area">Area</option>
                  <option value="asset">Asset</option>
                </select>
              </label>
              <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
                Target ({newRoute.scope === "area" ? "area name" : "asset id"})
                <input
                  value={newRoute.target}
                  onChange={(e) => setNewRoute((r) => ({ ...r, target: e.target.value }))}
                  list={newRoute.scope === "area" ? "assignment-areas" : undefined}
                  placeholder={areas[0] ?? "Utilities"}
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--forge-outline-variant)" }}
                />
                <datalist id="assignment-areas">
                  {areas.map((a) => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
              </label>
              <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
                Primary contact
                <select
                  value={newRoute.primaryPersonId}
                  onChange={(e) =>
                    setNewRoute((r) => ({ ...r, primaryPersonId: e.target.value }))
                  }
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--forge-outline-variant)" }}
                >
                  <option value="">Select person</option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <PrimaryButton
                onClick={() => void addRoute()}
                disabled={
                  busy ||
                  !newRoute.label.trim() ||
                  !newRoute.target.trim() ||
                  !newRoute.primaryPersonId
                }
              >
                Save route
              </PrimaryButton>
            </div>
          ) : null}

          {rules.length === 0 ? (
            <p style={{ margin: "16px 0 0", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
              No routes yet. Add a person first, then create a route.
            </p>
          ) : (
            <ul style={{ listStyle: "none", margin: "16px 0 0", padding: 0, display: "grid", gap: 14 }}>
              {rules.map((rule) => (
                <RouteRow
                  key={rule.id}
                  rule={rule}
                  people={people}
                  editing={editing === rule.id}
                  busy={busy}
                  onEdit={() => setEditing(editing === rule.id ? null : rule.id)}
                  onPrimary={(id) => void setPrimary(rule.id, id)}
                  onToggleBackup={(id) => void toggleBackup(rule.id, id)}
                />
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <ToastRegion message={toast} tone={toastTone} />
    </div>
  );
}

function PersonRow({ person }: { person: NotifyPersonDto }) {
  return (
    <li
      style={{
        padding: "10px 0",
        borderBottom: "1px solid var(--forge-outline-variant)",
        display: "grid",
        gap: 4,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <strong style={{ fontSize: 14 }}>{person.name}</strong>
        <StatusChip tone={person.whatsappEnabled ? "good" : "warning"}>
          {person.whatsappEnabled ? "WhatsApp on" : "WhatsApp off"}
        </StatusChip>
      </div>
      <p style={{ margin: 0, fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
        {person.role.replaceAll("_", " ")} · {person.phoneMasked}
      </p>
      <p style={{ margin: 0, fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
        Areas: {person.areas.join(", ") || "-"}
      </p>
      {person.skills.length ? (
        <p style={{ margin: 0, fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
          Skills: {person.skills.join(", ")}
        </p>
      ) : null}
    </li>
  );
}

function RouteRow({
  rule,
  people,
  editing,
  busy,
  onEdit,
  onPrimary,
  onToggleBackup,
}: {
  rule: AlarmRouteDto;
  people: NotifyPersonDto[];
  editing: boolean;
  busy: boolean;
  onEdit: () => void;
  onPrimary: (id: string) => void;
  onToggleBackup: (id: string) => void;
}) {
  const primary = people.find((p) => p.id === rule.primaryPersonId);
  const backups = rule.backupPersonIds
    .map((id) => people.find((p) => p.id === id))
    .filter(Boolean) as NotifyPersonDto[];

  return (
    <li
      style={{
        padding: 14,
        borderRadius: 12,
        border: "1px solid var(--forge-outline-variant)",
        background: "var(--forge-surface-container-low)",
      }}
      data-route-id={rule.id}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <div>
          <StatusChip tone="info">{rule.scope}</StatusChip>
          <h4 style={{ margin: "8px 0 0", fontFamily: "var(--forge-font-display)", fontSize: 15 }}>
            {rule.label}
          </h4>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--forge-on-surface-variant)" }}>
            Target: {rule.target} · Min severity: {rule.severityMin}
          </p>
        </div>
        <GhostButton onClick={onEdit} disabled={busy}>
          {editing ? "Done" : "Edit"}
        </GhostButton>
      </div>

      <p style={{ margin: "12px 0 0", fontSize: 13 }}>
        <strong>Primary:</strong> {primary?.name ?? "-"}
      </p>
      <p style={{ margin: "4px 0 0", fontSize: 13 }}>
        <strong>Backup:</strong>{" "}
        {backups.length ? backups.map((b) => b.name).join(", ") : "-"}
      </p>

      {editing ? (
        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          <p className="forge-eyebrow">Set primary</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {people
              .filter((p) => p.whatsappEnabled)
              .map((p) => (
                <PrimaryButton key={p.id} onClick={() => onPrimary(p.id)} disabled={busy}>
                  {p.name}
                </PrimaryButton>
              ))}
          </div>
          <p className="forge-eyebrow">Toggle backups (max 3)</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {people
              .filter((p) => p.whatsappEnabled && p.id !== rule.primaryPersonId)
              .map((p) => {
                const on = rule.backupPersonIds.includes(p.id);
                return (
                  <GhostButton key={p.id} onClick={() => onToggleBackup(p.id)} disabled={busy}>
                    {on ? "✓ " : ""}
                    {p.name}
                  </GhostButton>
                );
              })}
          </div>
        </div>
      ) : null}
    </li>
  );
}
