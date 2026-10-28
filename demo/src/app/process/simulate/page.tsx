import Link from "next/link";
import { Suspense } from "react";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { DataTable, KpiRow, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { ProcessTabs, crumbs } from "@/components/process/common";
import {
  SIMULATE_PAGE_META,
  formatDelta,
  formatRate,
  getLineTrial,
  lineTrialCatalogue,
  listLineTrials,
} from "@/lib/demo/lineTrial";
import { TrialPicker } from "./TrialPicker";
import { StaticPageFallback } from "@/components/page/StaticPageFallback";

export const metadata = { title: "Simulate and trial" };

export default async function SimulatePage({
  searchParams,
}: {
  searchParams: Promise<{ trial?: string }>;
}) {
  const sp = await searchParams;
  const options = listLineTrials();
  const activeId =
    sp.trial && lineTrialCatalogue.trials[sp.trial] ? sp.trial : lineTrialCatalogue.default_id;
  const trial = getLineTrial(activeId);
  const noWorseTone = !trial.no_worse.available
    ? "warning"
    : trial.no_worse.passed
      ? "success"
      : "critical";
  const noWorseLabel = !trial.no_worse.available
    ? "Abstain (pack not fitted)"
    : trial.no_worse.passed
      ? "Passed"
      : "Failed";

  const rateRows = [
    {
      id: "scrap",
      name: "Scrap rate",
      baseline: trial.baseline.scrap_rate,
      candidate: trial.candidate.scrap_rate,
    },
    {
      id: "cold",
      name: "Cold shut rate",
      baseline: trial.baseline.cold_shut_rate,
      candidate: trial.candidate.cold_shut_rate,
    },
    {
      id: "hard",
      name: "Hardness fail rate",
      baseline: trial.baseline.hardness_fail_rate,
      candidate: trial.candidate.hardness_fail_rate,
    },
    {
      id: "dim",
      name: "Dimensional fail rate",
      baseline: trial.baseline.dimensional_fail_rate,
      candidate: trial.candidate.dimensional_fail_rate,
    },
  ];

  return (
    <Workspace crumbs={crumbs({ label: "Simulate and trial" })} askContext="Simulate">
      <PageHeader
        eyebrow="Process"
        title="Simulate and trial"
        meta={SIMULATE_PAGE_META}
        actions={<AskButton context="Simulate" label="Ask about this trial" />}
      />
      <ProcessTabs active="simulate" />
      <div className="grid">
        <div className="span-8 xl-span-9 stack">
          <Section
            title="Synthetic line trial"
            meta={`${trial.plant_id} · ${trial.line_id} · seeds ${trial.seeds.join(", ")} · ${trial.ticks} ticks`}
            actions={
              <Suspense fallback={<StaticPageFallback><span className="muted">Loading…</span></StaticPageFallback>}>
                <TrialPicker
                  activeId={activeId}
                  options={options.map((o) => ({ id: o.id, label: o.label }))}
                />
              </Suspense>
            }
          >
            <p className="muted" style={{ marginBottom: 12 }}>
              {lineTrialCatalogue.note} Source: {trial.source}. {trial.param_origin_note}
            </p>
            <KpiRow
              label="Trial rates"
              items={[
                {
                  label: "Baseline scrap",
                  value: formatRate(trial.baseline.scrap_rate),
                  foot: `${trial.baseline.scrap_count} of ${trial.baseline.lots_finished} lots`,
                },
                {
                  label: "Candidate scrap",
                  value: formatRate(trial.candidate.scrap_rate),
                  foot: `${trial.candidate.scrap_count} of ${trial.candidate.lots_finished} lots`,
                },
                {
                  label: "Scrap delta",
                  value: formatDelta(trial.scrap_rate_delta),
                  foot: "Candidate minus baseline",
                },
                {
                  label: "Will-not-get-worse",
                  value: noWorseLabel,
                  tags: <Tag tone={noWorseTone}>{noWorseLabel}</Tag>,
                  foot: trial.no_worse.reason,
                },
              ]}
            />
          </Section>
          <Section title="Predicted versus baseline" meta="Rates from the same seeds" flush>
            <DataTable
              caption="Rate comparison"
              rowKey={(r) => r.id}
              rows={rateRows}
              columns={[
                { key: "n", label: "Metric", render: (r) => r.name },
                {
                  key: "b",
                  label: "Baseline",
                  align: "right",
                  render: (r) => formatRate(r.baseline),
                },
                {
                  key: "c",
                  label: "Candidate",
                  align: "right",
                  render: (r) => formatRate(r.candidate),
                },
                {
                  key: "d",
                  label: "Delta",
                  align: "right",
                  render: (r) => formatDelta(r.candidate - r.baseline),
                },
              ]}
            />
          </Section>
          <Section title="Candidate knobs" meta="Synthetic setpoints only">
            {Object.keys(trial.candidate_knobs).length === 0 ? (
              <p className="muted">No knobs changed (baseline versus baseline).</p>
            ) : (
              <ul className="tl">
                {Object.entries(trial.candidate_knobs).map(([k, v]) => (
                  <li key={k}>
                    <span className="t">Knob</span>
                    <span className="k" />
                    <span>
                      {k}
                      <span className="cell-sub">value {v}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
        <div className="span-4 xl-span-3 stack ctx">
          <Section title="How to read this" flush>
            <ul className="tl">
              <li>
                <span className="t">1</span>
                <span className="k" />
                <span>
                  Opportunity
                  <span className="cell-sub">From detectors, causes, or drift</span>
                </span>
              </li>
              <li>
                <span className="t">2</span>
                <span className="k" />
                <span>
                  Simulate
                  <span className="cell-sub">This screen: synthetic line trial</span>
                </span>
              </li>
              <li>
                <span className="t">3</span>
                <span className="k" />
                <span>
                  Trial on plant
                  <span className="cell-sub">
                    Signed switchbacks on{" "}
                    <Link className="link" href="/process/trials">
                      Trials and stops
                    </Link>
                  </span>
                </span>
              </li>
              <li>
                <span className="t">4</span>
                <span className="k" />
                <span>
                  Approve
                  <span className="cell-sub">
                    Recommends, then executes with approval on{" "}
                    <Link className="link" href="/process/proposals">
                      Proposals
                    </Link>
                  </span>
                </span>
              </li>
            </ul>
          </Section>
          <Section title="Open pack values" flush>
            <p className="muted" style={{ padding: 12 }}>
              Line-pack thresholds for will-not-get-worse are not yet fitted. The check abstains
              rather than inventing a pass. Money ROI stays off this screen until plant tariffs are
              set (D157).
            </p>
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
