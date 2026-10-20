/** Placeholder for an area Proto Bot builds on top of the foundation. Lists the planned screens from the spec sitemap. */
import Link from "next/link";
import { Workspace } from "@/components/shell/Shell";
import { PageHeader, Section } from "@/components/ui/primitives";

export interface StubScreen { name: string; what: string; template: string }
export function AreaStub({ area, title, intro, screens, related }: { area: string; title: string; intro: string; screens: StubScreen[]; related?: { label: string; href: string }[] }) {
  return (
    <Workspace crumbs={[{ label: "Demonstration plant", href: "/" }, { label: area }]} askContext={area}>
      <PageHeader eyebrow={area} title={title} meta={intro} />
      <div className="grid">
        <div className="span-8">
          <Section title="Screens in this area" meta="Being built on the foundation" flush>
            <table className="table">
              <thead><tr><th>Screen</th><th>What it shows</th><th>Template</th></tr></thead>
              <tbody>{screens.map((s) => <tr key={s.name}><td style={{ fontWeight: 500 }}>{s.name}</td><td className="secondary">{s.what}</td><td className="mono">{s.template}</td></tr>)}</tbody>
            </table>
          </Section>
        </div>
        <div className="span-4 stack">
          <Section title="Meanwhile">
            <div className="stack-sm" style={{ fontSize: 13 }}>
              <span className="secondary">The cards for this area already appear in Home and Inbox.</span>
              {(related ?? [{ label: "Open Inbox", href: "/inbox" }, { label: "Plant view on Home", href: "/?view=plant" }]).map((r) => <Link key={r.href} className="link" href={r.href}>{r.label}</Link>)}
            </div>
          </Section>
        </div>
      </div>
    </Workspace>
  );
}
