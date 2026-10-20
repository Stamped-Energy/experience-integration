import { Workspace } from "@/components/shell/Shell";
import { PageHeader, Section, Tag } from "@/components/ui/primitives";
export const metadata = { title: "Planning" };
export default function Page() {
  return (
    <Workspace crumbs={[{ label: "Demonstration plant", href: "/" }, { label: "Planning" }]}>
      <PageHeader eyebrow="Planning" title="Planning is coming soon" actions={<Tag>Coming soon</Tag>} />
      <div className="grid">
        <div className="span-8">
          <Section title="What it will do">
            <div className="stack-sm" style={{ fontSize: 14, maxWidth: "70ch" }}>
              <p style={{ margin: 0 }}>Planning will recommend run order and grade changes using the same model of each machine that Process uses.</p>
              <p style={{ margin: 0 }} className="secondary">It will only recommend. Priorities, dates, routing and dispatch stay with your planners and your own systems.</p>
            </div>
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
