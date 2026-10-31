import { QualityHubTabs } from "@/components/quality/QualityHubTabs";
import type { ReactNode } from "react";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { Illustrative, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { QualityTabs, crumbs } from "@/components/quality/common";
import { FATIGUE_GUARD_STATUS, SECOM_ALARM_TUNE, SECOM_WATCH_TIER } from "@/lib/data/evidence/secomAlarmTune";

export const metadata = { title: "Monitor settings" };

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(12rem, 34%) 1fr",
        gap: "8px 16px",
        padding: "10px 0",
        borderBottom: "1px solid var(--border)",
        alignItems: "baseline",
      }}
    >
      <div className="muted" style={{ fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 14, minWidth: 0, overflowWrap: "anywhere" }}>{children}</div>
    </div>
  );
}

export default function MonitorPage() {
  const t = SECOM_ALARM_TUNE;
  const rulesLabel = t.enabledRules.map((r) => r.replace("nelson", "Nelson ")).join(", ");

  return (
    <Workspace crumbs={crumbs({ label: "Monitor settings" })} askContext="Quality monitor settings">
      <PageHeader
        eyebrow="Quality"
        title="Monitor settings"
        meta={
          <span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            Alarm rules, false-alarm budget and fatigue guard for SPC monitors.
            <Illustrative />
            <Tag tone="success">{t.publicLabel}</Tag>
          </span>
        }
        actions={<AskButton context="Quality monitor settings" label="Ask about monitor settings" />}
      />
      <QualityHubTabs />

      <div className="grid">
        <div className="span-8 stack">
          <Section title="Alarm rate budget" meta="Requested false-alarm rate for the public SECOM tuning run">
            <Row label="Target FAR">
              <strong className="num">{t.requestedFarTarget.toFixed(2)}</strong>
              <span className="cell-sub"> per sample on held-out in-control data</span>
            </Row>
            <Row label="Hit on validation">
              {t.hitFarTargetOnValidation ? (
                <Tag tone="success">Yes · validation FAR {t.valFar.toFixed(4)}</Tag>
              ) : (
                <Tag tone="warning">No</Tag>
              )}
            </Row>
            <Row label="Selection rule">
              <span>{t.selectionRule}</span>
            </Row>
          </Section>

          <Section title="Chosen default" meta={`${t.chosenName} · family ${t.chosenFamily}`}>
            <Row label="Rule set">
              <strong>{rulesLabel}</strong>
              <span className="cell-sub"> Nelson rules 1 to 4 only</span>
            </Row>
            <Row label="Rule 4 run length">
              <strong className="num">{t.rule4Run}</strong>
              <span className="cell-sub"> consecutive points on one side of centre</span>
            </Row>
            <Row label="Held-out FAR">
              <strong className="num">{t.heldOutFarDisplay}</strong>
              <span className="cell-sub"> test split · target {t.requestedFarTarget.toFixed(2)}</span>
            </Row>
            <Row label="Detection delay">
              <strong className="num">{t.detectionDelaySamples}</strong>
              <span className="cell-sub"> samples after onset on the public SECOM fail set</span>
            </Row>
          </Section>

          <Section title="Fatigue guard" meta="Plant must set limits before this turns on">
            <Row label="State">
              <Tag tone="neutral">Off</Tag>
              <span className="cell-sub"> {FATIGUE_GUARD_STATUS.reason}</span>
            </Row>
            <Row label="Debounce">
              <span className="muted">Unset · plant profile required</span>
            </Row>
            <Row label="Suppression window">
              <span className="muted">Unset · plant profile required</span>
            </Row>
            <Row label="Shift alarm budget">
              <span className="muted">Unset · plant profile required</span>
            </Row>
          </Section>

          <Section title={SECOM_WATCH_TIER.label} meta="Hint only, never an alarm">
            <Row label="Role">
              <Tag tone="accent">Hint only</Tag>
              <span className="cell-sub"> Never shown as an alarm. Alarm tier stays Nelson 1 to 4.</span>
            </Row>
            <Row label="Chosen watch">
              <strong>SPE</strong>
              <span className="cell-sub">
                {" "}
                alpha {SECOM_WATCH_TIER.speAlpha} · {SECOM_WATCH_TIER.nComponents} components ·{" "}
                <span className="mono">{SECOM_WATCH_TIER.chosenName}</span>
              </span>
            </Row>
            <Row label="Held-out caught">
              <strong className="num">{SECOM_WATCH_TIER.heldOutCaught}</strong>
              <span className="cell-sub"> precise watches ahead of the alarm tier</span>
            </Row>
            <Row label="Median lead">
              <strong className="num">{SECOM_WATCH_TIER.medianLeadSamples}</strong>
              <span className="cell-sub"> samples ahead of alarm on held-out</span>
            </Row>
            <Row label="In-control hints">
              <strong className="num">{SECOM_WATCH_TIER.inControlHintRateDisplay}</strong>
              <span className="cell-sub"> of in-control runs raised a watch hint</span>
            </Row>
            <Row label="Evidence">
              <Tag tone="success">{SECOM_WATCH_TIER.publicLabel}</Tag>
            </Row>
            <p className="muted" style={{ margin: "12px 0 0", fontSize: 12, lineHeight: 1.5 }}>
              {SECOM_WATCH_TIER.smallSampleNote}
            </p>
          </Section>
        </div>

        <div className="span-4 stack ctx">
          <Section title="Evidence" meta="Public data only">
            <p style={{ margin: "0 0 8px", fontSize: 13, lineHeight: 1.5 }}>
              <strong>{t.publicLabel}</strong>
            </p>
            <p className="muted" style={{ margin: "0 0 8px", fontSize: 12, lineHeight: 1.5 }}>
              {t.attribution}
            </p>
            <p className="muted" style={{ margin: 0, fontSize: 12, lineHeight: 1.5 }}>
              Source label: {t.sourceLabel}. Evidence id <span className="mono">{t.evidenceId}</span>. Retune per plant before production use.
            </p>
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
