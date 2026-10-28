import Link from "next/link";
import * as D from "@/lib/demo/data";
import { toolLifeCards } from "@/lib/demo/toolLife";
import { AbstainNote } from "@/components/ask/common";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { EvidenceTag, Illustrative, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { ProcessTabs, crumbs } from "@/components/process/common";

export const metadata = { title: "Tool life" };

export default function ToolLifePage() {
  const press = D.byId.asset("b-press")!;
  return (
    <Workspace crumbs={crumbs({ label: "Tool life" })} askContext="Process tool life">
      <PageHeader
        eyebrow="Process"
        title="Tool life"
        meta="Taylor estimates appear only after enough indexed tool changes with speed and feed logged. Stamped abstains rather than invent n or C."
        actions={<AskButton context="Tool life on Line B" label="Ask about tool life" />}
      />
      <ProcessTabs active="tool-life" />
      <div className="grid">
        <div className="span-8 xl-span-9 stack">
          <Section title="Tools on Press P3" meta={press.name} actions={<><Tag tone="neutral">Illustrative</Tag><Link className="link" href="/plant/assets/b-press">Asset detail</Link></>}>
            <div className="cap-cards">
              {toolLifeCards.filter((c) => c.assetId === "b-press").map((card) =>
                card.kind === "taylor" ? (
                  <article key={card.id} className="cap-card">
                    <div className="cap-card-head">
                      <h3>{card.toolLabel}</h3>
                      <EvidenceTag label={card.label} />
                    </div>
                    <div className="cap-card-body">
                      <dl className="facts-grid">
                        <dt>Material</dt><dd>{card.material}</dd>
                        <dt>Speed</dt><dd><span className="num">{card.speedMmin}</span> m/min</dd>
                        <dt>Feed</dt><dd><span className="num">{card.feedMmRev}</span> mm/rev</dd>
                        <dt>Taylor n</dt><dd className="num">{card.n}</dd>
                        <dt>Taylor C</dt><dd className="num">{card.C} min</dd>
                        <dt>Indexed changes</dt><dd className="num">{card.indexedChanges}</dd>
                      </dl>
                      <div className="cap-metric">
                        <div><span className="label">Used this tool</span><div className="v">{card.minutesUsed}<span className="unit"> min</span></div></div>
                        <div><span className="label">Remaining (model)</span><div className="v">{card.minutesRemaining}<span className="unit"> min</span></div></div>
                        <div><span className="label">Decision</span><div className="v" style={{ fontSize: 14 }}>Recommend only</div></div>
                      </div>
                      <p className="muted" style={{ margin: 0, fontSize: 12 }}>A change proposal still needs a signed window and a named owner before any write.</p>
                    </div>
                  </article>
                ) : (
                  <article key={card.id} className="cap-card">
                    <div className="cap-card-head"><h3>{card.toolLabel}</h3></div>
                    <div className="cap-card-body">
                      <AbstainNote text={card.reason} />
                      <ul className="missing" style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>{card.missing.map((m) => <li key={m}>{m}</li>)}</ul>
                    </div>
                  </article>
                ),
              )}
            </div>
          </Section>
        </div>
        <div className="span-4 xl-span-3 stack ctx">
          <Section title="Out of scope here" actions={<Illustrative />}>
            <p style={{ fontSize: 13, margin: 0, color: "var(--text-secondary)" }}>Mixer M1 on Line A is batch equipment. Tool-life indexing applies to discrete tools on Line B only in this demo.</p>
          </Section>
          <Section title="How to read Taylor cards" flush>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>
              <li>Each indexed change logs speed, feed and minutes since the last change.</li>
              <li>n and C are fitted only when the history passes coverage checks.</li>
              <li>Remaining minutes are modelled, not a promise of scrap-free running.</li>
            </ol>
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
