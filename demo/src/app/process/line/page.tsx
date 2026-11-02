import { ProcessHubTabs } from "@/components/process/ProcessHubTabs";
import { PlantDiagramViewer } from "@/components/scan/forging-plant-viewer";
import { AskButton } from "@/components/shell/ShellClient";
import { Workspace } from "@/components/shell/Shell";
import { PageHeader } from "@/components/ui/primitives";
import { crumbs, processEyebrow } from "@/components/process/common";

export const metadata = { title: "Process plant" };

export default function ProcessLinePage() {
  return (
    <Workspace crumbs={crumbs({ label: "Process plant" })} askContext="Process plant diagram">
      <div className="plant-page">
        <PageHeader
          className="pfd-page-head-compact"
          eyebrow={processEyebrow("/process/line")}
          title="Process plant"
          meta="Unit-by-unit flow diagram."
          actions={<AskButton context="Process plant" label="Ask about this plant" />}
        />
        <ProcessHubTabs />
        <p className="pfd-demo-banner">Demonstration data only.</p>
        <PlantDiagramViewer />
      </div>
    </Workspace>
  );
}
