import { nameOf } from "@/lib/names";
import Link from "next/link";
import * as D from "@/lib/demo/data";
import { currentRole } from "@/lib/role";
import { can, grant, whoCan, ACTIONS, ACTION_LABELS, ROLE_ORDER } from "@/lib/rbac";
import { dayMonth, rel } from "@/lib/format";
import { deniedReason } from "@/components/cards/DecisionCard";
import { LimitsBand } from "@/components/ui/LimitsBand";
import { DataTable, LineModeTag, ModeTag, Section, Tag } from "@/components/ui/primitives";
import { ConfirmAction } from "@/components/settings/Confirm";
import { GrantTag, SettingsPage, roleName } from "@/components/settings/common";

export const metadata = { title: "Plant setup" };
export default async function PlantSetup() {
  const role = await currentRole();
  const ok = can(role, "manage-people");
  const reason = deniedReason("manage-people", "change plant setup");
  return (
    <SettingsPage section="plant" title="Plant setup" meta="The site, its areas, lines and shifts, and the units and language the plant works in." changes={["manage-people"]} audit={/Signed trial/}
      actions={<ConfirmAction label="Save setup" primary allowed={ok} reason={reason} title="Save plant setup" body={<p>Changes to shifts apply from the next shift start.</p>} confirm="Save" done="Saved." />}
      help={<ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}><li>Lines take their words from their line pack.</li><li>Shift times drive handovers and notes.</li><li>Units are metric for this site.</li></ul>}>
      <Section title="Site">
        <div className="field-grid">
          <label className="field">Name<input defaultValue={D.site.name} disabled={!ok} /></label>
          <label className="field">Time zone<input defaultValue={D.site.timezone} disabled={!ok} /></label>
          <label className="field">Units<select defaultValue={D.site.units} disabled={!ok}><option value="metric">Metric</option></select></label>
          <label className="field">Language<select defaultValue="en-GB" disabled={!ok}><option value="en-GB">English (UK)</option><option value="hi">Hindi</option></select></label>
        </div>
      </Section>
      <div className="split">
        <Section title="Areas and lines" flush>
          <DataTable caption="Lines" rowKey={(l) => l.id} rows={D.lines} columns={[
            { key: "a", label: "Area", render: (l) => D.areas.find((a) => a.id === l.areaId)?.name },
            { key: "n", label: "Line", render: (l) => <Link className="link" href={`/process/lines/${l.id}`}>{l.name}</Link> },
            { key: "t", label: "Type", render: (l) => l.type },
            { key: "p", label: "Pack", render: (l) => <Link className="link" href={`/plant/line-packs?pack=${l.linePackId}`}>{l.linePackId}</Link> },
            { key: "m", label: "Mode", render: (l) => <LineModeTag mode={l.mode} /> },
          ]} />
          <div className="card-foot"><ConfirmAction label="Add line" allowed={ok} reason={reason} title="Add a line" body={<p>Pick an area and a line pack. The line starts in watch-only mode.</p>} confirm="Add" done="Added." /></div>
        </Section>
        <Section title="Shifts">
          <div className="stack-sm">{D.shifts.map((s) => <div key={s.id} className="field-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}><label className="field">Name<input defaultValue={s.name} disabled={!ok} /></label><label className="field">Start<input defaultValue={s.start} disabled={!ok} /></label><label className="field">End<input defaultValue={s.end} disabled={!ok} /></label></div>)}</div>
        </Section>
      </div>
      <div className="split">
        <Section title="Areas" flush>
          <DataTable caption="Areas" rowKey={(a) => a.id} rows={D.areas} columns={[
            { key: "n", label: "Area", render: (a) => a.name },
            { key: "l", label: "Lines", render: (a) => D.lines.filter((l) => l.areaId === a.id).map((l) => l.short).join(", ") || "None yet" },
            { key: "s", label: "Assets", align: "right", render: (a) => D.assets.filter((x) => D.lines.some((l) => l.areaId === a.id && l.id === x.lineId)).length },
          ]} />
        </Section>
        <Section title="Plant Box" flush>
          <DataTable caption="Box" rowKey={(l) => l.id} rows={D.leases} columns={[
            { key: "i", label: "Lease", render: (l) => nameOf(l.id) },
            { key: "s", label: "State", render: (l) => <Tag>{l.state}</Tag> },
            { key: "m", label: "Limits", render: (l) => `${l.maxOfflineH} h, cap ${l.hardCapH} h` },
          ]} />
          <div className="card-foot"><Link className="link" href="/plant/box">Lease and revoke</Link></div>
        </Section>
      </div>
    </SettingsPage>
  );
}
