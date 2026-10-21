/** Ask page frame: history scrolls in its own column, one centred column (max 760 px), input pinned at the bottom. */
import type { ReactNode } from "react";
import { Workspace } from "@/components/shell/Shell";
import { EvidenceSheet } from "@/components/evidence/EvidenceSheet";
import { EvidenceItemSheet, crumbs } from "./common";
import { History, stepFor, suggestions } from "./convo";
import { Composer } from "./AskClient";
import { AskMobileBar, FollowNewest } from "./AskMobile";
import { Suspense } from "react";

export type AskSP = { q?: string; evidence?: string; ev?: string; h?: string; hist?: string; state?: string };
export const steps = () => Object.fromEntries(suggestions().map((s) => [s.q, stepFor(s.q)]));

export function AskPage({ title, base, sp, current, children, composer = true }: { title: string; base: string; sp: AskSP; current?: string; children: ReactNode; composer?: boolean | "mobile" }) {
  const keep = (extra: Record<string, string | undefined>) => { const p = new URLSearchParams(Object.entries({ q: sp.q, h: sp.h, ...extra }).filter(([, v]) => v) as [string, string][]).toString(); return p ? `${base}${base.includes("?") ? "&" : "?"}${p}` : base; };
  const close = keep({});
  return (
    <Workspace crumbs={crumbs(...(title === "Ask" ? [] : [{ label: title }]))} askContext={title}>
      <div className="askx">
        <Suspense fallback={null}><AskMobileBar title={title}><History current={current} filter={sp.h} base={keep({ h: undefined })} /></AskMobileBar><FollowNewest /></Suspense>
        <aside className="askx-hist"><History current={current} filter={sp.h} base={keep({ h: undefined })} /></aside>
        <div className="askx-main">
          <div className="askx-col">{children}</div>
          {composer && <div className={`askx-pin${composer === "mobile" ? " m-only" : ""}`}><div className="askx-col"><Composer steps={steps()} footnote /></div></div>}
        </div>
      </div>
      {sp.evidence ? <EvidenceSheet proofId={sp.evidence} closeHref={close} /> : null}
      {sp.ev ? <EvidenceItemSheet id={sp.ev} closeHref={close} /> : null}
    </Workspace>
  );
}
