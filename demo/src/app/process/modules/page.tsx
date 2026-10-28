import { Workspace } from "@/components/shell/Shell";
import { PageHeader, Section, Tag } from "@/components/ui/primitives";
import { ProcessTabs, crumbs } from "@/components/process/common";

export const metadata = { title: "Modules and shadow" };

const META =
  "Control modules the agent combines per plant (D151). Bounded search and rules recommend; model predictive control and reinforcement learning stay in shadow until promoted. The supervisor selects and explains; it never sets a number.";

export default function ProcessModulesPage() {
  return (
    <Workspace crumbs={crumbs({ label: "Modules and shadow" })} askContext="Process modules">
      <PageHeader eyebrow="Process" title="Modules and shadow" meta={META} />
      <ProcessTabs active="modules" />
      <Section title="In progress" meta="Full screen is being built on a parallel branch">
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>
          This stub keeps the Process tab reachable. Module list, shadow compare lanes and deploy gates will land here without changing this route.
        </p>
        <p style={{ marginTop: 12 }}><Tag tone="warning">Illustrative placeholder</Tag></p>
      </Section>
    </Workspace>
  );
}
