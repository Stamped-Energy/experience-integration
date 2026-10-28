import Link from "next/link";
import * as D from "@/lib/demo/data";
import { oeeLossCards } from "@/lib/demo/capabilityScreens";
import { LossTree } from "@/components/process/LossTree";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { Illustrative, KpiRow, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { ProcessTabs, crumbs } from "@/components/process/common";

export const metadata = { title: "OEE" };

export default function OeePage() {
  return (
    <Workspace crumbs={crumbs({ label: "OEE" })} askContext="Process OEE loss tree">
      <PageHeader
        eyebrow="Process"
        title="OEE loss tree"
        meta="Availability, performance and quality losses rolled up to OEE for Mixer M1 and Press P3. Minutes are illustrative; no money is inferred."
        actions={<AskButton context="OEE loss trees" label="Ask about OEE" />}
      />
      <ProcessTabs active="oee" />
      <div className="grid">
        {oeeLossCards.map((card) => {
          const asset = D.byId.asset(card.assetId)!;
          return (
            <div key={card.assetId} className="span-6 xl-span-6 stack">
              <Section
                title={card.title}
                meta={<>{card.windowLabel} · <Link className="link" href={`/plant/assets/${asset.id}`}>{asset.name}</Link></>}
                actions={<Tag tone="neutral">Illustrative</Tag>}
              >
                <KpiRow
                  label={`OEE · ${asset.name}`}
                  items={[
                    { label: "OEE", value: String(card.oeePct), unit: "%" },
                    { label: "Availability", value: String(card.availabilityPct), unit: "%" },
                    { label: "Performance", value: String(card.performancePct), unit: "%" },
                    { label: "Quality", value: String(card.qualityPct), unit: "%" },
                  ]}
                />
                <div className="label" style={{ padding: "12px 16px 0" }}>Loss tree · minutes lost from scheduled time</div>
                <LossTree root={card.tree} />
              </Section>
            </div>
          );
        })}
        <div className="span-12 xl-span-12 stack">
          <Section title="Reading the tree" actions={<Illustrative />}>
            <p style={{ fontSize: 13, margin: 0, color: "var(--text-secondary)" }}>
              Each node is minutes lost in the window. Planned downtime is separate from unplanned stops. Rate loss captures running below nameplate. Quality loss is scrap and rework time, not a rupee figure.
            </p>
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
