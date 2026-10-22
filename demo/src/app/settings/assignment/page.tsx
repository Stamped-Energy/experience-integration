import * as D from "@/lib/demo/data";
import * as A from "@/lib/demo/agent";
import { demoRole } from "@/lib/role";
import { can } from "@/lib/rbac";
import { rel } from "@/lib/format";
import { DataTable, Section } from "@/components/ui/primitives";
import { SettingsPage } from "@/components/settings/common";
import { RoleAssignMatrix } from "@/components/settings/RoleAssignMatrix";

export const metadata = { title: "Assignment matrix" };

export default async function Assignment() {
  const role = demoRole();
  const rows = Object.entries(A.assigned).map(([id, a]) => ({ id, ...a, title: D.inboxItems.find((i) => i.id === id)?.title ?? A.questions.find((q) => q.id === id)?.title ?? A.idleProposals.find((p) => p.id === id)?.title ?? id }));
  return (
    <SettingsPage section="assignment" title="Assignment matrix" meta="For each kind of card, which role gets it by default and which roles can hand it to a named person."
      changes={["manage-people"]} audit={/Assigned/}
      help={<ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}><li>The owner role gets the card first, through Routing.</li><li>Shift lead, process engineer, quality head and plant head can assign cards in their area to a person.</li><li>Assigning never changes who may decide. Signing stays with the signer.</li></ul>}>
      <Section title="Default owner and who assigns" meta={`${A.assignmentMatrix.length} kinds of card × ${A.MATRIX_ROLES.length} roles`} flush>
        <RoleAssignMatrix rows={A.assignmentMatrix} roles={A.MATRIX_ROLES.map((r) => D.byId.role(r).name)} editable={can(role, "manage-people")} />
      </Section>
      <Section title="Assigned now" meta={`${rows.length} cards`} flush>
        <DataTable caption="Assigned cards" rowKey={(r) => r.id} rows={rows} columns={[
          { key: "t", label: "Card", render: (r) => r.title },
          { key: "to", label: "Assigned to", render: (r) => r.to },
          { key: "by", label: "By", render: (r) => <>{r.by}<span className="cell-sub">{rel(r.at)}</span></> },
        ]} />
      </Section>
    </SettingsPage>
  );
}
