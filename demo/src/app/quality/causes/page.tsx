import { Workspace } from "@/components/shell/Shell";
import { DataTable, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { AbstainNote } from "@/components/ask/common";
import { CauseFamilyBadge, causeNodeLabel, isDesignCause } from "@/components/quality/CauseFamilyBadge";
import { QualityTabs, crumbs } from "@/components/quality/common";
import { DESIGN_CAUSE_META } from "@/lib/demo/causeFamily";
import type { CauseEdge } from "@/lib/demo/causal-contracts";
import { diagnoseCase, NODE_LABEL, queryGraph } from "@/lib/demo/engine";

export const metadata = { title: "Cause graphs" };

const TEMPLATE_NAME: Record<string, string> = { forging: "Forging", "heat-treatment": "Heat treatment" };
const label = (id: string) => NODE_LABEL[id] ?? id;
const DIAGNOSE_ASSET = "example-forge-press";
const ABSTAIN_ASSET = "a-mixer";
const CAUSAL_VERSION = "0.2.0";

export default function CausesPage() {
  const { graphs, edges } = queryGraph({});
  const kase = diagnoseCase(DIAGNOSE_ASSET);
  const abstained = diagnoseCase(ABSTAIN_ASSET);

  return (
    <Workspace crumbs={crumbs({ label: "Cause graphs" })} askContext="Cause graphs">
      <PageHeader
        eyebrow="Quality"
        title="Cause graphs"
        meta={
          <span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            Example data: the forging and heat-treatment node templates (D130), not this plant&apos;s lines. Every link is declared by the template with a literature source and has no plant evidence yet. Causal engine contract {CAUSAL_VERSION}.
            <Tag tone="warning">Example data</Tag>
          </span>
        }
      />
      <QualityTabs active="causes" />
      <div className="grid">
        <div className="span-12">
          <div className="grid">
            {graphs.map((g) => {
              const es = edges.filter((e) => e.plant_id === g.plant_id);
              return (
                <div key={g.plant_id} className="span-6 stack">
                  <Section
                    title={`${TEMPLATE_NAME[g.template.template_id] ?? g.template.template_id} template`}
                    meta={`${g.nodes.length} nodes · ${es.length} declared links · graph ${g.graph_version}`}
                    flush
                  >
                    <DataTable<CauseEdge>
                      caption={`${g.template.template_id} declared links`}
                      rows={es}
                      rowKey={(e) => e.edge_id}
                      columns={[
                        { key: "from", label: "From", render: (e) => label(e.from_node) },
                        { key: "to", label: "To", render: (e) => label(e.to_node) },
                        { key: "status", label: "Status", render: (e) => <Tag>{e.status}</Tag> },
                        { key: "conf", label: "Confidence", render: (e) => e.confidence },
                        { key: "src", label: "Source", render: (e) => <span className="cell-sub">{e.evidence[0]?.ref.split(" ").slice(-1)[0]}</span> },
                      ]}
                    />
                    <div style={{ padding: 16 }} className="cell-sub">
                      Nodes: {g.nodes.map((n) => label(n.node_id)).join(", ")}
                    </div>
                  </Section>
                </div>
              );
            })}
          </div>
        </div>
        <div className="span-12 stack">
          <Section title="Example diagnosis: underfill on a forge press" meta="Ranked on declared template links only, so confidence stays low until plant data confirms or rules them out" flush>
            {kase.ok ? (
              <DataTable
                caption="Ranked causes"
                rows={kase.data.ranked_causes}
                rowKey={(r) => String(r.rank)}
                columns={[
                  { key: "rank", label: "Rank", render: (r) => r.rank },
                  {
                    key: "root",
                    label: "Possible cause",
                    render: (r) => (
                      <span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        {causeNodeLabel(r.root_node, label)}
                        <CauseFamilyBadge nodeId={r.root_node} />
                        {isDesignCause(r.root_node) ? <Tag tone="accent">Design cause</Tag> : null}
                      </span>
                    ),
                  },
                  { key: "conf", label: "Confidence", render: (r) => <Tag tone="warning">{r.confidence}, {r.evidence_label}</Tag> },
                  { key: "next", label: "Confirm or rule out", render: (r) => r.confirm_or_rule_out },
                ]}
              />
            ) : (
              <div style={{ padding: 16 }}>
                <AbstainNote text={kase.abstainReason} />
              </div>
            )}
          </Section>
          <Section title="Design as a cause family" meta={DESIGN_CAUSE_META} flush>
            <p className="cell-sub" style={{ padding: 16 }}>
              Ranked causes carry a family badge. When the root node is design (fillet, draft, allowance, tolerance),
              a Design cause tag appears so scrap is not assumed to be a setpoint miss. Taxonomy lives in causal #126;
              until that merges, badges use the same node-type map shipped in the UI.
            </p>
            <DataTable
              caption="Illustrative design-tagged roots"
              rows={[
                { root_node: "fillet_radius", note: "Underfill / lap risk from tight fillet (FIA / Van Tyne)" },
                { root_node: "draft_angle", note: "Ejection and mismatch risk from shallow draft" },
                { root_node: "design_tolerance", note: "Machining scrap when tolerance stack is tighter than process capability" },
              ]}
              rowKey={(r) => r.root_node}
              columns={[
                {
                  key: "root",
                  label: "Possible cause",
                  render: (r) => (
                    <span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      {causeNodeLabel(r.root_node, label)}
                      <CauseFamilyBadge nodeId={r.root_node} />
                      <Tag tone="accent">Design cause</Tag>
                      <Tag tone="warning">Illustrative</Tag>
                    </span>
                  ),
                },
                { key: "note", label: "Why it matters", render: (r) => r.note },
              ]}
            />
          </Section>
          <Section title="Abstain when the asset has no case" meta={`diagnose(${ABSTAIN_ASSET}) has no example case, so the tool abstains rather than inventing findings`} flush>
            <div style={{ padding: 16 }}>
              {abstained.ok ? (
                <p className="cell-sub">Unexpected: a diagnosis was returned for {ABSTAIN_ASSET}.</p>
              ) : (
                <AbstainNote text={abstained.abstainReason} />
              )}
            </div>
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
