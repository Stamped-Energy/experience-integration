import Link from "next/link";
import * as D from "@/lib/demo/data";
import { currentRole } from "@/lib/role";
import { rel } from "@/lib/format";
import { Workspace } from "@/components/shell/Shell";
import { EmptyState, PageHeader, Section, Tabs, Tag } from "@/components/ui/primitives";
import { InboxCard } from "@/components/inbox/InboxCard";

export const metadata = { title: "Inbox" };
const TABS = [{ id: "waiting", label: "Waiting for me" }, { id: "task", label: "Tasks" }, { id: "decided", label: "Decided" }] as const;
const KIND: Record<string, string> = { proposal: "Proposal", "trial-signature": "Trial signature", "lot-link": "Lot link", "data-gap": "Data gap", correction: "Correction", "lot-risk": "Lot at risk" };

export default async function Inbox({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const sp = await searchParams;
  const role = await currentRole();
  const tab = (TABS.some((t) => t.id === sp.tab) ? sp.tab : "waiting") as (typeof TABS)[number]["id"];
  const heading = TABS.find((t) => t.id === tab)!;
  const items = D.inboxItems.filter((i) => i.bucket === tab);
  const mine = items.filter((i) => i.owner === role);
  const ordered = [...mine, ...items.filter((i) => i.owner !== role)];
  const [first, ...rest] = ordered;
  return (
    <Workspace crumbs={[{ label: "Demonstration plant", href: "/" }, { label: "Inbox" }, { label: heading.label }]} askContext="Inbox">
      <PageHeader eyebrow="Inbox" title={heading.label} meta={`${mine.length} of ${items.length} ${mine.length === 1 ? "is" : "are"} for the ${D.byId.role(role).name.toLowerCase()}. Each one names an owner, a due time and the proof.`} />
      <Tabs label="Inbox" items={TABS.map((t) => ({ href: `/inbox?tab=${t.id}`, label: t.label, count: D.inboxItems.filter((i) => i.bucket === t.id).length, active: t.id === tab }))} />
      <div className="grid">
        <div className="span-8 stack-sm">
          {first ? <InboxCard item={first} role={role} /> : <EmptyState title="Nothing here" body="Items arrive here when an agent needs a person." />}
          {rest.length ? (
            <Section title="Also in this list" meta={`${rest.length} items`} flush>
              <div className="rows">
                {rest.map((i) => (
                  <Link key={i.id} href={`/inbox/${i.id}`} className="row" style={{ gridTemplateColumns: "120px minmax(0,1fr) 140px 64px" }}>
                    <Tag>{KIND[i.kind]}</Tag>
                    <span style={{ minWidth: 0 }}>
                      <span className="row-title" style={{ display: "block" }}>{i.title}</span>
                      {i.bucket === "waiting" && i.due ? <span className="row-sub">expires {rel(i.due)}, then nothing changes</span> : i.due ? <span className="row-sub">due {rel(i.due)}</span> : null}
                    </span>
                    <span className="secondary" style={{ fontSize: 12 }}>{D.byId.role(i.owner).name}{i.owner === role ? " (you)" : ""}</span>
                    <span className="link" style={{ fontSize: 13, textAlign: "right" }}>Open</span>
                  </Link>
                ))}
              </div>
            </Section>
          ) : null}
          <Section title="How decisions work" meta="The same for every card">
            <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6, fontSize: 13 }} className="secondary">
              <li>Stamped works inside limits set beforehand. Every number sits inside a signed band.</li>
              <li>Accept, adjust in band, or decline with a reason. Declines teach the agent.</li>
              <li>Stop always says what it will do before you press it.</li>
              <li>Releasing a hold happens in your quality system, not here.</li>
            </ul>
          </Section>
        </div>
        <div className="span-4 stack">
          <Section title="By owner" meta="Routing from Settings" flush>
            <div className="rows">
              {D.roles.filter((r) => D.inboxItems.some((i) => i.owner === r.id && i.bucket !== "decided")).map((r) => {
                const n = D.inboxItems.filter((i) => i.owner === r.id && i.bucket !== "decided").length;
                return <div key={r.id} className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span>{r.name}{r.id === role ? " (you)" : ""}</span><span className="mono">{n}</span></div>;
              })}
            </div>
          </Section>
          <Section title="Decided recently" flush>
            <div className="rows">{D.inboxItems.filter((i) => i.bucket === "decided").slice(0, 4).map((i) => <Link key={i.id} href={`/inbox/${i.id}`} className="row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span className="row-title" style={{ fontWeight: 400 }}>{i.title}</span><Tag>{D.byId.proposal(i.ref)?.state ?? "Done"}</Tag></Link>)}</div>
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
