/** Rich Ask answer: headings, inline charts, flows and tables, evidence chips, what the agent proposes next, follow-ups. */
import Link from "next/link";
import { RunChart } from "@/components/ui/charts";
import { EvidenceTag } from "@/components/ui/primitives";
import { Assign } from "@/components/agent/Assign";
import * as A from "@/lib/demo/agent";
import type { RoleId } from "@/lib/demo/types";
import type { Block, RichTurn } from "@/lib/demo/askRich";
import { SequenceMascot } from "@/components/mascot/StampedMascot";

function Band({ b, scale, now }: { b: [number, number]; scale: [number, number]; now?: boolean }) {
  const p = (v: number) => ((v - scale[0]) / (scale[1] - scale[0])) * 100;
  return <span className="rb-track"><span className={`rb-band${now ? " now" : ""}`} style={{ left: `${p(b[0])}%`, width: `${Math.max(2, p(b[1]) - p(b[0]))}%` }} /></span>;
}

function BlockView({ b }: { b: Block }) {
  switch (b.k) {
    case "h": return <h3 className="rb-h">{b.t}</h3>;
    case "p": return <p className="rb-p">{b.t}</p>;
    case "ul": return <ul className="rb-ul">{b.items.map((i) => <li key={i}>{i}</li>)}</ul>;
    case "trend": return <figure className="rb-fig"><figcaption>{b.title}<span className="muted"> · spec {b.spec[0]} to {b.spec[1]} {b.unit}</span></figcaption><RunChart values={b.values} spec={b.spec} height={110} width={600} label={b.title} highlightFrom={b.from} /></figure>;
    case "compare": return <figure className="rb-fig"><figcaption>{b.title}</figcaption>
      <div className="rb-cmp">{b.rows.map((r) => <div key={r.m} className="rb-cmp-row"><span className="rb-m">{r.m}</span>
        <div className="rb-pair"><span className="rb-k">Before</span><Band b={r.before} scale={r.scale} /><span className="rb-v">{r.before[0]} to {r.before[1]}</span></div>
        <div className="rb-pair"><span className="rb-k">After</span><Band b={r.after} scale={r.scale} now /><span className="rb-v">{r.after[0]} to {r.after[1]}</span></div></div>)}</div></figure>;
    case "flow": return <div className="rb-flow">{b.nodes.map((n, i) => {
      const inner = <><b>{n.t}</b>{n.sub ? <span>{n.sub}</span> : null}</>;
      return <span key={i} className="rb-flow-i">{i ? <span className="rb-arrow" aria-hidden>→</span> : null}{n.href ? <Link prefetch={false} href={n.href} className={`rb-node${n.flag ? " flag" : ""}`}>{inner}</Link> : <span className={`rb-node${n.flag ? " flag" : ""}`}>{inner}</span>}</span>;
    })}</div>;
    case "table": return <div className="rb-tw"><table className="rb-t"><thead><tr>{b.head.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{b.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{typeof c === "string" ? c : <Link prefetch={false} className="link" href={c.href}>{c.t}</Link>}</td>)}</tr>)}</tbody></table></div>;
  }
}

export function RichTurnView({ t, idx, role }: { t: RichTurn; idx: number; role: RoleId }) {
  return (
    <div className="turn rich" id={`t${idx}`}>
      <div className="q-bubble">{t.q}</div>
      <div className="a-row">
        <span className="a-mascot"><SequenceMascot size={28} label="Stamped assistant" steps={[["thinking", 0.6], ["answering", 2.2], ["success", 0]]} /></span>
        <div className="a-prose">
          {t.blocks.map((b, i) => <BlockView key={i} b={b} />)}
          <div className="rb-conf"><EvidenceTag label={t.label} />{t.band ? <span>band {t.band}</span> : null}</div>
          <div className="rb-ev">{t.ev.map((e) => <Link key={e.id} prefetch={false} href={e.href} className="rb-chip" title={e.what}><EvidenceTag label={e.label} /><span className="mono">{e.id}</span><span className="rb-what">{e.what}</span></Link>)}</div>
          {t.next ? <div className="rb-next"><div><span className="label">Proposed next</span><b>{t.next.title}</b><span className="muted">{t.next.sub}</span></div>
            <div className="rb-next-a"><Link prefetch={false} className="btn btn-sm btn-primary" href={t.next.href}>{t.next.cta}</Link>{t.next.assignable ? <Assign people={A.PEOPLE} canAssign={A.ASSIGNERS.includes(role)} by={A.ME[role] ?? "Plant head A."} /> : null}</div></div> : null}
        </div>
      </div>
      {t.follow.length ? <div className="followups">{t.follow.map((f) => <Link key={f} prefetch={false} href={`/ask?q=${encodeURIComponent(f)}`}>{f}</Link>)}</div> : null}
    </div>
  );
}
