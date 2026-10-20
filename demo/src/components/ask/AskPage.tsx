/** Ask page frame: collapsible history on the left, one centred column (max 760 px), input pinned at the bottom. */
import Link from "next/link";
import type { ReactNode } from "react";
import { Workspace } from "@/components/shell/Shell";
import { EvidenceSheet } from "@/components/evidence/EvidenceSheet";
import { EvidenceItemSheet, crumbs } from "./common";
import { History, stepFor, suggestions } from "./convo";
import { Composer } from "./AskClient";

export type AskSP = { q?: string; evidence?: string; ev?: string; h?: string; hist?: string; state?: string };
export const steps = () => Object.fromEntries(suggestions().map((s) => [s.q, stepFor(s.q)]));

export function AskPage({ title, base, sp, current, children, composer = true }: { title: string; base: string; sp: AskSP; current?: string; children: ReactNode; composer?: boolean }) {
  const off = sp.hist === "off";
  const keep = (extra: Record<string, string | undefined>) => { const p = new URLSearchParams(Object.entries({ q: sp.q, h: sp.h, hist: sp.hist, ...extra }).filter(([, v]) => v) as [string, string][]).toString(); return p ? `${base}${base.includes("?") ? "&" : "?"}${p}` : base; };
  const close = keep({});
  return (
    <Workspace crumbs={crumbs(...(title === "Ask" ? [] : [{ label: title }]))} askContext={title}>
      <div className={`askx${off ? " hist-off" : ""}`}>
        {!off && <aside className="askx-hist"><History current={current} filter={sp.h} base={keep({ h: undefined })} /><Link className="link h-toggle" scroll={false} prefetch={false} href={keep({ hist: "off" })}>Hide history</Link></aside>}
        <div className="askx-main">
          {off && <Link className="link h-toggle" scroll={false} prefetch={false} href={keep({ hist: undefined })}>Show history</Link>}
          <div className="askx-col">{children}</div>
          {composer && <div className="askx-pin"><div className="askx-col"><Composer steps={steps()} footnote /></div></div>}
        </div>
      </div>
      {sp.evidence ? <EvidenceSheet proofId={sp.evidence} closeHref={close} /> : null}
      {sp.ev ? <EvidenceItemSheet id={sp.ev} closeHref={close} /> : null}
    </Workspace>
  );
}
