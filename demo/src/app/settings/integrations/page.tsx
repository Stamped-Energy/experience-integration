import Link from "next/link";
import { nameOf } from "@/lib/names";
import * as D from "@/lib/demo/data";
import { demoRole } from "@/lib/role";
import { can, grant, whoCan, ACTIONS, ACTION_LABELS, ROLE_ORDER } from "@/lib/rbac";
import { dayMonth, rel } from "@/lib/format";
import { deniedReason } from "@/components/cards/DecisionCard";
import { LimitsBand } from "@/components/ui/LimitsBand";
import { DataTable, LineModeTag, ModeTag, Section, Tag } from "@/components/ui/primitives";
import { ConfirmAction } from "@/components/settings/Confirm";
import { GrantTag, SettingsPage, roleName } from "@/components/settings/common";

export const metadata = { title: "Integrations" };
export default async function Integrations() {
  const role = demoRole();
  const ok = can(role, "manage-integrations");
  const reason = deniedReason("manage-integrations", "manage integrations");
  return (
    <SettingsPage section="integrations" title="Integrations" meta="Data connections Stamped reads from, sign-in, API keys and webhooks." changes={["manage-integrations"]} audit={/Exported/}
      help={<ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}><li>Data connections are read only.</li><li>API keys are shown once at creation.</li><li>Webhooks carry ids, never readings.</li></ul>}>
      <Section title="Connections" flush>
        <DataTable caption="Connections" rowKey={(i) => i.id} rows={D.integrations} columns={[
          { key: "n", label: "Connection", render: (i) => <>{i.name}<span className="cell-sub">{i.kind}</span></> },
          { key: "s", label: "Status", render: (i) => <Tag tone={i.status === "connected" ? "success" : i.status === "degraded" ? "warning" : "neutral"} dot>{i.status}</Tag> },
          { key: "l", label: "Last sync", render: (i) => rel(i.lastSync) },
          { key: "d", label: "Data", render: (i) => { const s = D.dataSources.find((x) => x.name === i.name); return s ? `${s.tags} tags · ${s.gapPct}% gap` : ""; } },
          { key: "a", label: "", render: (i) => <ConfirmAction label="Test" allowed={ok} reason={reason} title={`Test ${i.name}`} body={<p>Reads one value to check the connection. Nothing is written.</p>} confirm="Run test" done="Test passed." /> },
        ]} />
        <div className="card-foot"><Link className="link" href="/plant/data">Data health</Link><span className="spacer" /><ConfirmAction label="Add connection" allowed={ok} reason={reason} title="Add a data connection" body={<p>Historian, production system, lab system or quality system.</p>} confirm="Add" done="Added." /></div>
      </Section>
      <Section title="API keys" flush>
          <DataTable caption="API keys" rowKey={(k) => k.id} rows={D.apiKeys} columns={[
            { key: "l", label: "Key", render: (k) => <>{k.label}<span className="cell-sub mono">{nameOf(k.id)}</span></> },
            { key: "c", label: "Created", render: (k) => dayMonth(k.created) },
            { key: "u", label: "Last used", render: (k) => rel(k.lastUsed) },
            { key: "r", label: "", render: (k) => <ConfirmAction label="Revoke" allowed={ok} reason={reason} title={`Revoke ${k.label}`} body={<p>Calls with this key fail from now.</p>} confirm="Revoke" done="Revoked." /> },
          ]} />
          <div className="card-foot"><ConfirmAction label="Create key" allowed={ok} reason={reason} title="Create an API key" body={<p>Name the key. It is shown once.</p>} confirm="Create" done="Created." /></div>
        </Section>
        <Section title="Webhooks" flush>
          <DataTable caption="Webhooks" rowKey={(w) => w.id} rows={D.webhooks} columns={[
            { key: "u", label: "Address", mono: true, render: (w) => w.url },
            { key: "s", label: "Health", render: (w) => <>{w.status === "failing" ? <Tag tone="critical" dot>Failing</Tag> : w.status === "paused" ? <Tag tone="neutral">Paused</Tag> : <Tag tone="success" dot>Healthy</Tag>}{w.note && <span className="cell-sub">{w.note}</span>}</> },
            { key: "d", label: "Last delivery", render: (w) => w.lastDelivery ? rel(w.lastDelivery) : "None yet" },
            { key: "e", label: "Events", render: (w) => <span className="scope-chips">{w.events.map((e) => <Tag key={e}>{e}</Tag>)}</span> },
            { key: "a", label: "", render: (w) => w.status === "failing" ? <ConfirmAction label="Retry" allowed={ok} reason={reason} title="Retry queued deliveries" body={<p>Sends queued deliveries again in order. Payloads carry ids only.</p>} confirm="Retry" done="Retry queued." /> : w.status === "paused" ? <ConfirmAction label="Resume" allowed={ok} reason={reason} title="Resume webhook" body={<p>Deliveries start again from the next event.</p>} confirm="Resume" done="Resumed." /> : <ConfirmAction label="Pause" allowed={ok} reason={reason} title="Pause webhook" body={<p>Events are not sent until resumed.</p>} confirm="Pause" done="Paused." /> },
          ]} />
          <div className="card-foot"><ConfirmAction label="Add webhook" allowed={ok} reason={reason} title="Add a webhook" body={<p>Pick events. Payloads carry ids only.</p>} confirm="Add" done="Added." /></div>
        </Section>
      <Section title="Data sources behind the connections" flush>
        <DataTable caption="Sources" rowKey={(s) => s.id} rows={D.dataSources} columns={[
          { key: "n", label: "Source", render: (s) => s.name },
          { key: "k", label: "Kind", render: (s) => s.kind },
          { key: "t", label: "Tags", align: "right", render: (s) => s.tags },
          { key: "q", label: "Good readings", align: "right", render: (s) => `${s.qualityCodes.good}%` },
          { key: "l", label: "Last seen", render: (s) => rel(s.lastSeen) },
        ]} />
      </Section>
    </SettingsPage>
  );
}
