import { ProcessHubTabs } from "@/components/process/ProcessHubTabs";
import { ReportReader } from "@/components/view/report-reader";
import { AskButton } from "@/components/shell/ShellClient";
import { Workspace } from "@/components/shell/Shell";
import { PageHeader } from "@/components/ui/primitives";
import { FORGING_SHIFT_REPORT } from "@/lib/demo/plantReport";
import { crumbs } from "@/components/process/common";

export const metadata = { title: "Reports" };

export default function ProcessReportsPage() {
  return (
    <Workspace crumbs={crumbs({ label: "Reports" })} askContext="Process reports">
      <PageHeader
        eyebrow="Process · Scan"
        title="Reports"
        meta="Narrative shift notes with sections, stat strips, and inline trends. Demonstration only."
        actions={<AskButton context="Process reports" label="Ask about this report" />}
      />
      <ProcessHubTabs />
      <ReportReader report={FORGING_SHIFT_REPORT} />
    </Workspace>
  );
}
