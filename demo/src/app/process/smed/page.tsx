import { ProcessHubTabs } from "@/components/process/ProcessHubTabs";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { DataTable, PageHeader, Section, Tag } from "@/components/ui/primitives";
import { ProcessTabs, crumbs } from "@/components/process/common";
import { smedSteps } from "@/lib/demo/capabilityScreens";

export const metadata = { title: "SMED" };

function kindTag(k: string) {
  if (k === "external") return <Tag tone="success">External</Tag>;
  if (k === "internal") return <Tag tone="warning">Internal</Tag>;
  return <Tag>Unknown</Tag>;
}

export default function SmedPage() {
  const steps = smedSteps;
  const changeoverId = steps[0]?.changeoverId ?? "co-12";
  return (
    <Workspace crumbs={crumbs({ label: "SMED" })} askContext="SMED changeover">
      <PageHeader
        eyebrow="Process"
        title="SMED"
        meta="Recommend moving internal steps to external when safe · Store events when present, else caller inputs"
        actions={
          <>
            <Tag tone="warning">Illustrative</Tag>
            <AskButton context="SMED" label="Ask about changeover" />
          </>
        }
      />
      <ProcessHubTabs />
      <div className="grid">
        <div className="span-12 stack">
          <Section
            title={`Changeover ${changeoverId}`}
            meta="Recommend moving internal steps to external when safe"
            flush
          >
            <DataTable
              caption="SMED steps"
              rows={steps}
              rowKey={(s) => s.activity}
              columns={[
                { key: "a", label: "Activity", render: (s) => <span className="truncate" style={{ display: "block", minWidth: 0 }}>{s.activity}</span> },
                { key: "d", label: "Duration", render: (s) => <span className="mono">{s.durationS}s</span> },
                { key: "c", label: "Now", render: (s) => kindTag(s.currentKind) },
                { key: "r", label: "Recommend", render: (s) => kindTag(s.recommendedKind) },
              ]}
            />
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
