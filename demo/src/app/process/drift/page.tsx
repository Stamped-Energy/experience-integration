import { Workspace } from "@/components/shell/Shell";
import { PageHeader, Section, Tag } from "@/components/ui/primitives";
import { ProcessTabs, crumbs } from "@/components/process/common";

export const metadata = { title: "Drift proposals" };

const META =
  "Drift detection proposes re-identification or retuning. Nothing is applied until a person approves. Thresholds stay open until fitted on plant data (D145). Live list_drift_proposals reads pending self-tuning proposals when the read-api is attached.";

export default function ProcessDriftPage() {
  return (
    <Workspace crumbs={crumbs({ label: "Drift proposals" })} askContext="Drift proposals">
      <PageHeader eyebrow="Process" title="Drift proposals" meta={META} />
      <ProcessTabs active="drift" />
      <Section title="In progress" meta="Full screen is being built on a parallel branch">
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>
          Pending retune and re-identification proposals will list here. This stub avoids conflicting with the full drift page under development.
        </p>
        <p style={{ marginTop: 12 }}><Tag tone="warning">Illustrative placeholder</Tag></p>
      </Section>
    </Workspace>
  );
}
