import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { PageHead, Panel } from "@/components/ui/primitives";
import {
  Activity,
  BarChart3,
  Leaf,
  Map,
  Settings,
  Users,
} from "@/components/ui/icons";
import {
  DEMO_SHELL_ROLE,
  DEMO_PLANT,
  connectionFixture,
  demoCriticalAlarmCount,
} from "@/fixtures/demo";
const TOOLS = [
  {
    href: "/energy",
    title: "Energy Analytics",
    blurb: "Trends, baselines, and cost views for the billing window.",
    Icon: BarChart3,
  },
  {
    href: "/equipment",
    title: "Machine Health",
    blurb: "Load dials and asset status for shift triage.",
    Icon: Activity,
  },
  {
    href: "/plant-map",
    title: "Plant Map / Energy twin",
    blurb: "Expandable power hierarchy across incomers and sections.",
    Icon: Map,
  },
  {
    href: "/intensity",
    title: "Sustainability",
    blurb: "Intensity, TOD bands, and CO₂ factors.",
    Icon: Leaf,
  },
  {
    href: "/settings/assignments",
    title: "Assignments",
    blurb: "Who gets alarm WhatsApp and Rx assign recommendations.",
    Icon: Users,
  },
  {
    href: "/settings/integrations",
    title: "Integrations",
    blurb: "Connections for exports and enterprise systems.",
    Icon: Settings,
  },
] as const;

export default function ToolsPage() {
  return (
    <AppShell
      active="tools"
      plantName={DEMO_PLANT.plantName}
      role={DEMO_SHELL_ROLE}
      connection={connectionFixture}
      screenTitle="Tools"
      contextSummary={["Specialized plant tools", DEMO_PLANT.plantName]}
      criticalAlarmCount={demoCriticalAlarmCount()}
    >
      <PageHead eyebrow="Operations" title="Tools" />
      <p style={{ margin: 0, fontSize: 14, color: "var(--forge-on-surface-variant)", maxWidth: 640 }}>
        Open a specialized screen. Alarms and prescriptions stay in primary navigation.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        {TOOLS.map(({ href, title, blurb, Icon }) => (
          <Link key={href} href={href} style={{ display: "block" }}>
            <Panel style={{ height: "100%", transition: "box-shadow 0.15s" }}>
              <Icon size={22} color="var(--forge-primary)" />
              <h2 className="forge-card-title" style={{ marginTop: 12, fontSize: 17 }}>
                {title}
              </h2>
              <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--forge-on-surface-variant)" }}>
                {blurb}
              </p>
            </Panel>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
