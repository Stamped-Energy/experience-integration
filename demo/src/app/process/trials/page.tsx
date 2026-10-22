import Link from "next/link";
import { nameOf } from "@/lib/names";
import * as D from "@/lib/demo/data";
import { currentRole } from "@/lib/role";
import { can } from "@/lib/rbac";
import { dayMonth, hhmm, rel } from "@/lib/format";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { CardActions } from "@/components/cards/CardActions";
import { deniedReason } from "@/components/cards/DecisionCard";
import { DataTable, PageHeader, Section, Tag, VerdictTag } from "@/components/ui/primitives";
import { SwitchbackSchedule } from "@/components/process/SwitchbackSchedule";
import { ProcessTabs, crumbs } from "@/components/process/common";

export const metadata = { title: "Trials and stops" };
const tone = (s: string) => (s === "running" ? "info" : s === "awaiting signature" ? "accent" : s === "stopped" ? "critical" : "neutral") as "info" | "accent" | "critical" | "neutral";

export default async function Trials() {
  const role = await currentRole();
  const running = D.trials.filter((t) => t.status === "running");
  const waiting = D.trials.filter((t) => t.status === "awaiting signature");
  return (
    <Workspace crumbs={crumbs({ label: "Trials and stops" })} askContext="Trials">
      <PageHeader eyebrow="Process" title="Trials and stops" meta="A trial alternates the change with the checked prior configuration on a schedule locked before it starts. Stop restores the prior."
        actions={<><AskButton context="Trials" label="Ask about trials" /></>} />
      <ProcessTabs active="trials" />
      <div className="grid">
        <div className="span-8 xl-span-9 stack">
          <Section title="Trials" meta={`${D.trials.length} on record`} flush>
            <DataTable caption="Trials" rowKey={(t) => t.id} rows={D.trials} columns={[
              { key: "i", label: "Trial", render: (t) => <><Link className="link" href={`/process/trials/${t.id}`} style={{ fontWeight: 600 }}>{t.change}</Link><span className="cell-sub">{nameOf(t.id)} · {D.byId.line(t.lineId)!.short}</span></> },
              { key: "s", label: "Status", render: (t) => <Tag tone={tone(t.status)}>{t.status}</Tag> },
              { key: "w", label: "Switches", align: "right", render: (t) => t.switches.length ? `${t.switches.filter((s) => !s.skippedReason).length} done, ${t.switches.filter((s) => s.skippedReason).length} skipped` : "None yet" },
              { key: "r", label: "Restore target", render: (t) => Object.entries(t.restoreTarget).map(([k, v]) => `${D.byId.window(t.lineId, k)?.name ?? k} ${v}`).join(", ") },
              { key: "p", label: "Plan", render: (t) => <Link className="link" href={`/process/measurement?plan=${t.measurementPlanId}`}>{nameOf(t.measurementPlanId)}</Link> },
              { key: "g", label: "Signed", render: (t) => (t.signedAt ? `Plant head · ${dayMonth(t.signedAt)}` : <span className="muted">Waiting for plant head</span>) },
              { key: "v", label: "Verdict", render: (t) => { const p = D.proofRecords.find((x) => x.objectId === t.id); return p ? <Link href={`/process?evidence=${p.id}`} scroll={false}><VerdictTag verdict={p.verdict} /></Link> : <span className="muted">None</span>; } },
            ]} />
          </Section>
          {running.map((t) => (
            <Section key={t.id} title={`Switchback schedule · ${t.change}`} meta={t.schedule.join(" · ")} actions={<Link className="link" href={`/process/trials/${t.id}`}>Trial detail</Link>} flush>
              <SwitchbackSchedule trial={t} />
            </Section>
          ))}
        </div>
        <div className="span-4 xl-span-3 stack ctx">
          <Section title="Waiting for signature" meta="Signer set per plant" flush>
            {waiting.map((t) => (
              <article key={t.id} className="card decision" style={{ margin: 12 }}>
                <div className="card-head"><span className="src">Process engineer A.</span><span className="dotsep">·</span><span>{D.byId.line(t.lineId)!.short}</span><span className="right"><Tag tone="accent">Needs a signature</Tag></span></div>
                <div className="card-body"><div className="card-block"><h3 className="card-title"><Link href={`/process/trials/${t.id}`}>{t.change}</Link></h3><p className="card-obs">{t.schedule.join(". ")}. Restores {Object.values(t.restoreTarget)[0]} on Stop.</p></div></div>
                <CardActions actions={[{ id: "sign", label: "Sign trial order", primary: true, allowed: can(role, "sign-trial"), reason: deniedReason("sign-trial", "sign"), done: "Signed." }]} />
              </article>
            ))}
          </Section>
          <Section title="Stops" meta="What Stop did" flush>
            <ul className="tl">{D.stopEvents.map((s) => (
              <li key={s.id}><span className="t">{dayMonth(s.at)} {hhmm(s.at)}</span><span className="k x" /><span>{s.effect}<span className="cell-sub">{s.by} · {s.mode === "trial" ? "trial, prior restored" : "stay, value kept"}</span></span><Tag tone={s.restoreResult === "restored" ? "success" : s.restoreResult === "not needed" ? "neutral" : "warning"}>{s.restoreResult}</Tag></li>
            ))}</ul>
          </Section>
          <Section title="Holding checks" flush actions={<Link className="link" href="/process/measurement">Plans</Link>}>
            <ul className="tl">{D.holdingChecks.map((h, i) => (
              <li key={i}><span className="t">{dayMonth(h.checkedAt)}</span><span className="k" /><span>{nameOf(h.planId)}<span className="cell-sub">next {rel(h.nextAt)}</span></span><Tag tone={h.result === "holding" ? "success" : h.result === "faded" ? "critical" : "warning"}>{h.result}</Tag></li>
            ))}</ul>
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
