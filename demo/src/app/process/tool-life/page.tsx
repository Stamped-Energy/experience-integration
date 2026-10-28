import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { DataTable, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { ProcessTabs, crumbs } from "@/components/process/common";
import {
  TOOL_LIFE_PAGE_META,
  listToolCards,
  type ToolCard,
  type ToolLifeResult,
} from "@/lib/demo/toolLife";

export const metadata = { title: "Tool life" };

function resultTag(card: ToolCard) {
  const r = card.result;
  if (r.kind === "abstain") return <Tag tone="warning">Abstain</Tag>;
  if (r.recommend_change) return <Tag tone="critical">Recommend change</Tag>;
  return <Tag tone="success">OK</Tag>;
}

export default function ToolLifePage() {
  const cards = listToolCards();
  return (
    <Workspace crumbs={crumbs({ label: "Tool life" })} askContext="Tool life">
      <PageHeader
        eyebrow="Process"
        title="Tool life"
        meta={TOOL_LIFE_PAGE_META}
        actions={
          <>
            <Tag tone="warning">Illustrative</Tag>
            <AskButton context="Tool life" label="Ask about tool life" />
          </>
        }
      />
      <ProcessTabs active="tool-life" />
      <div className="grid">
        <div className="span-8 xl-span-9 stack">
          <Section title="Machining tools" meta="Recommend only · Inputs passed until tool-life store is wired" flush>
            <DataTable
              caption="Tool life cards"
              rows={cards}
              rowKey={(t) => t.tool_id}
              columns={[
                {
                  key: "tool",
                  label: "Tool",
                  render: (t) => (
                    <span style={{ minWidth: 0, display: "block" }}>
                      <span className="mono truncate" title={t.tool_id} style={{ display: "block" }}>
                        {t.tool_id}
                      </span>
                      <div className="cell-sub" style={{ overflowWrap: "anywhere" }}>
                        {t.tool_name}
                      </div>
                    </span>
                  ),
                },
                { key: "station", label: "Station", render: (t) => t.station },
                {
                  key: "basis",
                  label: "Basis",
                  render: (t) =>
                    t.result.kind === "estimate" ? (
                      <Tag>{t.result.basis === "taylor" ? "Taylor" : "Life limit"}</Tag>
                    ) : (
                      <span className="cell-sub">Open</span>
                    ),
                },
                {
                  key: "remaining",
                  label: "Remaining",
                  render: (t) => {
                    if (t.result.kind !== "estimate") return <span className="cell-sub">-</span>;
                    const frac =
                      t.result.remaining_fraction != null
                        ? ` (${(t.result.remaining_fraction * 100).toFixed(0)}%)`
                        : "";
                    return (
                      <span className="mono">
                        {t.result.remaining.toFixed(1)}
                        {frac}
                      </span>
                    );
                  },
                },
                { key: "state", label: "State", render: (t) => resultTag(t) },
              ]}
            />
          </Section>

          <Section title="Recommendations" meta="Change only when remaining_threshold is set and remaining is at or below it">
            <div className="stack" style={{ gap: 12 }}>
              {cards.map((t) => {
                const r: ToolLifeResult = t.result;
                return (
                  <div key={t.tool_id} className="card" style={{ padding: 16 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <strong>{t.tool_name}</strong>
                      {resultTag(t)}
                      <Tag tone="warning">Illustrative</Tag>
                    </div>
                    <p className="cell-sub" style={{ marginTop: 8 }}>
                      {r.kind === "estimate" ? r.reason : r.detail}
                    </p>
                    {r.kind === "abstain" ? (
                      <p className="cell-sub" style={{ marginTop: 4 }}>
                        Abstain reason: <span className="mono">{r.reason}</span>. Fit Taylor n and C on plant data, or
                        supply a CNC life_limit. Stamped never invents coefficients.
                      </p>
                    ) : (
                      <p className="cell-sub" style={{ marginTop: 4 }}>
                        Predicted life {r.predicted_life.toFixed(1)} · used {r.life_used.toFixed(1)} · threshold{" "}
                        {t.remaining_threshold ?? "open"}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>
        </div>
        <div className="span-4 xl-span-3 stack ctx">
          <Section title="How this stays honest">
            <ul className="stack" style={{ gap: 8, paddingLeft: 18, margin: 0 }}>
              <li className="cell-sub">Taylor n and C are never defaulted. Open coefficients abstain.</li>
              <li className="cell-sub">Recommend change only when remaining_threshold is set by the plant.</li>
              <li className="cell-sub">No CNC or magazine write path. A person still changes the tool.</li>
              <li className="cell-sub">Live cards call get_tool_life_estimate; store-backed life_used still pending.</li>
            </ul>
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
