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


export const metadata = { title: "Standing approvals" };
export default async function Approvals() {
  const role = await currentRole();
  const ok = can(role, "grant-standing-approval");
  const reason = deniedReason("grant-standing-approval", "grant or change standing approvals");
  const writes = D.setpointWrites.filter((w) => w.source === "proposal").slice(-8).reverse();
  return (
    <SettingsPage section="approvals" title="Standing approvals" meta="A standing approval lets per-run proposals inside a band go ahead without a click, for a set scope and time. Each one is granted, scoped, given an expiry, reviewed and can be revoked."
      actions={<ConfirmAction label="Grant a standing approval" primary allowed={ok} reason={reason} title="Grant a standing approval" body={<><p>Choose the line, the settings and the band. Proposals inside it go ahead without a per-run decision until the expiry; everything outside still waits for a person.</p><blockquote>The band must sit inside the signed window. Review is due every 7 days.</blockquote></>} confirm="Grant" done="Granted (illustrative)." />}
      changes={["grant-standing-approval"]} audit={/standing approval/i}
      help={<dl className="facts-grid"><dt>Grant</dt><dd>By the plant&apos;s signer, inside a signed window</dd><dt>Scope</dt><dd>Line, settings and band</dd><dt>Expiry</dt><dd>Fixed end date; renew by granting again</dd><dt>Review</dt><dd>Uses and outcomes checked on a set cadence</dd><dt>Revoke</dt><dd>At once; pending writes stop</dd></dl>}>
      {D.standingApprovals.map((a) => {
        const l = D.byId.line(a.lineId)!;
        const w = a.params.map((p) => D.byId.window(a.lineId, p)).filter(Boolean);
        const days = Math.round((Date.parse(a.until) - Date.parse(D.DEMO_NOW)) / 864e5);
        const age = Math.round((Date.parse(D.DEMO_NOW) - Date.parse(a.from)) / 864e5);
        const revoked = !!a.revokedAt;
        const tag = revoked ? <Tag tone="neutral">Revoked</Tag> : days <= 3 ? <Tag tone="warning" dot>Expires in {days} days</Tag> : age >= 30 ? <Tag tone="info" dot>Active · running {age} days</Tag> : <Tag tone="success" dot>Active</Tag>;
        return (
          <Section key={a.id} title={`${l.name} · ${w.map((x) => x!.name).join(", ")}`} meta={<span className="mono">{a.id}</span>} actions={tag}>
            <div className="stat-row">
              <div className="stat"><div className="label">Band</div><div className="v" style={{ fontSize: 16 }}>{a.band}</div><div className="s">inside {w[0] ? `${w[0].low} to ${w[0].high} ${w[0].unit}` : "the signed window"}</div></div>
              <div className="stat"><div className="label">Uses</div><div className="v">{a.uses}</div><div className="s">proposals let through</div></div>
              <div className="stat"><div className="label">Expires</div><div className="v" style={{ fontSize: 16 }}>{dayMonth(a.until)}</div><div className="s">{revoked ? "ended early" : `in ${days} days`}</div></div>
              <div className="stat"><div className="label">Last review</div><div className="v" style={{ fontSize: 16 }}>{dayMonth(a.reviewedAt)}</div><div className="s">{rel(a.reviewedAt)}</div></div>
            </div>
            <dl className="facts-grid" style={{ marginTop: 12 }}>
              <dt>Granted</dt><dd>{a.grantedBy}, {dayMonth(a.from)}</dd>
              <dt>Scope</dt><dd>{l.name}; {a.params.join(", ")}; band {a.band}</dd>
              <dt>Expiry</dt><dd>{dayMonth(a.until)}; no automatic renewal</dd>
              {revoked ? <>
                <dt>Revoked</dt><dd>{a.revokedBy ?? "Unknown"}, {dayMonth(a.revokedAt!)} ({rel(a.revokedAt!)})</dd>
                <dt>Reason</dt><dd>{a.revokeReason ?? "No reason recorded"}</dd>
                <dt>Effect</dt><dd>Proposals on {l.short} for {a.params.join(", ")} wait for a person again</dd>
              </> : <dt>Review</dt>}{!revoked && <dd>Every 7 days; next due {dayMonth(new Date(Date.parse(a.reviewedAt) + 7 * 864e5).toISOString())}</dd>}
            </dl>
            {!revoked && <div className="card-foot" style={{ gap: 8 }}>
              <ConfirmAction label="Review now" allowed={ok} reason={reason} title="Review this standing approval" body={<p>{a.uses} uses since {dayMonth(a.from)}. Confirm it should continue unchanged until {dayMonth(a.until)}.</p>} confirm="Mark reviewed" done="Reviewed (illustrative)." />
              <ConfirmAction label="Change scope" allowed={ok} reason={reason} title="Change scope" body={<p>Narrow the band or remove a setting. Widening needs a new grant.</p>} confirm="Save scope" done="Scope changed (illustrative)." />
              <ConfirmAction label="Extend expiry" allowed={ok} reason={reason} title="Extend expiry" body={<p>Extending past the signed window&apos;s expiry is not possible.</p>} confirm="Extend" done="Extended (illustrative)." />
              <span className="spacer" />
              <ConfirmAction label="Revoke" allowed={ok} reason={reason} title="Revoke this standing approval" body={<p>From now, every proposal on {l.short} for {a.params.join(", ")} waits for a person again. Running settings stay where they are.</p>} confirm="Revoke" done="Revoked (illustrative)." />
            </div>}
            {revoked && <div className="card-foot"><ConfirmAction label="Grant again" allowed={ok} reason={reason} title="Grant a new standing approval" body={<p>A revoked approval is not reopened. This starts a new grant with the same scope for you to check.</p>} confirm="Start grant" done="New grant started (illustrative)." /></div>}
          </Section>
        );
      })}
      <Section title="Recent writes under approval or per-run decision" flush>
        <DataTable caption="Writes" rowKey={(w) => w.runId + w.param} rows={writes} columns={[
          { key: "r", label: "Run", render: (w) => <Link className="link" href={`/process/runs/${w.runId}`}>{w.runId}</Link> },
          { key: "p", label: "Setting", render: (w) => w.param },
          { key: "v", label: "Value", align: "right", render: (w) => w.value },
          { key: "b", label: "By", render: (w) => roleName(w.byRole) },
          { key: "s", label: "Status", render: (w) => w.status },
          { key: "a", label: "At", render: (w) => dayMonth(w.at) },
        ]} />
      </Section>
      {D.lines.some((l) => !D.standingApprovals.some((a) => a.lineId === l.id && !a.revokedAt)) && <Section title="Lines without a standing approval" flush>
        <div className="rows">{D.lines.filter((l) => !D.standingApprovals.some((a) => a.lineId === l.id && !a.revokedAt)).map((l) => <div key={l.id} className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span><span className="row-title" style={{ display: "block" }}>{l.name}</span><span className="row-sub">Every proposal waits for a person</span></span><LineModeTag mode={l.mode} /></div>)}</div>
      </Section>}
    </SettingsPage>
  );
}
