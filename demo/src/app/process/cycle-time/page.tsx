import { ProcessHubTabs } from "@/components/process/ProcessHubTabs";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { DataTable, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { crumbs, processEyebrow } from "@/components/process/common";
import {
  CYCLE_STATES,
  CYCLE_STATE_LABEL,
  listCycleBreakdowns,
  formatSeconds,
  formatShare,
  type CycleBreakdownCard,
  type CycleState,
} from "@/lib/demo/cycleTime";

export const metadata = { title: "Cycle time" };

function ShareBars({ card }: { card: CycleBreakdownCard }) {
  const r = card.result;
  if (r.kind === "abstain") {
    return (
      <p className="cell-sub">
        Abstain: <span className="mono">{r.reason}</span> · {r.detail}
      </p>
    );
  }
  return (
    <div className="stack" style={{ gap: 6 }}>
      {CYCLE_STATES.filter((s) => r.dwell_s[s] > 0).map((s: CycleState) => (
        <div
          key={s}
          className="cycle-share-row"
        >
          <span className="cell-sub cycle-share-label">
            {CYCLE_STATE_LABEL[s]}
          </span>
          <div className="cycle-share-track">
            <div
              className="cycle-share-fill"
              style={{
                width: `${Math.min(100, r.share[s] * 100)}%`,
                background: s === "cutting" ? "var(--accent-500)" : "var(--text-muted)",
              }}
            />
          </div>
          <span className="mono cell-sub truncate" title={formatShare(r.share[s])}>
            {formatShare(r.share[s])}
          </span>
          <span className="mono cell-sub truncate" title={formatSeconds(r.dwell_s[s])}>
            {formatSeconds(r.dwell_s[s])}
          </span>
        </div>
      ))}
      <p className="cell-sub" style={{ marginTop: 4 }}>
        Window {formatSeconds(r.window_s)} · {r.sample_count} samples · shares sum to 1.0
      </p>
    </div>
  );
}

export default function CycleTimePage() {
  const cards = listCycleBreakdowns();
  const ok = cards.filter((x) => x.result.kind === "breakdown");
  return (
    <Workspace crumbs={crumbs({ label: "Cycle time" })} askContext="Cycle time">
      <PageHeader
        eyebrow={processEyebrow("/process/cycle-time")}
        title="Cycle time"
        meta="Dwell and share by cycle state"
        actions={<AskButton context="Cycle time" label="Ask about cycle time" />}
      />
      <ProcessHubTabs />
      <div className="grid">
        <div className="span-12 stack">
          <Section title="Stations" flush>
            <DataTable
              caption="Cycle-time stations"
              rows={cards}
              rowKey={(row) => `${row.asset_id}-${row.window_label}`}
              columns={[
                { key: "station", label: "Station", render: (row) => row.station },
                { key: "window", label: "Window", render: (row) => row.window_label },
                {
                  key: "cutting",
                  label: "Cutting share",
                  render: (row) =>
                    row.result.kind === "breakdown" ? (
                      <span className="mono">{formatShare(row.result.share.cutting)}</span>
                    ) : (
                      <Tag tone="warning">Abstain</Tag>
                    ),
                },
                {
                  key: "state",
                  label: "State",
                  render: (row) =>
                    row.result.kind === "breakdown" ? (
                      <Tag tone="success">Breakdown</Tag>
                    ) : (
                      <Tag tone="warning">Abstain</Tag>
                    ),
                },
              ]}
            />
          </Section>

          <Section title="Dwell by state" meta={`${ok.length} of ${cards.length} stations with a breakdown`}>
            <div className="stack" style={{ gap: 16 }}>
              {cards.map((card) => (
                <div key={`${card.asset_id}-${card.window_label}`} className="card section-pad">
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
                    <strong>{card.station}</strong>
                    <span className="cell-sub">{card.window_label}</span>
                  </div>
                  <ShareBars card={card} />
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
