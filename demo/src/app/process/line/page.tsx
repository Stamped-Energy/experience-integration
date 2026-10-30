import { ProcessHubTabs } from "@/components/process/ProcessHubTabs";
import { PlantDiagramViewer } from "@/components/scan/forging-plant-viewer";
import { AskButton } from "@/components/shell/ShellClient";
import { Workspace } from "@/components/shell/Shell";
import { PageHeader } from "@/components/ui/primitives";
import { crumbs } from "@/components/process/common";

export const metadata = { title: "Process plant" };

export default function ProcessLinePage() {
  return (
    <Workspace crumbs={crumbs({ label: "Process plant" })} askContext="Process plant diagram">
      <div className="plant-page">
        <PageHeader
          className="pfd-page-head-compact"
          eyebrow="Process · Scan"
          title="Process plant"
          meta="Forging and heat-treatment flow · demonstration plant"
          actions={<AskButton context="Process plant" label="Ask about this plant" />}
        />
        <ProcessHubTabs />
        <PlantDiagramViewer />
      </div>
    </Workspace>
  );
}
