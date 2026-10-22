"use client";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import * as D from "@/lib/demo/data";
import { demoRole } from "@/lib/role";
import { can, grant, whoCan, ACTIONS, ACTION_LABELS, ROLE_ORDER } from "@/lib/rbac";
import { dayMonth, rel } from "@/lib/format";
import { deniedReason } from "@/components/cards/DecisionCard";
import { LimitsBand } from "@/components/ui/LimitsBand";
import { DataTable, LineModeTag, ModeTag, Section, Tag } from "@/components/ui/primitives";
import { ConfirmAction } from "@/components/settings/Confirm";
import { GrantTag, SettingsPage, roleName } from "@/components/settings/common";
import { RbacMatrix, SignerPicker } from "@/components/settings/RbacMatrix";

const scopeName = (s: string) => (s === "site-demo" ? "Whole site" : D.byId.line(s)?.short ?? D.areas.find((a) => a.id === s)?.name ?? s);

export default function People() {
  const sp = Object.fromEntries(useSearchParams().entries());
  const role = demoRole();
  const manage = can(role, "manage-people");
  const sel = D.people.find((p) => p.id === sp.person) ?? D.people.find((p) => p.roles.some((r) => r.role === role)) ?? D.people[0];
  const rows = ACTIONS.map((a) => ({ action: a, label: ACTION_LABELS[a], cells: ROLE_ORDER.map((r) => grant(r, a)) }));
  const mine = sel.roles.map((r) => r.role);
  return (
    <SettingsPage section="people" title="People and roles" meta="Permission is role by action by scope. The template is a starting point; each plant edits it. Who signs is set per plant, and operators can accept proposals on their own line."
      changes={["manage-people", "sign-limits", "sign-trial"]} audit={/Granted|Revoked|Narrowed/}
      side={<>
        <Section title={sel.display} meta={sel.roles.map((r) => `${roleName(r.role)}, ${scopeName(r.scope)}`).join("; ")} actions={<ConfirmAction label="Change role" allowed={manage} reason={deniedReason("manage-people", "manage people")} title={`Change role for ${sel.display}`} body={<p>Pick a role and a scope. The change applies from the next sign-in.</p>} confirm="Save" done="Saved." />} flush>
          <DataTable caption="What this person can do" rowKey={(a) => a} rows={ACTIONS.filter((a) => mine.some((r) => grant(r, a) !== "hidden"))} columns={[
            { key: "a", label: "Action", render: (a) => ACTION_LABELS[a] },
            { key: "g", label: "Grant", render: (a) => <GrantTag v={mine.map((r) => grant(r, a)).includes("allow") ? "allow" : "view"} /> },
          ]} />
        </Section>
      </>}
      help={<ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}><li>Allow: can act. View: can see but not act. Hidden: not shown.</li><li>Signing rows are set per plant.</li><li>Scope limits a role to a site, area, line or asset.</li><li>There is no action to release a hold; that stays in the quality system.</li></ul>}>
      <Section title="Who signs at this plant" meta="Set per plant beforehand" actions={<Tag tone="accent">Set per plant</Tag>}>
        <SignerPicker editable={manage} roles={D.roles.map((r) => ({ id: r.id, name: r.name }))} items={(["sign-limits", "sign-trial", "grant-standing-approval"] as const).map((a) => ({ action: a, label: ACTION_LABELS[a], current: whoCan(a)[0] ?? "plant-head" }))} />
      </Section>
      <Section title="Permissions matrix" meta={`${ACTIONS.length} actions × ${ROLE_ORDER.length} roles · operators accept, adjust or decline proposals in scope`} flush>
        <RbacMatrix editable={manage} roles={ROLE_ORDER.map((r) => ({ id: r, short: D.roles.find((x) => x.id === r)?.short ?? r }))} rows={rows} />
      </Section>
        <Section title="People" meta={`${D.people.length} on this site`} flush>
          <DataTable caption="People" rowKey={(p) => p.id} rows={D.people} columns={[
            { key: "n", label: "Person", render: (p) => <Link className="link" href={`/settings/people?person=${p.id}`} scroll={false} style={p.id === sel.id ? { fontWeight: 600 } : undefined}>{p.display}</Link> },
            { key: "r", label: "Role and scope", render: (p) => <span className="scope-chips">{p.roles.map((r) => <Tag key={r.role + r.scope}>{roleName(r.role)} · {scopeName(r.scope)}</Tag>)}</span> },
            { key: "a", label: "Routing", render: (p) => { const pr = D.assignments.filter((a) => a.primary === p.display).length, bk = D.assignments.filter((a) => a.backup === p.display).length; return pr || bk ? `${pr} primary · ${bk} backup` : ""; } },
          ]} />
        </Section>
    </SettingsPage>
  );
}
