"use client";

import { useParams, useSearchParams } from "next/navigation";
import { nameOf } from "@/lib/names";
import Link from "next/link";
import * as D from "@/lib/demo/data";
import type { HomeView, RoleId } from "@/lib/demo/types";
import { demoRole } from "@/lib/role";
import { can, grant } from "@/lib/rbac";
import { dayMonth, hhmm, inr, lakh, rel } from "@/lib/format";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import * as A from "@/lib/demo/agent";
import { IdleList, WorkingOn } from "@/components/agent/blocks";
import { DecisionCard, deniedReason } from "@/components/cards/DecisionCard";
import { CardActions } from "@/components/cards/CardActions";
import { LimitsBand } from "@/components/ui/LimitsBand";
import { PairedBars } from "@/components/ui/charts";
import { DataTable, EmptyState, Illustrative, KpiRow, LineModeTag, ModeTag, PageHeader, Section, Tabs, Tag, VerdictTag } from "@/components/ui/primitives";
import { LineStrip, LotsAtRisk, NoteClaims, ProofUpdates, RecentActivity, ShiftTimeline, proofHref } from "@/components/home/blocks";
import { DeskDayList } from "@/components/desk/desk-day";
import { deskToday } from "@/lib/demo/desk";

type ViewId = "overview" | HomeView;
const VIEWS: { id: ViewId; label: string }[] = [
  { id: "overview", label: "Overview" }, { id: "plant", label: "Plant" }, { id: "shift", label: "Shift" }, { id: "line", label: "My line now" }, { id: "owner", label: "Owner" },
];

export default function Home() {
  const sp = Object.fromEntries(useSearchParams().entries());
  const role = demoRole();
  const view = (VIEWS.some((v) => v.id === sp.view) ? sp.view : "overview") as ViewId;
  const title = { overview: "Demonstration plant", plant: "Plant today", shift: "Shift 2, starting", line: "My line now", owner: "Value and what happened" }[view];
  const meta = { overview: `${dayMonth(D.DEMO_NOW)} · ${hhmm(D.DEMO_NOW)} IST. A proposal stays inside a band a named person signed. Nothing is written until that person accepts it.`, plant: `${D.site.name} · ${dayMonth(D.DEMO_NOW)} · ${hhmm(D.DEMO_NOW)} IST`, shift: "Shift 1 handed over at 14:00 IST. Here is what changed and what is waiting.", line: "Current settings inside the signed band, and the next proposal.", owner: "Value at the plant's own prices. Verified and Indicative are shown apart and never added." }[view];
  return (
    <Workspace crumbs={[{ label: "Demonstration plant", href: "/" }, { label: "Home" }, { label: VIEWS.find((v) => v.id === view)!.label }]} askContext={`Home · ${view}`}>
      <PageHeader eyebrow="Home" title={title} meta={meta} brand={view === "owner"}
        actions={view === "overview" ? <><Link className="btn btn-sm" href="/activity/summary">This week's summary</Link><Illustrative /></> : <><Tag>{D.byId.role(role).name} view</Tag><AskButton label="Ask about this view" className="btn btn-sm" context={`Home · ${view}`} /></>} />
      {view === "overview" && grant(role, "see-plant-value") !== "hidden" ? <OverviewValue /> : null}
      <Tabs label="Home views" items={VIEWS.map((v) => ({ href: `/?view=${v.id}`, label: v.label, active: v.id === view }))} />
      {view === "overview" ? <Overview /> : null}
      {view === "plant" ? <PlantView role={role} /> : null}
      {view === "shift" ? <ShiftView role={role} /> : null}
      {view === "line" ? <LineView role={role} lineId={sp.line === "line-b" ? "line-b" : "line-a"} /> : null}
      {view === "owner" ? <OwnerView role={role} /> : null}
    </Workspace>
  );
}

const verified = D.valueItems.filter((v) => v.status === "Verified");
const indicative = D.valueItems.filter((v) => v.status === "Indicative");
const sum = (xs: { inrPerMonth: number }[]) => xs.reduce((a, b) => a + b.inrPerMonth, 0);

function OverviewValue() {
  const lotsCaught = D.lots.filter((l) => l.riskWord === "At risk").length;
  return (
    <div className="stack" style={{ marginBottom: "var(--space-5)" }}>
      <KpiRow label="Value at this plant's prices" items={[
        { label: "Verified", value: lakh(sum(verified)), unit: "/month", tags: <Illustrative />, foot: <>{verified.length} measured changes. Open Owner for the proof.</>, href: "/?view=owner" },
        { label: "Indicative", value: lakh(sum(indicative)), unit: "/month", tags: <Illustrative />, foot: <>Still being measured. Kept separate from Verified.</>, href: "/?view=owner" },
        { label: "Lots caught early", value: String(lotsCaught), foot: <>Flagged this week, before discharge</>, href: "/quality" },
      ]} />
    </div>
  );
}

function placeOf(i: (typeof D.inboxItems)[number]): string | undefined {
  if (i.kind === "proposal") {
    const p = D.byId.proposal(i.ref);
    return p ? D.byId.asset(p.assetId)?.name ?? D.byId.line(p.lineId)?.short : undefined;
  }
  if (i.kind === "correction") {
    const c = D.byId.correction(i.ref);
    return c ? D.byId.line(c.toLineId)?.short : undefined;
  }
  if (i.kind === "trial-signature") {
    const t = D.byId.trial(i.ref);
    return t ? D.byId.line(t.lineId)?.short : undefined;
  }
  return undefined;
}

function Overview() {
  const role = demoRole();
  const waiting = D.inboxItems.filter((i) => i.bucket === "waiting");
  const nextProposal = D.proposals.find((p) => p.state === "Waiting");
  return (
    <div className="stack">
      <WorkingOn />
      <LineStrip />
      <p className="secondary" style={{ margin: 0 }}>On Line A, hold step is the mix hold. Quality holds stay on the Quality page.</p>
      <div className="grid">
        <div className="span-8 stack-sm">
          <Section title="Next decision" meta="Approval only through the card" actions={<Link className="link" href="/inbox">Open Inbox</Link>}>
            {nextProposal ? <DecisionCard p={nextProposal} role={role} href="/inbox/in-1" variant="compact" /> : <EmptyState title="Nothing waiting" body="When the agent needs a person, the card appears here." />}
          </Section>
          <Section title="Waiting for a person" meta={`${waiting.length} open`} flush>
            <div className="rows">
              {waiting.map((i) => (
                <Link key={i.id} href={`/inbox/${i.id}`} className="row" style={{ gridTemplateColumns: "minmax(0,1fr)" }}>
                  <span style={{ minWidth: 0 }}>
                    <span className="row-title" style={{ display: "block" }}>{i.title}</span>
                    <span className="row-sub">{[placeOf(i), D.byId.role(i.owner).name, i.due ? `due ${rel(i.due)}` : ""].filter(Boolean).join(" · ")}</span>
                  </span>
                </Link>
              ))}
            </div>
          </Section>
        </div>
        <div className="span-4">
          <Section title="My day" meta="Actions, messages and notes for this shift">
            <DeskDayList items={deskToday} />
          </Section>
        </div>
      </div>
    </div>
  );
}

function PlantView({ role }: { role: RoleId }) {
  const waiting = D.proposals.filter((p) => p.state === "Waiting");
  const seeValue = grant(role, "see-plant-value") !== "hidden";
  return (
    <div className="stack">
      <KpiRow label="Plant today" items={[
        { label: "Needs a decision", value: String(D.inboxItems.filter((i) => i.bucket === "waiting").length), foot: <>{waiting.length} proposals, 1 trial signature, 1 correction</>, href: "/inbox" },
        { label: "Lines", value: "2", foot: <>1 trial, 1 proposing, 0 recommend-only</> },
        { label: "Lots at risk", value: String(D.lots.filter((l) => l.riskWord === "At risk").length), foot: <>of {D.lots.filter((l) => l.status !== "complete").length} open lots</>, href: "/quality" },
        seeValue
          ? { label: "Verified value", value: lakh(sum(verified)), unit: "/month", tags: <Illustrative />, foot: <>Indicative shown on the owner view</>, href: "/?view=owner" }
          : { label: "Verified changes", value: String(verified.length), foot: <>Value hidden for this role</> },
      ]} />
      <LineStrip />
      <div className="grid">
        <div className="span-8 stack">
          <Section title="Needs a decision" meta={`${waiting.length} proposals inside signed limits`} actions={<Link className="link" href="/inbox">Open Inbox</Link>} flush>
            <div className="stack-sm" style={{ padding: "var(--space-3)" }}>
              <DecisionCard p={waiting[0]} role={role} href="/inbox/in-1" />
              {waiting.slice(1).map((p) => (
                <Link key={p.id} href={`/inbox/${D.inboxItems.find((i) => i.ref === p.id)!.id}`} className="row card row-proposal" style={{ gridTemplateColumns: "minmax(0,1fr) auto auto auto" }}>
                  <span style={{ minWidth: 0 }}>
                    <span className="row-title" style={{ display: "block" }}>{D.inboxItems.find((i) => i.ref === p.id)!.title}</span>
                    <span className="row-sub">{D.byId.line(p.lineId)!.short} · {p.predicted.name} {p.predicted.low} to {p.predicted.high} {p.predicted.unit} · {p.weakestLabel}</span>
                  </span>
                  <ModeTag mode={p.mode} />
                  <span className="muted" style={{ fontSize: 12 }}>expires {rel(p.expiresAt)}</span>
                  <span className="link" style={{ fontSize: 13 }}>Review</span>
                </Link>
              ))}
            </div>
          </Section>
        </div>
        <div className="span-4 stack">
          <Section title="Stamped did this shift" meta="Shift 1, 06:00 to 14:00" flush><ShiftTimeline limit={7} /></Section>
          <Section title="Lots at risk" actions={<Link className="link" href="/quality">Quality</Link>} flush><LotsAtRisk /></Section>
          <Section title="Proof updates" meta="Evidence on demand" flush><ProofUpdates /></Section>
        </div>
      </div>
    </div>
  );
}

function ShiftView({ role }: { role: RoleId }) {
  const open = D.inboxItems.filter((i) => i.bucket !== "decided");
  return (
    <div className="stack">
      <KpiRow label="Shift" items={[
        { label: "Open items", value: String(open.length), foot: <>{open.filter((o) => o.bucket === "waiting").length} waiting, {open.filter((o) => o.bucket === "task").length} tasks</>, href: "/inbox" },
        { label: "Accepted last shift", value: "2", foot: <>1 under standing approval</> },
        { label: "Stops last 7 days", value: String(D.stopEvents.length), foot: <>Last: {D.stopEvents[0].by}, {rel(D.stopEvents[0].at)}</> },
        { label: "Plant Box lease", value: "Connected", foot: <>At most 4 h offline, then recommend-only</> },
      ]} />
      <div className="grid">
        <div className="span-7 stack">
          <Section title="Shift 1 timeline" meta="06:00 to 14:00 IST" flush><ShiftTimeline /></Section>
          <Section title="Running settings" meta="Every value Stamped has written, inside its band" flush>
            <DataTable caption="Running settings" rowKey={(r) => r.lineId + r.param} rows={D.runningSettings} columns={[
              { key: "line", label: "Line", render: (r) => D.byId.line(r.lineId)!.short },
              { key: "p", label: "Setting", render: (r) => r.name },
              { key: "v", label: "Value", align: "right", render: (r) => `${r.value} ${r.unit}` },
              { key: "b", label: "Band", align: "right", render: (r) => `${r.band[0]} to ${r.band[1]}` },
              { key: "m", label: "Mode", render: (r) => <ModeTag mode={r.mode} /> },
              { key: "w", label: "Written", mono: true, render: (r) => rel(r.writtenAt) },
            ]} />
          </Section>
        </div>
        <div className="span-5 stack">
          <Section title="Handover" meta={`${D.notes[0].title} · written by Stamped, cited`} actions={<Link className="link" href="/ask">Ask</Link>} flush><NoteClaims id="note-1" /></Section>
          <Section title="Open for this shift" flush>
            <div className="rows">
              {open.map((i) => (
                <Link key={i.id} href={`/inbox/${i.id}`} className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
                  <span className="row-title">{i.title}</span>
                  {i.bucket === "waiting" ? <Tag tone="accent">Decision</Tag> : <Tag>Task</Tag>}
                </Link>
              ))}
            </div>
          </Section>
          {!can(role, "revoke-lease") ? null : (
            <Section title="Lease"><span className="secondary" style={{ fontSize: 13 }}>You can revoke the offline lease on site from Plant, Plant Box.</span></Section>
          )}
        </div>
      </div>
    </div>
  );
}

function LineView({ role, lineId }: { role: RoleId; lineId: string }) {
  const line = D.byId.line(lineId)!;
  const next = D.proposals.find((p) => p.lineId === lineId && p.state === "Waiting");
  const settings = D.runningSettings.filter((s) => s.lineId === lineId);
  const trial = D.trials.find((t) => t.lineId === lineId && t.status === "running");
  const writes = D.setpointWrites.filter((w) => w.param === (lineId === "line-a" ? "hold-temp" : "cycle-time") && D.runs.find((r) => r.id === w.runId)?.lineId === lineId).slice(-6).reverse();
  return (
    <div className="stack">
      <div className="line-pick">
        {D.lines.map((l) => <Link key={l.id} href={`/?view=line&line=${l.id}`} className={`btn btn-sm${l.id === lineId ? " btn-accent" : ""}`} aria-current={l.id === lineId ? "page" : undefined}>{l.name}</Link>)}
        <span className="secondary">{line.product} · {line.status}</span>
        <LineModeTag mode={line.mode} />
      </div>
      <div className="grid">
        <div className="span-8 stack">
          {next ? <DecisionCard p={next} role={role} variant="operator" href={`/inbox/${D.inboxItems.find((i) => i.ref === next.id)!.id}`} />
            : <Section title="Next proposal"><EmptyState title="No proposal waiting" body="The line is running inside its signed band. A proposal appears here when the next run can do better." /></Section>}
          <Section title="Current settings" meta="Inside the signed band" flush>
            <div className="fit-cols" style={{ display: "grid", gridTemplateColumns: `repeat(${settings.length}, minmax(0,1fr))` }}>
              {settings.map((s, i) => {
                const w = D.byId.window(lineId, s.param)!;
                return (
                  <div key={s.param} style={{ padding: "var(--space-4)", borderLeft: i ? "1px solid var(--border)" : undefined }}>
                    <LimitsBand name={s.name} unit={s.unit} signed={[w.low, w.high]} narrowed={w.narrowedLow !== undefined ? [w.narrowedLow, w.narrowedHigh!] : undefined}
                      current={s.value} signedBy={w.signedBy} signedAt={dayMonth(w.signedAt)} large legend={false} />
                    <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}><ModeTag mode={s.mode} /><span className="muted" style={{ fontSize: 12 }}>written {rel(s.writtenAt)}</span></div>
                  </div>
                );
              })}
            </div>
          </Section>
        </div>
        <div className="span-4 stack">
          <section className="section">
            <div className="section-head"><h2>{trial ? "Trial running" : "Stop"}</h2>{trial ? <span className="section-meta">{nameOf(trial.id)}</span> : null}</div>
            <div className="section-body stack-sm" style={{ fontSize: 14 }}>
              {trial ? <><div style={{ fontWeight: 500 }}>{trial.change}</div><div className="secondary">{trial.switches.filter((s) => s.done).length} of 16 batches done · restore target {Object.values(trial.restoreTarget)[0]} °C</div></> : null}
              <div className="secondary">{trial ? "Stop restores the checked prior value from the next batch. If restore fails the line goes recommend-only." : "Stop keeps the current values and writes nothing new until a person decides."}</div>
            </div>
            <CardActions actions={[]} large stop={{ effect: trial ? "Prior value 84 °C restores from the next batch." : "Values kept; nothing new is written.", allowed: can(role, "press-stop", lineId), reason: deniedReason("press-stop", "press Stop") }} />
          </section>
          <Section title="This shift" meta={line.short} flush>
            <div className="fit-cols" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))" }}>
              {line.kpis.map((k, i) => <div key={k.label} className="kpi" style={{ borderLeft: i ? undefined : 0 }}><span className="label">{k.label}</span><div className="kpi-value" style={{ fontSize: 20 }}>{k.value}{k.unit ? <span className="unit">{k.unit}</span> : null}</div></div>)}
            </div>
          </Section>
          <Section title="Recent writes" meta={line.short} flush>
            <div className="rows">
              {writes.map((w) => (
                <div key={w.runId} className="row" style={{ gridTemplateColumns: "84px minmax(0,1fr) auto" }}>
                  <span className="mono">{w.runId.replace("run-a-", "Batch ").replace("run-b-", "Run ")}</span>
                  <span className="secondary">{w.value} {lineId === "line-a" ? "°C" : "s"} · {w.source}</span>
                  {w.status === "written" ? <Tag>Written</Tag> : <Tag tone="warning" title={w.reason}>Skipped</Tag>}
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function OwnerView({ role }: { role: RoleId }) {
  if (grant(role, "see-plant-value") === "hidden") {
    return <Section title="Value"><EmptyState title="Value is outside this role's scope" body="Owners and the plant head see value at the plant's prices. Ask your plant head for access." /></Section>;
  }
  const weeks = ["W35", "W36", "W37", "W38", "W39", "W40", "W41", "W42"];
  const lotsCaught = D.lots.filter((l) => l.riskWord === "At risk").length;
  return (
    <div className="stack">
      <KpiRow label="Value at the plant's prices" items={[
        { label: "Verified", value: lakh(sum(verified)), unit: "/month", tags: <><Tag tone="success">R3 to R4</Tag><Illustrative /></>, foot: <>{verified.length} changes, each with a proof record</>, href: proofHref(verified[0].proofRecordId) },
        { label: "Indicative", value: lakh(sum(indicative)), unit: "/month", tags: <><Tag>R2</Tag><Illustrative /></>, foot: <>Not yet verified, never added to Verified</>, href: proofHref(indicative[0].proofRecordId) },
        { label: "Changes verified", value: String(verified.length), foot: <>of {D.proofRecords.length} measured, incl. 2 no change, 1 inconclusive</> },
        { label: "Lots caught early", value: String(lotsCaught), foot: <>this week, before discharge</>, href: "/quality" },
      ]} />
      <div className="grid">
        <div className="span-8 stack">
          <Section title="Value by week" meta="₹ thousand, Verified filled, Indicative outlined, side by side and never stacked" actions={<Illustrative />}>
            <PairedBars a={D.verifiedWeekly} b={D.indicativeWeekly} labels={weeks} width={760} height={168} label="Verified and Indicative value by week" />
            <div className="limits-legend" style={{ marginTop: 8 }}>
              <span><i style={{ background: "var(--accent-500)" }} />Verified</span>
              <span><i style={{ border: "1px dashed var(--text-muted)" }} />Indicative</span>
            </div>
          </Section>
          <Section title="Value left on the table" meta={`${A.idleProposals.length} proposals nobody has decided`} actions={<Link className="link" href="/activity/summary">Summary</Link>} flush>
            <div className="idle-total">
              <div><span className="label">Lost per week while they wait</span><b>{inr(A.idleProposals.reduce((a, p) => a + A.idleInr(p).perWeek, 0))}</b></div>
              <div><span className="label">Lost so far</span><b>{inr(A.idleProposals.reduce((a, p) => a + A.idleInr(p).lostSoFar, 0))}</b></div>
              <div><span className="label">Worth per month if accepted</span><b>{inr(A.idleProposals.reduce((a, p) => a + A.idleInr(p).perMonth, 0))}</b><Illustrative /></div>
            </div>
            <IdleList rupees role={role} />
          </Section>
          <Section title="Where the value comes from" meta="Every figure opens its proof record" flush>
            <DataTable caption="Value items" rowKey={(v) => v.id} rows={D.valueItems} columns={[
              { key: "t", label: "Change", render: (v) => <span style={{ fontWeight: 500 }}>{v.title}</span> },
              { key: "l", label: "Line", render: (v) => D.byId.line(v.lineId)!.short },
              { key: "s", label: "Status", render: (v) => <Tag tone={v.status === "Verified" ? "success" : "neutral"}>{v.status} {v.rung}</Tag> },
              { key: "b", label: "Basis", render: (v) => <span className="secondary">{v.basis}</span> },
              { key: "v", label: "Per month", align: "right", render: (v) => inr(v.inrPerMonth) },
              { key: "p", label: "Proof", render: (v) => <Link className="link" href={proofHref(v.proofRecordId)}>Evidence</Link> },
            ]} />
          </Section>
        </div>
        <div className="span-4 stack">
          <Section title="Plant-wide context" flush>
            <div className="rows">
              {D.lines.map((l) => (
                <Link key={l.id} href={`/process?line=${l.id}`} className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
                  <span><span className="row-title" style={{ display: "block" }}>{l.name}</span><span className="row-sub">{l.status}</span></span>
                  <LineModeTag mode={l.mode} />
                </Link>
              ))}
              <div className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto", padding: "var(--space-3) var(--space-4)" }}>
                <span className="secondary">Proof ladder</span>
                <span style={{ display: "flex", gap: 6 }}>{(["R0", "R1", "R2", "R3", "R4"] as const).map((r) => <Tag key={r} tone={r >= "R3" ? "success" : "neutral"}>{r} {D.proofRecords.filter((p) => p.rung === r).length}</Tag>)}</span>
              </div>
            </div>
          </Section>
          <Section title="What happened recently" actions={<Link className="link" href="/activity">Activity</Link>} flush><RecentActivity limit={7} /></Section>
          <Section title="Latest verdicts" flush>
            <div className="rows">
              {D.proofRecords.slice(1, 4).map((p) => (
                <Link key={p.id} className="row" href={proofHref(p.id)} style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span className="row-title">{p.title}</span><VerdictTag verdict={p.verdict} /></Link>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
