/** Foundation primitives. Server components; no client state. Colour never appears without a word (design system R9). */
import Link from "next/link";
import type { ReactNode } from "react";
import type { EvidenceLabel, LineMode, Mode, Verdict } from "@/lib/demo/types";

export type Tone = "neutral" | "info" | "warning" | "critical" | "success" | "accent";

export function Tag({ tone = "neutral", dot, children, title }: { tone?: Tone; dot?: boolean; children: ReactNode; title?: string }) {
  return <span className={`tag${tone === "neutral" ? "" : ` tag-${tone}`}`} title={title}>{dot ? <span className="dot" /> : null}{children}</span>;
}

const MODE_TONE: Record<Mode, Tone> = { Trial: "info", Stay: "neutral", "Recommend-only": "warning", Stopped: "critical" };
export function ModeTag({ mode }: { mode: Mode }) {
  return <Tag tone={MODE_TONE[mode]}>{mode}</Tag>;
}

const LINE_TONE: Record<LineMode, Tone> = { Watching: "neutral", Proposing: "accent", "Standing approval": "success", Trial: "info", "Recommend-only": "warning" };
export function LineModeTag({ mode }: { mode: LineMode }) {
  return <Tag tone={LINE_TONE[mode]} dot>{mode}</Tag>;
}

const EV_TONE: Record<EvidenceLabel, Tone> = { Measured: "neutral", Estimated: "neutral", Modelled: "neutral", Assumed: "warning", Unknown: "warning" };
export function EvidenceTag({ label }: { label: EvidenceLabel }) {
  return <Tag tone={EV_TONE[label]} title={`Evidence label: ${label}`}>{label}</Tag>;
}

const VERDICT_TONE: Record<Verdict, Tone> = { Improved: "success", "No change": "neutral", Worse: "critical", Inconclusive: "warning", Withheld: "neutral" };
export function VerdictTag({ verdict }: { verdict: Verdict }) {
  return <Tag tone={VERDICT_TONE[verdict]}>{verdict}</Tag>;
}

export function Illustrative() {
  return null;
}

export function PageHeader({ eyebrow, title, meta, actions, brand }: { eyebrow?: string; title: string; meta?: ReactNode; actions?: ReactNode; brand?: boolean }) {
  return (
    <header className="page-head">
      <div>
        {eyebrow ? <div className="label eyebrow">{eyebrow}</div> : null}
        <h1 className={brand ? "brand" : undefined}>{title}</h1>
        {meta ? <div className="head-meta">{meta}</div> : null}
      </div>
      {actions ? <div className="head-actions">{actions}</div> : null}
    </header>
  );
}

export interface TabItem { href: string; label: string; count?: number; active?: boolean }
export function Tabs({ items, label }: { items: TabItem[]; label: string }) {
  return (
    <nav className="tabs" aria-label={label}>
      {items.map((t) => (
        <Link key={t.href} href={t.href} className="tab" aria-current={t.active ? "page" : undefined} scroll={false}>
          {t.label}{t.count !== undefined ? <span className="count">{t.count}</span> : null}
        </Link>
      ))}
    </nav>
  );
}

export function Section({ title, meta, actions, children, flush, className, id }: { title: string; meta?: ReactNode; actions?: ReactNode; children: ReactNode; flush?: boolean; className?: string; id?: string }) {
  return (
    <section className={`section${className ? ` ${className}` : ""}`} aria-labelledby={id ? `${id}-h` : undefined} id={id}>
      <div className="section-head">
        <h2 id={id ? `${id}-h` : undefined}>{title}</h2>
        {meta ? <span className="section-meta">{meta}</span> : null}
        {actions ? <div className="section-actions">{actions}</div> : null}
      </div>
      <div className={`section-body${flush ? " flush" : ""}`}>{children}</div>
    </section>
  );
}

export interface Kpi { label: string; value: string; unit?: string; tags?: ReactNode; foot?: ReactNode; href?: string }
/** KPI row (design system §9.13). Three or four figures, each with its label and status. Not a hero strip. */
export function KpiRow({ items, label }: { items: Kpi[]; label: string }) {
  return (
    <div className="kpis" role="group" aria-label={label}>
      {items.map((k) => {
        const inner = (
          <>
            <div className="kpi-top"><span className="label">{k.label}</span>{k.tags}</div>
            <div className="kpi-value">{k.value}{k.unit ? <span className="unit">{k.unit}</span> : null}</div>
            {k.foot ? <div className="kpi-foot">{k.foot}</div> : null}
          </>
        );
        return <div className="kpi" key={k.label}>{k.href ? <Link className="kpi-link" href={k.href}>{inner}</Link> : inner}</div>;
      })}
    </div>
  );
}

export interface Column<R> { key: string; label: string; align?: "left" | "right"; mono?: boolean; width?: number | string; render: (r: R) => ReactNode }
export function DataTable<R>({ columns, rows, rowKey, caption }: { columns: Column<R>[]; rows: R[]; rowKey: (r: R) => string; caption: string }) {
  if (rows.length === 0) return <EmptyState title="Nothing here yet" body={`${caption}: no rows in this view.`} />;
  return (
    <table className="table">
      <caption className="sr-only">{caption}</caption>
      <thead><tr>{columns.map((c) => <th key={c.key} className={c.align === "right" ? "right" : undefined} style={c.width ? { width: c.width } : undefined}>{c.label}</th>)}</tr></thead>
      <tbody>
        {rows.map((r) => (
          <tr key={rowKey(r)}>{columns.map((c) => <td key={c.key} className={[c.align === "right" ? "right num" : "", c.mono ? "mono" : ""].join(" ").trim() || undefined}>{c.render(r)}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return <div className="empty"><h3>{title}</h3><p>{body}</p>{action}</div>;
}

export function StaleState({ since, what }: { since: string; what: string }) {
  return <div className="stale" role="status"><Tag tone="warning">Stale</Tag>{what}. Last good data {since}.</div>;
}

export function EvidenceIds({ ids, proofHref }: { ids: string[]; proofHref?: string }) {
  return <div className="evid">{ids.map((id) => <a key={id} href={proofHref ?? `#${id}`} title="Open evidence">{id}</a>)}</div>;
}
