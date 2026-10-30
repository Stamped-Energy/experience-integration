import { ProcessHubTabs } from "@/components/process/ProcessHubTabs";
import Link from "next/link";
import * as D from "@/lib/demo/data";
import * as demoModules from "@/lib/demo/modules";
import { MODULES_PAGE_META, SHADOW_PAGE_META, shadowLanes } from "@/lib/demo/shadowCompare";
import {
  DRIFT_RECOVERY_METHOD,
  EXAMPLE_OPEN_GATE_CONSTRAINTS,
  MPC_DEPLOY_GATE_REASONS,
  MPC_DEPLOY_GATE_SUMMARY,
  gateReasonStates,
  isDriftRecoveryMethod,
} from "@/lib/data/evidence/mpcDeployGate";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { DataTable, Illustrative, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { ProcessTabs, crumbs } from "@/components/process/common";

const DEMO_LOOP_RUN_ID = "loop-prop-101";

function backendTone(backend: string): "neutral" | "accent" | "warning" {
  if (backend === "live_shadow") return "accent";
  return "warning";
}

function backendLabel(backend: string): string {
  switch (backend) {
    case "live_shadow": return "Live shadow";
    case "example_shadow": return "Example shadow";
    case "abstain_not_fitted": return "Abstain · not fitted";
    case "abstain_not_built": return "Abstain · not built";
    case "empty": return "Empty";
    default: return backend;
  }
}

export default function ModulesPageView() {
  const registry = demoModules.controlModules;
  const prop101 = D.proposals.find((p) => p.id === "prop-101");
  const demoOuts = prop101 ? demoModules.outputsForLoopRun(demoModules.loopRunOf(prop101)) : [];
  const selected = demoModules.selectedOutput(demoOuts);
  const outs = demoOuts;
  const shadowOuts = outs.filter((o) => o.mode === "shadow");

  return (
    <Workspace crumbs={crumbs({ label: "Modules and shadow" })} askContext="Control modules">
      <PageHeader
        eyebrow="Process"
        title="Modules and shadow"
        meta={MODULES_PAGE_META}
        actions={
          <>
            <Illustrative />
            <AskButton context="Control modules" label="Ask about modules" />
          </>
        }
      />
      <ProcessHubTabs />
      <div className="grid">
        <div className="span-8 xl-span-9 stack">
          <Section title="Module registry" meta="Illustrative registry · empty list is honest when none are registered" flush>
            <DataTable
              caption="Control modules"
              rows={registry}
              rowKey={(m) => m.module_id}
              columns={[
                { key: "id", label: "Module", render: (m) => <span className="mono">{m.module_id} {m.module_version}</span> },
                { key: "type", label: "Type", render: (m) => demoModules.MODULE_TYPE_LABEL[m.type] ?? m.type },
                { key: "mode", label: "Mode", render: (m) => <Tag tone={m.mode === "shadow" ? "neutral" : m.mode === "recommend" ? "accent" : "warning"}>{m.mode}</Tag> },
                { key: "role", label: "Role", render: (m) => m.role ?? "None" },
                { key: "pack", label: "Pack", render: (m) => <span className="mono">{m.pack_id}</span> },
              ]}
            />
          </Section>

          <Section title="Shadow compare" meta={<>{SHADOW_PAGE_META} · <Tag tone="warning">Example lanes</Tag></>}>
            <div className="stack" style={{ gap: 12 }}>
              {shadowLanes.map((lane) => (
                <div key={lane.module_id} className="card-block stack-sm">
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <strong>{lane.label}</strong>
                    <Tag tone="neutral">{lane.module_id}</Tag>
                    <Tag tone={backendTone(lane.backend)}>{backendLabel(lane.backend)}</Tag>
                  </div>
                  <p className="secondary" style={{ margin: 0, fontSize: 13 }}>{lane.reason}</p>
                  <span className="label">Depends on</span>
                  <span className="secondary" style={{ fontSize: 13 }}>{lane.depends_on}</span>
                </div>
              ))}
            </div>
          </Section>

          {prop101 && selected ? (
            <Section
              title="Example compare on one proposal"
              meta={<><Tag tone="warning">Example data</Tag> {prop101.id} · selected <span className="mono">{selected.module_id}</span> · loop <span className="mono">{DEMO_LOOP_RUN_ID}</span></>}
            >
              <DataTable
                caption="Module outputs on one loop run"
                rows={outs}
                rowKey={(o) => o.output_id}
                columns={[
                  { key: "mod", label: "Module", render: (o) => <span className="mono">{o.module_id} {o.module_version}</span> },
                  { key: "type", label: "Type", render: (o) => demoModules.MODULE_TYPE_LABEL[o.module_type] },
                  {
                    key: "mode",
                    label: "Mode",
                    render: (o) => {
                      const driftRecovery = o.module_type === "mpc" && o.mode === "recommend" && isDriftRecoveryMethod(o.reasoning?.method);
                      return <Tag tone={o.mode === "shadow" ? "neutral" : "accent"}>{driftRecovery ? DRIFT_RECOVERY_METHOD : o.mode}</Tag>;
                    },
                  },
                  {
                    key: "gate",
                    label: "Gate reasons",
                    render: (o) => {
                      if (!isDriftRecoveryMethod(o.reasoning?.method)) return <span className="muted">-</span>;
                      const rows = gateReasonStates(o.reasoning?.method, o.reasoning?.active_constraints);
                      return (
                        <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap" }}>
                          {rows.map((r) => (
                            <Tag key={r.id} tone={r.passed ? "success" : "warning"}>{r.label}</Tag>
                          ))}
                        </span>
                      );
                    },
                  },
                  { key: "result", label: "Result", render: (o) => o.result },
                  {
                    key: "moves",
                    label: "Moves or reason",
                    render: (o) =>
                      o.result === "abstained"
                        ? o.abstain_reason ?? "Abstained"
                        : (o.moves ?? []).map((m) => `${m.setpoint_id} ${m.current}→${m.proposed} ${m.unit}`.trim()).join("; ") || "None",
                  },
                ]}
              />
              <p className="secondary" style={{ margin: 0, fontSize: 13 }}>
                Shadow rows are never sent as the card a person approves. Open{" "}
                <Link className="link" href="/process/proposals/prop-101">the proposal</Link> for the full module trace.
              </p>
              {shadowOuts.length === 0 ? <p className="secondary" style={{ fontSize: 13 }}>No shadow outputs on this run.</p> : null}
            </Section>
          ) : null}
        </div>
        <div className="span-4 xl-span-3 stack ctx">
          <Section title="MPC deploy gate" meta="Shown as drift recovery when open">
            <p style={{ margin: "0 0 8px", fontSize: 13, lineHeight: 1.5 }}>{MPC_DEPLOY_GATE_SUMMARY}</p>
            <div className="stack-sm">
              {MPC_DEPLOY_GATE_REASONS.map((r) => (
                <div key={r.id} style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                  <Tag tone="neutral">{r.label}</Tag>
                  <span className="secondary" style={{ fontSize: 12 }}><span className="mono">{r.token}</span> must be true</span>
                </div>
              ))}
            </div>
            <p className="secondary" style={{ margin: "12px 0 0", fontSize: 12, lineHeight: 1.5 }}>
              Example open-gate constraints: {EXAMPLE_OPEN_GATE_CONSTRAINTS.join("; ")}. Label <Tag tone="accent">{DRIFT_RECOVERY_METHOD}</Tag> recommend only, never write.
            </p>
          </Section>
          <Section title="How this stays honest">
            <ul className="stack-sm" style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
              <li>Model predictive control stays shadow by default. It may recommend only when the deploy gate is open; the UI labels that path <span className="mono">{DRIFT_RECOVERY_METHOD}</span>.</li>
              <li>Reinforcement learning stays shadow until a trained, shielded policy exists.</li>
              <li>The supervisor picks and explains; it never sets a number (D151).</li>
              <li>Live shadow compare abstains when model_fit_ref or a trained policy is missing. No invented moves.</li>
              <li>Evidence on modules stays empty until a real emulator pass is linked.</li>
            </ul>
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
