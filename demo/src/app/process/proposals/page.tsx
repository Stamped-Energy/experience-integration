import Link from "next/link";
import * as D from "@/lib/demo/data";
import { currentRole } from "@/lib/role";
import { dayMonth, hhmm } from "@/lib/format";
import type { CardState } from "@/lib/demo/types";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { DecisionCard } from "@/components/cards/DecisionCard";
import { DataTable, EmptyState, EvidenceTag, ModeTag, PageHeader, Section, Tabs, Tag } from "@/components/ui/primitives";
import { ProcessTabs, crumbs } from "@/components/process/common";

export const metadata = { title: "Proposals" };
type F = "waiting" | "running" | "closed";
const GROUP: Record<F, CardState[]> = { waiting: ["Waiting", "Proposed"], running: ["Running trial", "Running stay", "Measuring", "Verdict", "Holding"], closed: ["Declined", "Expired", "Withheld", "Abstained", "Stopped"] };

export default async function Proposals({ searchParams }: { searchParams: Promise<{ f?: string; line?: string }> }) {
  const sp = await searchParams;
  const f: F = sp.f === "running" || sp.f === "closed" ? sp.f : "waiting";
  const role = await currentRole();
  const inLine = (lid: string) => !sp.line || sp.line === lid;
  const list = D.proposals.filter((p) => GROUP[f].includes(p.state) && inLine(p.lineId));
  const others = D.proposals.filter((p) => !GROUP[f].includes(p.state) && inLine(p.lineId));
  const q = (x: string, l?: string) => `/process/proposals?f=${x}${l ? `&line=${l}` : ""}`;
  return (
    <Workspace crumbs={crumbs({ label: "Proposals" })} askContext="Process proposals">
      <PageHeader eyebrow="Process" title="Proposals" meta="The optimiser computes the number inside the signed window; the agent explains it. People with the right accept, adjust in band or decline."
        actions={<AskButton context="Process proposals" label="Ask about proposals" />} />
      <ProcessTabs active="proposals" />
      <div className="grid">
        <div className="span-8 xl-span-6 stack">
          <div style={{ display: "flex", gap: 16, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
            <Tabs label="Proposal state" items={(["waiting", "running", "closed"] as F[]).map((x) => ({ href: q(x, sp.line), label: x === "waiting" ? "Waiting" : x === "running" ? "Running and measuring" : "Closed", count: D.proposals.filter((p) => GROUP[x].includes(p.state) && inLine(p.lineId)).length, active: x === f }))} />
            <div className="chips">{[undefined, ...D.lines.map((l) => l.id)].map((l) => <Link key={l ?? "all"} className="chip" aria-current={sp.line === l ? "true" : undefined} href={q(f, l)} scroll={false}>{l ? D.byId.line(l)!.short : "All lines"}</Link>)}</div>
          </div>
          {list.length ? list.map((p) => <DecisionCard key={p.id} p={p} role={role} href={`/process/proposals/${p.id}`} />) : <EmptyState title="Nothing in this view" body="When the optimiser finds a better setting inside the signed window, the proposal appears here." />}
        </div>
        <div className="span-4 xl-span-6 stack">
          <Section title="All proposals, 14 days" meta={`${D.proposals.length} on record`} flush>
            <DataTable caption="All proposals" rowKey={(p) => p.id} rows={[...list, ...others]} columns={[
              { key: "i", label: "Id", mono: true, render: (p) => <Link className="link" href={`/process/proposals/${p.id}`}>{p.id}</Link> },
              { key: "s", label: "Setting", render: (p) => <>{D.byId.window(p.lineId, p.param)?.name}<span className="cell-sub">{D.byId.line(p.lineId)!.short} · {p.current} to {p.proposed}</span></> },
              { key: "st", label: "State", render: (p) => <Tag tone={p.state === "Waiting" ? "accent" : p.state === "Withheld" || p.state === "Declined" ? "neutral" : "info"}>{p.state}</Tag> },
              { key: "m", label: "Mode", render: (p) => <ModeTag mode={p.mode} /> },
              { key: "l", label: "Weakest", render: (p) => <EvidenceTag label={p.weakestLabel} /> },
              { key: "t", label: "Raised", mono: true, render: (p) => `${dayMonth(p.createdAt)} ${hhmm(p.createdAt)}` },
            ]} />
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
