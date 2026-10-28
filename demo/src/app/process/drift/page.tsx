import Link from "next/link";
import { DRIFT_PAGE_META, driftProposals } from "@/lib/demo/driftProposals";
import { dayMonth, hhmm } from "@/lib/format";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { DataTable, Illustrative, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { ProcessTabs, crumbs } from "@/components/process/common";

export const metadata = { title: "Drift proposals" };

export default function DriftPage() {
  const rows = driftProposals;
  return (
    <Workspace crumbs={crumbs({ label: "Drift proposals" })} askContext="Drift proposals">
      <PageHeader
        eyebrow="Process"
        title="Drift proposals"
        meta={DRIFT_PAGE_META}
        actions={
          <>
            <Illustrative />
            <AskButton context="Drift proposals" label="Ask about drift" />
          </>
        }
      />
      <ProcessTabs active="drift" />
      <div className="grid">
        <div className="span-8 xl-span-9 stack">
          <Section title="Pending retune and re-identification" meta={<><Tag tone="warning">Example data</Tag> recommend-only · not Quality lot drift</>} flush>
            <DataTable
              caption="Drift proposals"
              rows={rows}
              rowKey={(p) => p.proposal_id}
              columns={[
                { key: "id", label: "Proposal", render: (p) => <span className="mono">{p.proposal_id}</span> },
                { key: "kind", label: "Kind", render: (p) => <Tag tone="accent">{p.kind === "reidentification" ? "Re-identify" : "Retune"}</Tag> },
                { key: "asset", label: "Asset", render: (p) => <span className="mono">{p.asset_id ?? "plant"}</span> },
                { key: "when", label: "Raised", render: (p) => `${dayMonth(p.created_at)} ${hhmm(p.created_at)}` },
                { key: "state", label: "State", render: (p) => <Tag>{p.state}</Tag> },
              ]}
            />
          </Section>
          {rows.map((p) => (
            <Section key={p.proposal_id} title={p.summary} meta={<><Tag tone="warning">Illustrative</Tag> {p.proposal_id} · pack <span className="mono">{p.pack_id ?? "unset"}</span></>}>
              <ul className="stack-sm" style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                {p.findings.map((f, i) => (
                  <li key={`${p.proposal_id}-${i}`}>
                    <span className="mono">{f.outcome_id}</span> · {f.metric}:{" "}
                    {f.value === null || f.limit === null ? "abstains (limit not fitted)" : `${f.value} against limit ${f.limit}`}. {f.detail}
                  </li>
                ))}
              </ul>
              <p className="secondary" style={{ margin: 0, fontSize: 13 }}>
                Recommend only. Applying a pack or twin change needs a separate approval path. Thresholds stay open until fitted (D145).
              </p>
            </Section>
          ))}
        </div>
        <div className="span-4 xl-span-3 stack ctx">
          <Section title="Related">
            <ul className="stack-sm" style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
              <li><Link className="link" href="/process/model-fit">Model fit</Link></li>
              <li><Link className="link" href="/process/modules">Modules and shadow</Link></li>
              <li><Link className="link" href="/process/simulate">Simulate and trial</Link></li>
              <li><Link className="link" href="/quality/drift">Quality drift (lots)</Link></li>
            </ul>
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
