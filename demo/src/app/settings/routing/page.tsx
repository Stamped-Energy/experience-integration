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
import { AssignmentMatrix } from "@/components/settings/AssignmentMatrix";

export const metadata = { title: "Routing and notifications" };
const scopeLabel = (s: string) => D.byId.line(s)?.name ?? D.areas.find((a) => a.id === s)?.name ?? (s === "quality" ? "Quality" : s);

export default async function Routing() {
  const role = demoRole();
  const manage = can(role, "manage-people");
  const people = D.people.filter((p) => !["owner", "viewer", "stamped-engineer"].includes(p.roles[0].role));
  return (
    <SettingsPage section="routing" title="Routing and notifications" meta="Who gets each card and alert: one primary and up to three backups per scope, and the channel for each event."
      changes={["manage-people"]} audit={/Accepted|Declined|Pressed/}
      help={<ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}><li>Cards go to the primary first, then backups in order.</li><li>Recommend suggests backups by scope and skills.</li><li>Channels are in-app and email.</li></ul>}>
      <Section title="Assignment matrix" meta={`${D.assignments.length} scopes × ${people.length} people`} flush>
        <AssignmentMatrix editable={manage} people={people.map((p) => ({ id: p.id, display: p.display, role: roleName(p.roles[0].role), scopes: p.roles.map((r) => r.scope) }))}
          scopes={D.assignments.map((a) => ({ scope: a.scope, label: scopeLabel(a.scope), primary: a.primary, backups: [a.backup], skills: a.skills }))} />
      </Section>
      <div className="split">
        <Section title="Notifications" meta="Event, role and channel" flush>
          <DataTable caption="Notification rules" rowKey={(n) => n.event} rows={D.notificationRules} columns={[
            { key: "e", label: "Event", render: (n) => n.event },
            { key: "r", label: "Role", render: (n) => roleName(n.role) },
            { key: "c", label: "Channel", render: (n) => <Tag>{n.channel}</Tag> },
          ]} />
          <div className="card-foot"><ConfirmAction label="Add a rule" allowed={manage} reason={deniedReason("manage-people", "change routing")} title="Add a notification rule" body={<p>Pick an event, a role and a channel (in-app or email).</p>} confirm="Add" done="Added." /></div>
        </Section>
        <Section title="What waits, and for whom" meta="From the inbox" flush>
          <DataTable caption="Waiting" rowKey={(i) => i.id} rows={D.inboxItems.filter((i) => i.bucket !== "decided").slice(0, 8)} columns={[
            { key: "t", label: "Item", render: (i) => <Link className="link" href={`/inbox/${i.id}`}>{i.title}</Link> },
            { key: "o", label: "Owner", render: (i) => roleName(i.owner) },
          ]} />
        </Section>
      </div>
    </SettingsPage>
  );
}
