import Link from "next/link";
import { QualityHubTabs } from "@/components/quality/QualityHubTabs";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { EvidenceTag, PageHeader, Section, Tag, type Tone } from "@/components/ui/primitives";
import { SpcControlChart } from "@/components/view/spc-control-chart";
import { crumbs, qualityEyebrow } from "@/components/quality/common";
import * as D from "@/lib/demo/data";
import {
  controlState,
  cpkTarget,
  spcCharts,
  type SpcChartCard,
} from "@/lib/demo/capabilityScreens";

export const metadata = { title: "Control and capability" };

const STATE_TONE: Record<ReturnType<typeof controlState>, Tone> = {
  "In control": "success",
  "Rule signal": "warning",
  "Out of control": "critical",
};

function summary() {
  const under = spcCharts.filter((c) => c.cpk < cpkTarget(c)).length;
  const signals = spcCharts.filter((c) => c.hits.length > 0).length;
  const inControl = spcCharts.filter((c) => controlState(c) === "In control").length;
  return { n: spcCharts.length, inControl, signals, under };
}

function CapabilityBlock({ c }: { c: SpcChartCard }) {
  const state = controlState(c);
  const target = cpkTarget(c);
  const below = c.cpk < target;
  const line = D.byId.line(c.lineId);
  const chartLabel = c.chart === "xbar_r" ? "X̄-R" : "I-MR";

  return (
    <Section
      title={c.name}
      meta={
        <>
          {line?.short ?? c.lineId} · {chartLabel} · <EvidenceTag label={c.label} />
        </>
      }
      id={c.characteristicId}
      actions={<Tag tone={STATE_TONE[state]}>{state}</Tag>}
    >
      <div className="stack-sm spc-block">
        <SpcControlChart
          title={c.name}
          subtitle={`${c.period}`}
          chartKind={c.chart}
          primary={{
            label: c.chart === "xbar_r" ? "X̄" : "I",
            values: c.values,
            hits: c.hits.map((h) => h.at),
          }}
          secondary={
            c.rangeValues?.length
              ? { label: c.chart === "xbar_r" ? "R" : "MR", values: c.rangeValues }
              : undefined
          }
          cl={c.cl}
          ucl={c.ucl}
          lcl={c.lcl}
          usl={c.usl}
          lsl={c.lsl}
          cp={c.cp}
          cpk={c.cpk}
        />

        <div className="spc-legend-grid" aria-label="Limits">
          <div>
            <span className="label">Control</span>
            <span className="num">UCL {c.ucl} · CL {c.cl} · LCL {c.lcl}</span>
          </div>
          <div>
            <span className="label">Spec</span>
            <span className="num">USL {c.usl} · LSL {c.lsl}</span>
          </div>
        </div>

        <div className="spc-cap-panel">
          <p className="spc-cap-lead">
            Cpk {c.cpk.toFixed(2)}
            {below ? (
              <>
                {" "}
                · <Tag tone="warning">below target {target.toFixed(2)}</Tag>
              </>
            ) : (
              <>
                {" "}
                · <Tag tone="success">meets target {target.toFixed(2)}</Tag>
              </>
            )}
            {c.critical ? <span className="muted"> · critical characteristic</span> : null}
          </p>
          <p className="secondary">
            Cp {c.cp.toFixed(2)} · n {c.n} · {c.period}
          </p>
          <p className="muted spc-cap-overall">
            Overall · Pp {c.pp.toFixed(2)} · Ppk {c.ppk.toFixed(2)}
          </p>
        </div>

        {c.hits.length ? (
          <div className="spc-signal">
            {c.hits.map((h) => (
              <p key={`${h.rule}-${h.at}`}>
                <Tag tone="critical">Signal</Tag> {h.plain} <span className="muted">({h.rule})</span>
              </p>
            ))}
            <p className="spc-signal-links">
              {c.relatedLotId ? (
                <Link className="link" href={`/quality/lots/${c.relatedLotId}`}>
                  Open lot
                </Link>
              ) : null}
              {c.actionId ? (
                <Link className="link" href="/quality/actions">
                  Open action
                </Link>
              ) : null}
              <AskButton context={`${c.name} control chart`} label="Ask" />
            </p>
          </div>
        ) : (
          <p className="muted spc-signal-quiet">No open signals on this series.</p>
        )}
      </div>
    </Section>
  );
}

export default function SpcPage() {
  const s = summary();
  return (
    <Workspace crumbs={crumbs({ label: "Control and capability" })} askContext="Control and capability">
      <PageHeader
        eyebrow={qualityEyebrow("/quality/spc")}
        title="Control and capability"
        meta="Control chart and Cpk together for each characteristic. Cpk target 1.33, or 1.67 when critical."
        actions={<AskButton context="Control and capability" label="Ask about SPC" />}
      />
      <QualityHubTabs />
      <p className="spc-summary" aria-label="Capability summary">
        {s.n} characteristics · {s.inControl} in control · {s.signals} open signals · {s.under} Cpk under target
      </p>
      <div className="stack">
        {spcCharts.map((c) => (
          <CapabilityBlock key={c.characteristicId} c={c} />
        ))}
      </div>
    </Workspace>
  );
}
