import Link from "next/link";
import * as D from "@/lib/demo/data";
import { dayMonth } from "@/lib/format";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { PageHeader, Section } from "@/components/ui/primitives";
import { SECTIONS } from "@/components/settings/common";

export const metadata = { title: "Settings" };

function attentionItems() {
  const now = Date.parse(D.DEMO_NOW);
  return [
    ...D.standingApprovals
      .filter((a) => !a.revokedAt && (Date.parse(a.until) - now) / 864e5 <= 3)
      .map((a) => ({
        k: a.id,
        t: `${D.byId.line(a.lineId)?.short ?? a.lineId} standing approval expires ${dayMonth(a.until)}`,
        href: "/settings/approvals",
      })),
    ...D.webhooks
      .filter((w) => w.status === "failing" || w.status === "paused")
      .map((w) => ({
        k: w.id,
        t: `Webhook ${w.status}: ${new URL(w.url).hostname}`,
        href: "/settings/integrations",
      })),
    ...D.integrations
      .filter((i) => i.status !== "connected")
      .map((i) => ({ k: i.id, t: `${i.name} ${i.status}`, href: "/settings/integrations" })),
    ...D.signedWindows
      .filter((w) => (Date.parse(w.expiresAt) - now) / 864e5 <= 14)
      .map((w) => ({
        k: w.lineId + w.param,
        t: `${w.name} window expires ${dayMonth(w.expiresAt)}`,
        href: "/settings/limits",
      })),
  ];
}

export default function SettingsHome() {
  const attention = attentionItems();
  return (
    <Workspace crumbs={[{ label: "Demonstration plant", href: "/" }, { label: "Settings" }]} askContext="Settings">
      <PageHeader
        eyebrow="Settings"
        title="Settings"
        meta="Limits, people, routing, integrations, and plant setup. Open a section to change it."
        actions={<AskButton context="Settings" label="Ask about settings" />}
      />
      {attention.length ? (
        <div className="set-attn">
          <b>Needs attention</b>
          {attention.slice(0, 4).map((x) => (
            <Link key={x.k} href={x.href}>
              {x.t}
            </Link>
          ))}
        </div>
      ) : null}
      <Section title="All settings" meta={`${SECTIONS.length} sections`}>
        <nav className="set-hub set-hub-click" aria-label="Settings sections">
          {SECTIONS.map((s) => (
            <Link key={s.key} href={s.href} className="set-hub-card">
              <span className="set-hub-title">{s.label}</span>
              <span className="set-hub-sub">{s.sub}</span>
              <span className="set-hub-go">Open</span>
            </Link>
          ))}
        </nav>
      </Section>
    </Workspace>
  );
}
