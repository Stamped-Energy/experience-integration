import { QualityHubTabs } from "@/components/quality/QualityHubTabs";
import Link from "next/link";
import * as D from "@/lib/demo/data";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { DataTable, Illustrative, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { QualityTabs, crumbs, lotNo } from "@/components/quality/common";
import { genealogyTraces } from "@/lib/demo/capabilityScreens";

export const metadata = { title: "Genealogy trace" };

function nodeHref(id: string, kind: string) {
  if (kind === "lot" && D.byId.lot(id)) return `/quality/lots/${id}`;
  return undefined;
}

export default function GenealogyPage() {
  return (
    <Workspace crumbs={crumbs({ label: "Genealogy trace" })} askContext="Genealogy trace">
      <PageHeader
        eyebrow="Quality"
        title="Genealogy trace"
        meta="Forward / backward · Recommend only · Illustrative edges until lineage store feeds the screen"
        actions={
          <>
            <Illustrative />
            <AskButton context="Genealogy" label="Ask about genealogy" />
          </>
        }
      />
      <QualityHubTabs />
      <div className="stack">
        {genealogyTraces.map((t) => (
          <Section key={`${t.startId}-${t.direction}`} title={`From ${t.startId}`} meta={t.direction} flush>
            <DataTable
              caption={`Trace ${t.direction}`}
              rows={t.nodes}
              rowKey={(n) => n.id}
              columns={[
                { key: "k", label: "Kind", render: (n) => <Tag>{n.kind}</Tag> },
                {
                  key: "l",
                  label: "Node",
                  render: (n) => {
                    const href = nodeHref(n.id, n.kind);
                    return (
                      <span style={{ minWidth: 0, display: "block" }}>
                        {href ? (
                          <Link className="link truncate" style={{ display: "block" }} href={href}>
                            {n.kind === "lot" ? `Lot ${lotNo(n.id)}` : n.label}
                          </Link>
                        ) : (
                          <span className="truncate" style={{ display: "block" }}>
                            {n.label}
                          </span>
                        )}
                        <span className="cell-sub mono">{n.id}</span>
                      </span>
                    );
                  },
                },
              ]}
            />
          </Section>
        ))}
      </div>
    </Workspace>
  );
}
