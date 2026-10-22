"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Fragment } from "react";
import { nameOf } from "@/lib/names";
import Link from "next/link";
import * as D from "@/lib/demo/data";
import { dayMonth, hhmm } from "@/lib/format";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { DataTable, EvidenceTag, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { EvidenceSheet } from "@/components/evidence/EvidenceSheet";
import { AskTabs, EvidenceChip, EvidenceItemSheet, citations, crumbs, evHref, proofFor, weakest, FilterBar, matches, lineShort } from "@/components/ask/common";

export default function Notes() {
  const sp = Object.fromEntries(useSearchParams().entries());
  const list = D.notes.filter((x) => matches(x, sp.line, sp.topic));
  const n = D.notes.find((x) => x.id === sp.id) ?? list[0] ?? D.notes[0];
  const keep = new URLSearchParams(Object.entries({ line: sp.line, topic: sp.topic }).filter(([, v]) => v) as [string, string][]).toString();
  const base = `/ask/notes?${keep ? keep + "&" : ""}id=${n.id}`;
  const waits = D.inboxItems.filter((i) => i.bucket === "waiting");
  const decided = D.auditEvents.filter((a) => /Accepted|Declined|Signed|Confirmed|Sent|Pressed/.test(a.action)).slice(0, n.kind === "weekly" ? 8 : 5);
  const cites = citations(n.claims);
  return (
    <Workspace crumbs={crumbs({ label: "Handover and weekly note" })} askContext={n.title}>
      <PageHeader eyebrow="Ask" title="Handover and weekly note" meta="Drafted by Stamped from the shift's records; every claim cites its evidence. A person reads and sends it." actions={<><Link className="btn btn-sm" href="/activity">Export via Activity</Link><AskButton context={n.title} label="Ask about this note" /></>} />
      <AskTabs active="notes" />
      <FilterBar base="/ask/notes" line={sp.line} topic={sp.topic} />
      <div className="grid">
        <div className="span-3 stack">
          <Section title="Notes" flush>
            <div>{(["handover", "weekly"] as const).map((k) => { const g = list.filter((x) => x.kind === k); return g.length ? <div key={k}><div className="group-h">{k === "handover" ? "Shift handovers" : "Weekly notes"} · {g.length}</div><div className="rows hist">{g.map((x) => <Link key={x.id} href={`/ask/notes?${keep ? keep + "&" : ""}id=${x.id}`} scroll={false} className={`row${x.id === n.id ? " on" : ""}`} style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span><span className="row-title" style={{ display: "block" }}>{x.title}</span><span className="row-sub">{dayMonth(x.at)} · {lineShort(x.lineId)}{x.topic ? ` · ${x.topic}` : ""}</span></span><EvidenceTag label={weakest(x.claims)} /></Link>)}</div></div> : null; })}{!list.length ? <p className="muted" style={{ margin: 16, fontSize: 13 }}>No notes match these filters.</p> : null}</div>
          </Section>
          <Section title="Shifts">
            <dl className="facts-grid">{D.shifts.map((s) => <Fragment key={s.id}><dt>{s.name}</dt><dd>{s.start} to {s.end}</dd></Fragment>)}</dl>
          </Section>
        </div>
        <div className="span-6 stack">
          <Section title={n.title} meta={`${n.kind === "handover" ? "Shift handover" : "Weekly note"} · ${lineShort(n.lineId)}${n.topic ? ` · ${n.topic}` : ""} · drafted ${dayMonth(n.at)} ${hhmm(n.at)}`} actions={<EvidenceTag label={weakest(n.claims)} />}>
            <div className="stack">
              <div className="note-sec"><h3>What changed</h3>
                <ol className="claims">{n.claims.map((c, i) => <li key={i}>{c.text}<span className="claim-ev">{c.evidenceIds.map((e) => <EvidenceChip key={e} id={e} label={c.label} base={base} />)}</span></li>)}</ol></div>
              <div className="note-sec"><h3>What waits</h3>
                <div className="rows">{waits.map((w) => <Link key={w.id} className="row" href={`/inbox/${w.id}`} style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span className="row-title">{w.title}</span><Tag>{w.kind.replace("-", " ")}</Tag></Link>)}</div></div>
              <div className="note-sec"><h3>Decisions taken</h3>
                <DataTable caption="Decisions" rowKey={(a) => a.id} rows={decided} columns={[
                  { key: "a", label: "Action", render: (a) => a.action },
                  { key: "o", label: "On", render: (a) => nameOf(a.objectId) },
                  { key: "r", label: "Role", render: (a) => a.role },
                  { key: "t", label: "At", mono: true, render: (a) => `${dayMonth(a.at)} ${hhmm(a.at)}` },
                ]} /></div>
            </div>
          </Section>
        </div>
        <div className="span-3 stack ctx">
          <Section title="Cited items" meta={`${cites.length} evidence ids`} flush>
            <div className="rows">{cites.map((c) => <Link key={c.id} className="row" href={evHref(base, c.id)} scroll={false} style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span><span className="row-title mono" style={{ display: "block" }}>{nameOf(c.id)}</span><span className="row-sub">{c.texts[0]}</span></span><span style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}><EvidenceTag label={c.label} />{proofFor(c.id) ? <span className="muted" style={{ fontSize: 11 }}>{proofFor(c.id)!.title}</span> : null}</span></Link>)}</div>
          </Section>
          <Section title="Shift events used" flush>
            <ul className="tl" style={{ padding: "8px 16px" }}>{D.shiftEvents.slice(-7).map((e) => <li key={e.at + e.text}><span className="t">{hhmm(e.at)}</span><span className={`k ${e.kind === "stop" ? "x" : "s"}`} /><span>{e.text}</span><span /></li>)}</ul>
          </Section>
          <Section title="How it is drafted">
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>
              <li>From shift events, cards and proof records</li>
              <li>Uncited numbers are removed</li>
              <li>The person sending it can edit before export</li>
            </ul>
          </Section>
        </div>
      </div>
      {sp.evidence ? <EvidenceSheet proofId={sp.evidence} closeHref={base} /> : null}
      {sp.ev ? <EvidenceItemSheet id={sp.ev} closeHref={base} /> : null}
    </Workspace>
  );
}
