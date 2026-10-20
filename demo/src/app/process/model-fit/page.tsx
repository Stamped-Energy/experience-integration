import Link from "next/link";
import * as D from "@/lib/demo/data";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { DecisionCard } from "@/components/cards/DecisionCard";
import { RunChart } from "@/components/ui/charts";
import { PageHeader, Section } from "@/components/ui/primitives";
import { FitChecks } from "@/components/process/FitChecks";
import { ProcessTabs, crumbs, outcome, outcomeName, runsOf, specOf } from "@/components/process/common";
import { currentRole } from "@/lib/role";

export const metadata = { title: "Model fit" };

export default async function ModelFitPage() {
  const role = await currentRole();
  const withheld = D.proposals.filter((p) => p.fitState === "not accepted");
  const fits = D.modelFits.slice().sort((a) => (a.state === "accepted" ? 1 : -1));
  return (
    <Workspace crumbs={crumbs({ label: "Model fit" })} askContext="Model fit">
      <PageHeader eyebrow="Process" title="Model fit" meta="A model of each machine predicts outcomes with a band. Its numbers are used only after four checks pass, including 90% intervals covering 85 to 95% of held-out points."
        actions={<AskButton context="Model fit" label="Ask about model fit" />} />
      <ProcessTabs active="model-fit" />
      <div className="grid">
        {fits.map((f) => {
          const line = D.byId.line(f.lineId)!;
          const n = outcomeName(line);
          const v = runsOf(line.id).slice(-30).map((r) => outcome(r, n)!.value);
          return (
            <div key={f.modelId} className="span-6 xl-span-4 stack">
              <FitChecks fit={f} />
              <Section title={`${n}, last 30 runs`} meta={`Held-out runs are compared with the model's band`} flush actions={<Link className="link" href={`/process/lines/${line.id}`}>{line.short}</Link>}>
                <div className="chart-pad"><RunChart values={v} spec={specOf(line)} width={640} height={130} label={`${n} on ${line.short}`} /></div>
              </Section>
            </div>
          );
        })}
        <div className="span-12 xl-span-4 stack ctx">
          <Section title="Withheld because of fit" meta={`${withheld.length} proposal`} flush>
            <div className="stack-sm" style={{ padding: 12 }}>{withheld.map((p) => <DecisionCard key={p.id} p={p} role={role} variant="compact" href={`/process/proposals/${p.id}`} />)}</div>
          </Section>
          <Section title="What a failed check changes">
            <p style={{ fontSize: 13, margin: 0, color: "var(--text-secondary)" }}>While a model is not accepted, its line can still be watched and recommended to, but proposals carry no number and nothing is written. The process engineer sees the failing check first and can re-run the fit after recalibration.</p>
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
