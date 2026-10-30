/** Compressed module IA: five sidebar pages, horizontal tabs per hub (ADR-042). */

export type ProcessHubId = "actions" | "dashboards" | "plant" | "reports" | "analytics";
export type QualityHubId = "actions" | "inspect" | "analytics" | "simulations" | "setup";

export interface HubTab {
  href: string;
  label: string;
  match: (path: string) => boolean;
}

export interface HubDef {
  id: string;
  sidebarLabel: string;
  sidebarHref: string;
  tabs: HubTab[];
}

function exactOrPrefix(prefix: string) {
  return (path: string) => path === prefix || path.startsWith(`${prefix}/`);
}

export const PROCESS_HUBS: HubDef[] = [
  {
    id: "actions",
    sidebarLabel: "Actions",
    sidebarHref: "/process/proposals",
    tabs: [
      { href: "/process/proposals", label: "Proposals", match: exactOrPrefix("/process/proposals") },
      { href: "/process/trials", label: "Trials and stops", match: exactOrPrefix("/process/trials") },
      { href: "/process/drift", label: "Drift", match: (p) => p === "/process/drift" },
      { href: "/process/actions", label: "Action queue", match: (p) => p === "/process/actions" },
    ],
  },
  {
    id: "dashboards",
    sidebarLabel: "Dashboards",
    sidebarHref: "/process/dashboards",
    tabs: [{ href: "/process/dashboards", label: "Loop dashboard", match: (p) => p === "/process/dashboards" }],
  },
  {
    id: "plant",
    sidebarLabel: "Process plant",
    sidebarHref: "/process/line",
    tabs: [
      { href: "/process/line", label: "Flow diagram", match: (p) => p === "/process/line" },
      { href: "/process/health", label: "Health map", match: (p) => p === "/process/health" },
    ],
  },
  {
    id: "reports",
    sidebarLabel: "Reports",
    sidebarHref: "/process/reports",
    tabs: [{ href: "/process/reports", label: "Shift note", match: (p) => p === "/process/reports" }],
  },
  {
    id: "analytics",
    sidebarLabel: "Analytics",
    sidebarHref: "/process/analytics",
    tabs: [
      { href: "/process/analytics", label: "Overview", match: (p) => p === "/process/analytics" },
      { href: "/process/optimisation", label: "Loop runs", match: (p) => p === "/process/optimisation" },
      { href: "/process/simulations", label: "Simulations", match: (p) => p === "/process/simulations" },
      {
        href: "/process/measurement",
        label: "Setup",
        match: (p) =>
          p === "/process/measurement" ||
          p === "/process/settings" ||
          p === "/process/model-fit" ||
          p === "/process/modules" ||
          p === "/process/cycle-time" ||
          p === "/process/smed" ||
          p === "/process/tool-life" ||
          p === "/process/oee" ||
          p === "/process" ||
          p.startsWith("/process/lines/") ||
          p.startsWith("/process/runs/"),
      },
    ],
  },
];

export const QUALITY_HUBS: HubDef[] = [
  {
    id: "actions",
    sidebarLabel: "Actions",
    sidebarHref: "/quality/actions",
    tabs: [
      { href: "/quality/actions", label: "Action cards", match: (p) => p === "/quality/actions" },
      { href: "/quality/capa", label: "CAPA", match: (p) => p === "/quality/capa" },
      { href: "/quality/corrections", label: "Corrections", match: (p) => p === "/quality/corrections" },
      { href: "/quality/links", label: "Link confirmations", match: (p) => p === "/quality/links" },
      { href: "/quality/agent", label: "Agent work", match: (p) => p === "/quality/agent" },
      { href: "/quality/investigations", label: "Investigations", match: exactOrPrefix("/quality/investigations") },
    ],
  },
  {
    id: "inspect",
    sidebarLabel: "Inspect",
    sidebarHref: "/quality/health",
    tabs: [
      { href: "/quality/health", label: "Health map", match: (p) => p === "/quality/health" },
      { href: "/quality/spc", label: "SPC", match: (p) => p === "/quality/spc" },
      { href: "/quality/genealogy", label: "Genealogy", match: (p) => p === "/quality/genealogy" },
      { href: "/quality", label: "Lots overview", match: (p) => p === "/quality" },
      { href: "/quality/monitor", label: "Monitor", match: (p) => p === "/quality/monitor" },
      { href: "/quality/capability", label: "Capability", match: (p) => p === "/quality/capability" },
      { href: "/quality/drift", label: "Drift", match: (p) => p === "/quality/drift" },
    ],
  },
  {
    id: "analytics",
    sidebarLabel: "Analytics",
    sidebarHref: "/quality/analytics",
    tabs: [
      { href: "/quality/analytics", label: "Trends", match: (p) => p === "/quality/analytics" },
      { href: "/quality/roi", label: "ROI", match: (p) => p === "/quality/roi" },
      { href: "/quality/cause-gap", label: "Cause gap", match: (p) => p === "/quality/cause-gap" },
      { href: "/quality/causes", label: "Cause graphs", match: (p) => p === "/quality/causes" },
    ],
  },
  {
    id: "simulations",
    sidebarLabel: "Simulations",
    sidebarHref: "/quality/simulations",
    tabs: [{ href: "/quality/simulations", label: "Simulations", match: (p) => p === "/quality/simulations" }],
  },
  {
    id: "setup",
    sidebarLabel: "Setup",
    sidebarHref: "/quality/specs",
    tabs: [
      { href: "/quality/specs", label: "Specs and grades", match: (p) => p === "/quality/specs" },
      { href: "/quality/gauge-rr", label: "Gauge R&R", match: (p) => p === "/quality/gauge-rr" },
      { href: "/quality/suppliers", label: "Suppliers", match: (p) => p === "/quality/suppliers" },
    ],
  },
];

export function hubForProcessPath(path: string): HubDef | undefined {
  for (const hub of PROCESS_HUBS) {
    if (hub.tabs.some((t) => t.match(path))) return hub;
  }
  return undefined;
}

export function hubForQualityPath(path: string): HubDef | undefined {
  for (const hub of QUALITY_HUBS) {
    if (hub.tabs.some((t) => t.match(path))) return hub;
  }
  if (path.startsWith("/quality/lots/")) {
    return QUALITY_HUBS.find((h) => h.id === "inspect");
  }
  return undefined;
}

export function sidebarActiveProcess(path: string): string | undefined {
  return hubForProcessPath(path)?.sidebarHref;
}

export function sidebarActiveQuality(path: string): string | undefined {
  return hubForQualityPath(path)?.sidebarHref;
}
