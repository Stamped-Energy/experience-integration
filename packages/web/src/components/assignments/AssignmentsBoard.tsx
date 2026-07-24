"use client";

import { useMemo, useState } from "react";
import {
  alarmRouteRulesFixture,
  notifyPeopleFixture,
  type AlarmRouteRule,
  type NotifyPerson,
} from "@/fixtures/assignments";
import type { Role } from "@/lib/types";
import { GhostButton, Panel, PrimaryButton, StatusChip, ToastRegion } from "@/components/ui/primitives";

const ROLES: Role[] = [
  "operator",
  "supervisor",
  "plant_head",
  "energy_manager",
  "sustainability",
  "cfo",
  "admin",
];

/** Admin screen: who owns which area/asset for alarm WhatsApp + Rx assign. */
export function AssignmentsBoard() {
  const [rules, setRules] = useState(alarmRouteRulesFixture);
  const [people, setPeople] = useState(notifyPeopleFixture);
  const [toast, setToast] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [newPerson, setNewPerson] = useState({
    name: "",
    role: "operator" as Role,
    phone: "",
    areas: "",
    skills: "",
    whatsappEnabled: true,
  });

  const areas = useMemo(
    () => [...new Set(people.flatMap((p) => p.areas))].sort(),
    [people],
  );

  function setPrimary(ruleId: string, personId: string) {
    setRules((rows) =>
      rows.map((r) => (r.id === ruleId ? { ...r, primaryPersonId: personId } : r)),
    );
    setToast("Primary contact updated");
    setEditing(null);
  }

  function toggleBackup(ruleId: string, personId: string) {
    setRules((rows) =>
      rows.map((r) => {
        if (r.id !== ruleId) return r;
        const has = r.backupPersonIds.includes(personId);
        const backupPersonIds = has
          ? r.backupPersonIds.filter((id) => id !== personId)
          : [...r.backupPersonIds, personId].slice(0, 3);
        return { ...r, backupPersonIds };
      }),
    );
  }

  function addPerson() {
    const name = newPerson.name.trim();
    if (!name) return;
    const id = `usr_${Date.now()}`;
    const phoneMasked = newPerson.phone.trim()
      ? newPerson.phone.trim().replace(/(\d{2})\d+(\d{4})/, "+91 •••• •• $2")
      : "+91 •••• •• ----";
    const person: NotifyPerson = {
      id,
      name,
      role: newPerson.role,
      phoneMasked,
      areas: newPerson.areas.split(",").map((a) => a.trim()).filter(Boolean),
      assetIds: [],
      skills: newPerson.skills.split(",").map((s) => s.trim()).filter(Boolean),
      whatsappEnabled: newPerson.whatsappEnabled,
    };
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
    setToast(`${name} added to notify roster`);
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
          routes. When assigning a prescription, Stamped recommends 2–3 people from this matrix —
          with an option to browse everyone who can be notified.
        </p>
      </Panel>

      <div className="forge-grid-40-60">
        <Panel>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <p className="forge-eyebrow">People</p>
              <h3 className="forge-card-title">Notify roster</h3>
            </div>
            <GhostButton onClick={() => setShowAddPerson((v) => !v)}>
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
                Phone (for WhatsApp routing)
                <input
                  value={newPerson.phone}
                  onChange={(e) => setNewPerson((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+91 98•• ••• 123"
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
              <PrimaryButton onClick={addPerson} disabled={!newPerson.name.trim()}>
                Save to roster
              </PrimaryButton>
            </div>
          ) : null}

          <ul style={{ listStyle: "none", margin: "16px 0 0", padding: 0, display: "grid", gap: 10 }}>
            {people.map((p) => (
              <PersonRow key={p.id} person={p} />
            ))}
          </ul>
        </Panel>

        <Panel>
          <p className="forge-eyebrow">Routes</p>
          <h3 className="forge-card-title">Alarm notification routing</h3>
          <ul style={{ listStyle: "none", margin: "16px 0 0", padding: 0, display: "grid", gap: 14 }}>
            {rules.map((rule) => (
              <RouteRow
                key={rule.id}
                rule={rule}
                people={people}
                areas={areas}
                editing={editing === rule.id}
                onEdit={() => setEditing(editing === rule.id ? null : rule.id)}
                onPrimary={(id) => setPrimary(rule.id, id)}
                onToggleBackup={(id) => toggleBackup(rule.id, id)}
              />
            ))}
          </ul>
        </Panel>
      </div>

      <ToastRegion message={toast} tone="good" />
    </div>
  );
}

function PersonRow({ person }: { person: NotifyPerson }) {
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
        Areas: {person.areas.join(", ") || "—"}
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
  onEdit,
  onPrimary,
  onToggleBackup,
}: {
  rule: AlarmRouteRule;
  people: NotifyPerson[];
  areas: string[];
  editing: boolean;
  onEdit: () => void;
  onPrimary: (id: string) => void;
  onToggleBackup: (id: string) => void;
}) {
  const primary = people.find((p) => p.id === rule.primaryPersonId);
  const backups = rule.backupPersonIds
    .map((id) => people.find((p) => p.id === id))
    .filter(Boolean) as NotifyPerson[];

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
        <GhostButton onClick={onEdit}>{editing ? "Done" : "Edit"}</GhostButton>
      </div>

      <p style={{ margin: "12px 0 0", fontSize: 13 }}>
        <strong>Primary:</strong> {primary?.name ?? "—"}
      </p>
      <p style={{ margin: "4px 0 0", fontSize: 13 }}>
        <strong>Backup:</strong>{" "}
        {backups.length ? backups.map((b) => b.name).join(", ") : "—"}
      </p>

      {editing ? (
        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          <p className="forge-eyebrow">Set primary</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {people
              .filter((p) => p.whatsappEnabled)
              .map((p) => (
                <PrimaryButton key={p.id} onClick={() => onPrimary(p.id)}>
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
                  <GhostButton key={p.id} onClick={() => onToggleBackup(p.id)}>
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
