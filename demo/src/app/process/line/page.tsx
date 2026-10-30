import { ProcessLineView } from "@/components/scan/process-line-view";
import { AskButton } from "@/components/shell/ShellClient";
import { Workspace } from "@/components/shell/Shell";
import { PageHeader, Section } from "@/components/ui/primitives";
import { crumbs } from "@/components/process/common";

export const metadata = { title: "Process line view" };

export default function ProcessLinePage() {
  return (
    <Workspace crumbs={crumbs({ label: "Process line view" })} askContext="Process line view">
      <PageHeader
        eyebrow="Process · Scan"
        title="Process line view"
        meta="Schematic of each line with live tags. Deep links open Plant assets."
        actions={<AskButton context="Process line view" label="Ask about this line" />}
      />
      <Section title="Lines in process order" flush>
        <ProcessLineView />
      </Section>
    </Workspace>
  );
}
