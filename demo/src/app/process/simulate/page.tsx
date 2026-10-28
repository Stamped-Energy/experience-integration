import Link from "next/link";
import * as D from "@/lib/demo/data";
import { lineTrial, lineTrialAbstains } from "@/lib/demo/lineTrial";
import { AbstainNote } from "@/components/ask/common";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { Illustrative, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { ProcessTabs, crumbs } from "@/components/process/common";

export const metadata = { title: "Simulate" };

export default function SimulatePage() {
  const line = D.byId.line(lineTrial.lineId)!;
  const abstains = lineTrialAbstains();
  const delta = lineTrial.candidate.rate - lineTrial.baseline.rate;
  return (
    <Workspace crumbs={crumbs({ label: "Simulate" })} askContext="Process line trial simulate">
      <PageHeader
        eyebrow="Process"
        title="Synthetic line trial"
        meta={lineTrial.window}
        actions={<AskButton context="Synthetic line trial rates" label="Ask about simulate" />}
      />
      <ProcessTabs active="simulate" />
      <div className="grid">
        <div className="span-8 xl-span-9 stack">
          <Section title={lineTrial.title} meta={<Link className="link" href={`/process/lines/${line.id}`}>{line.name}</Link>} actions={<Tag tone="neutral">Illustrative</Tag>}>
            <div className="rate-compare">
              <div className="rate-box">
                <h4>{lineTrial.baseline.label}</h4>
                <div className="big">{lineTrial.baseline.rate}<span className="unit">{lineTrial.unit}</span></div>
                <p className="muted" style={{ margin: "8px 0 0", fontSize: 12 }}>Scrap {lineTrial.baseline.scrapPct}% · cycle {lineTrial.baseline.cycleSec} s</p>
              </div>
              <div className="rate-box">
                <h4>{lineTrial.candidate.label}</h4>
                <div className="big">{lineTrial.candidate.rate}<span className="unit">{lineTrial.unit}</span></div>
                <p className="muted" style={{ margin: "8px 0 0", fontSize: 12 }}>Scrap {lineTrial.candidate.scrapPct}% · cycle {lineTrial.candidate.cycleSec} s</p>
              </div>
            </div>
            <p style={{ fontSize: 13, margin: "12px 0 0" }}>
              Candidate is <strong className="num">{delta > 0 ? "+" : ""}{delta.toFixed(1)}</strong> {lineTrial.unit} versus baseline. Rates only; no rupee outcome is shown here.
            </p>
          </Section>
          <Section title="Will-not-get-worse checks" meta="Abstain when thresholds are unset">
            <p className="muted" style={{ fontSize: 13, margin: "0 0 12px" }}>{lineTrial.guardrails.note}</p>
            <div className="stack-sm">
            {abstains.map((t) => (
              <AbstainNote key={t} text={t} />
            ))}
            </div>
          </Section>
        </div>
        <div className="span-4 xl-span-3 stack ctx">
          <Section title="Trial steps" flush actions={<Illustrative />}>
            <ul className="tl">
              {lineTrial.steps.map((s) => (
                <li key={s.id}>
                  <span className="t">{s.id.split("-")[1]}</span>
                  <span className={`k ${s.done ? "w" : ""}`} />
                  <span>{s.name}</span>
                  <Tag tone={s.done ? "success" : "neutral"}>{s.done ? "Done" : "Pending"}</Tag>
                </li>
              ))}
            </ul>
          </Section>
          <Section title="What simulate does not do">
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>
              <li>No verified savings on a bill.</li>
              <li>No silent write to the press.</li>
              <li>No pass on guardrails until thresholds are signed.</li>
            </ul>
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
