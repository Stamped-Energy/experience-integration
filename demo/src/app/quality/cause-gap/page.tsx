import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { DataTable, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { QualityTabs, crumbs } from "@/components/quality/common";
import {
  capaParetoDemo,
  changeControlDemo,
  environmentDemo,
  operatorShiftDemo,
  pokaYokeDemo,
} from "@/lib/demo/causeGap";

export const metadata = { title: "Cause gap" };

export default function CauseGapPage() {
  const op = operatorShiftDemo;
  const env = environmentDemo;
  const chg = changeControlDemo;
  const capa = capaParetoDemo;
  const py = pokaYokeDemo;

  return (
    <Workspace crumbs={crumbs({ label: "Cause gap" })} askContext="Cause gap context">
      <PageHeader
        eyebrow="Quality"
        title="Cause gap"
        meta={
          <span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            Operator and shift rates, environment joins, change log, CAPA root-cause Pareto, poka-yoke gaps.
            Eng Lead kernels via get_operator_shift_context, get_environment_ingest,
            get_change_control_log, get_capa_category_pareto, get_poka_yoke_gap. Recommend only; never blame.
            <Tag tone="warning">Example data</Tag>
          </span>
        }
        actions={<AskButton context="Cause gap" label="Ask about cause gap" />}
      />
      <QualityTabs active="cause-gap" />

      <Section title="Operator and shift rates" meta="get_operator_shift_context · aggregates first · pseudonyms only · never blame" flush>
        <div style={{ padding: "12px 16px", display: "grid", gap: 16, minWidth: 0 }}>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            {op.n_lots} lots · {op.n_operators_in_scope} operators in scope ·
            withheld below min group size: {op.withheld_below_min_group_size}.
            {op.notes.length ? ` Notes: ${op.notes.join(", ")}.` : ""}
          </p>
          <div className="cause-gap-scroll">
            <DataTable
              caption="Shift aggregates"
              rows={op.shift_aggregates}
              rowKey={(r) => r.shift_id}
              columns={[
                { key: "s", label: "Shift", mono: true, render: (r) => r.shift_id },
                { key: "l", label: "Lots", align: "right", render: (r) => r.lots },
                { key: "u", label: "Units", align: "right", render: (r) => r.units_produced },
                { key: "rj", label: "Rejected", align: "right", render: (r) => r.rejected_units },
                { key: "rr", label: "Rejection rate", align: "right", render: (r) => `${(r.rejection_rate * 100).toFixed(1)}%` },
                { key: "sk", label: "Skill bands", render: (r) => <span className="cause-gap-trunc">{(r.skill_bands ?? []).join(", ")}</span> },
              ]}
            />
          </div>
          <div className="cause-gap-scroll">
            <DataTable
              caption="Operator breakdown (pseudonyms)"
              rows={op.operator_breakdown}
              rowKey={(r) => `${r.operator_pseudonym}-${r.shift_id}`}
              columns={[
                { key: "op", label: "Operator", mono: true, render: (r) => <span className="cause-gap-trunc">{r.operator_pseudonym}</span> },
                { key: "s", label: "Shift", mono: true, render: (r) => r.shift_id },
                { key: "l", label: "Lots", align: "right", render: (r) => r.lots },
                { key: "u", label: "Units", align: "right", render: (r) => r.units_produced },
                { key: "rj", label: "Rejected", align: "right", render: (r) => r.rejected_units },
                { key: "rr", label: "Rejection rate", align: "right", render: (r) => `${(r.rejection_rate * 100).toFixed(1)}%` },
              ]}
            />
          </div>
        </div>
      </Section>

      <Section title="Environment joins" meta="get_environment_ingest · shadow drift-correlation · recommend only" flush>
        <div style={{ padding: "12px 16px", display: "grid", gap: 16, minWidth: 0 }}>
          <div className="cause-gap-scroll">
            <DataTable
              caption="Lot joins"
              rows={env.joins}
              rowKey={(r) => r.lot_id}
              columns={[
                { key: "lot", label: "Lot", mono: true, render: (r) => r.lot_id },
                { key: "t", label: "Mean °C", align: "right", render: (r) => (r.mean_temperature_c == null ? "-" : r.mean_temperature_c) },
                { key: "h", label: "Mean RH %", align: "right", render: (r) => (r.mean_humidity_pct == null ? "-" : r.mean_humidity_pct) },
                { key: "rr", label: "Rejection rate", align: "right", render: (r) => `${(r.rejection_rate * 100).toFixed(1)}%` },
              ]}
            />
          </div>
          <div className="cause-gap-scroll">
            <DataTable
              caption="Shadow flags"
              rows={env.shadow_flags}
              rowKey={(r) => r.metric}
              columns={[
                { key: "m", label: "Metric", mono: true, render: (r) => r.metric },
                { key: "n", label: "Lots", align: "right", render: (r) => r.n_lots },
                { key: "r", label: "Pearson r", align: "right", render: (r) => (r.pearson_r == null ? "-" : r.pearson_r.toFixed(3)) },
              ]}
            />
          </div>
        </div>
      </Section>

      <Section title="Change-control log" meta="get_change_control_log · rejection-rate shifts · recommend only" flush>
        <div style={{ padding: "12px 16px", minWidth: 0 }} className="cause-gap-scroll">
          <DataTable
            caption="Change flags"
            rows={chg.flags}
            rowKey={(r) => r.change_id}
            columns={[
              { key: "id", label: "Change", mono: true, render: (r) => r.change_id },
              { key: "k", label: "Kind", render: (r) => r.kind },
              { key: "s", label: "Subject", mono: true, render: (r) => r.subject_id },
              { key: "d", label: "Rate delta", align: "right", render: (r) => (r.rate_delta == null ? "-" : r.rate_delta.toFixed(3)) },
              { key: "b", label: "Before lots", align: "right", render: (r) => r.before_lots },
              { key: "a", label: "After lots", align: "right", render: (r) => r.after_lots },
            ]}
          />
        </div>
      </Section>

      <Section title="CAPA category Pareto" meta="get_capa_category_pareto · caller-supplied tags only · 6M+design" flush>
        <div style={{ padding: "12px 16px", minWidth: 0 }} className="cause-gap-scroll">
          <DataTable
            caption="Pareto"
            rows={capa.pareto}
            rowKey={(r) => r.category}
            columns={[
              { key: "c", label: "Category", render: (r) => r.category },
              { key: "n", label: "Count", align: "right", render: (r) => r.count },
              { key: "s", label: "Share", align: "right", render: (r) => `${(r.share * 100).toFixed(1)}%` },
            ]}
          />
        </div>
      </Section>

      <Section title="Poka-yoke gaps" meta="get_poka_yoke_gap · repeated human-error root causes · recommend controls only" flush>
        <div style={{ padding: "12px 16px", display: "grid", gap: 16, minWidth: 0 }}>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            {py.n_capa_rows} CAPA rows · {py.n_human_error_rows} human-error rows.
            {py.notes.length ? ` Notes: ${py.notes.join(", ")}.` : ""}
          </p>
          <div className="cause-gap-scroll">
            <DataTable
              caption="Poka-yoke gap candidates"
              rows={py.candidates}
              rowKey={(r) => r.root_cause_code}
              columns={[
                { key: "rc", label: "Root cause", mono: true, render: (r) => r.root_cause_code },
                { key: "n", label: "Occurrences", align: "right", render: (r) => r.occurrence_count },
                { key: "ctrl", label: "Suggested controls", render: (r) => <span className="cause-gap-trunc">{r.suggested_controls.join(", ")}</span> },
              ]}
            />
          </div>
        </div>
      </Section>
    </Workspace>
  );
}
