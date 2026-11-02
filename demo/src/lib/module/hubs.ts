/** Compressed module IA: client hubs for plant roles; Engineering hubs for Stamped engineer. */

export type ProcessHubId = "actions" | "lines" | "performance" | "reports" | "setup" | "engineering";
export type QualityHubId = "actions" | "lots" | "analytics" | "setup" | "engineering";
export type HubAudience = "client" | "engineering";

export interface HubTab {
  href: string;
  label: string;
  match: (path: string) => boolean;
}

export interface HubDef {
  id: string;
  sidebarLabel: string;
  sidebarHref: string;
  audience: HubAudience;
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
    audience: "client",
    tabs: [
      { href: "/process/proposals", label: "Proposals", match: exactOrPrefix("/process/proposals") },
      { href: "/process/trials", label: "Trials and stops", match: exactOrPrefix("/process/trials") },
      { href: "/process/actions", label: "Action queue", match: (p) => p === "/process/actions" },
      { href: "/process/agent", label: "Agent at work", match: (p) => p === "/process/agent" },
    ],
  },
  {
    id: "lines",
    sidebarLabel: "Lines",
    sidebarHref: "/process",
    audience: "client",
    tabs: [
      { href: "/process", label: "Lines overview", match: (p) => p === "/process" || p.startsWith("/process/lines/") || p.startsWith("/process/runs/") },
      { href: "/process/line", label: "Flow diagram", match: (p) => p === "/process/line" },
      { href: "/process/health", label: "Health map", match: (p) => p === "/process/health" },
    ],
  },
  {
    id: "performance",
    sidebarLabel: "Performance",
    sidebarHref: "/process/analytics",
    audience: "client",
    tabs: [
      { href: "/process/analytics", label: "Overview", match: (p) => p === "/process/analytics" },
      { href: "/process/oee", label: "OEE", match: (p) => p === "/process/oee" },
      { href: "/process/cycle-time", label: "Cycle time", match: (p) => p === "/process/cycle-time" },
      { href: "/process/tool-life", label: "Tool life", match: (p) => p === "/process/tool-life" },
      { href: "/process/smed", label: "Changeovers", match: (p) => p === "/process/smed" },
      { href: "/process/simulate", label: "Try on the model", match: (p) => p === "/process/simulate" },
    ],
  },
  {
    id: "reports",
    sidebarLabel: "Reports",
    sidebarHref: "/process/reports",
    audience: "client",
    tabs: [{ href: "/process/reports", label: "All reports", match: exactOrPrefix("/process/reports") }],
  },
  {
    id: "setup",
    sidebarLabel: "Setup",
    sidebarHref: "/process/settings",
    audience: "client",
    tabs: [
      { href: "/process/settings", label: "Running settings", match: (p) => p === "/process/settings" },
      { href: "/process/measurement", label: "Measurement plans", match: (p) => p === "/process/measurement" },
      { href: "/process/model-fit", label: "Model fit", match: (p) => p === "/process/model-fit" },
    ],
  },
  {
    id: "engineering",
    sidebarLabel: "Engineering",
    sidebarHref: "/process/dashboards",
    audience: "engineering",
    tabs: [
      { href: "/process/dashboards", label: "Loop dashboard", match: (p) => p === "/process/dashboards" },
      { href: "/process/optimisation", label: "Optimisation runs", match: (p) => p === "/process/optimisation" },
      { href: "/process/simulations", label: "Simulation campaigns", match: (p) => p === "/process/simulations" },
      { href: "/process/modules", label: "Modules and shadow", match: (p) => p === "/process/modules" },
      { href: "/process/drift", label: "Model upkeep", match: (p) => p === "/process/drift" },
    ],
  },
];

export const QUALITY_HUBS: HubDef[] = [
  {
    id: "actions",
    sidebarLabel: "Actions",
    sidebarHref: "/quality/actions",
    audience: "client",
    tabs: [
      { href: "/quality/actions", label: "Action cards", match: (p) => p === "/quality/actions" },
      { href: "/quality/investigations", label: "Investigations and 8D", match: exactOrPrefix("/quality/investigations") },
      { href: "/quality/corrections", label: "Corrections", match: (p) => p === "/quality/corrections" },
      { href: "/quality/links", label: "Link confirmations", match: (p) => p === "/quality/links" },
      { href: "/quality/agent", label: "Agent at work", match: (p) => p === "/quality/agent" },
    ],
  },
  {
    id: "lots",
    sidebarLabel: "Lots",
    sidebarHref: "/quality",
    audience: "client",
    tabs: [
      { href: "/quality", label: "Lots at risk", match: (p) => p === "/quality" || p.startsWith("/quality/lots/") },
      { href: "/quality/spc", label: "Control and capability", match: (p) => p === "/quality/spc" || p === "/quality/capability" },
      { href: "/quality/drift", label: "Drift", match: (p) => p === "/quality/drift" },
      { href: "/quality/genealogy", label: "Genealogy", match: (p) => p === "/quality/genealogy" },
      { href: "/quality/health", label: "Health map", match: (p) => p === "/quality/health" },
    ],
  },
  {
    id: "analytics",
    sidebarLabel: "Analytics",
    sidebarHref: "/quality/analytics",
    audience: "client",
    tabs: [
      { href: "/quality/analytics", label: "Trends", match: (p) => p === "/quality/analytics" },
      { href: "/quality/roi", label: "Value", match: (p) => p === "/quality/roi" },
      { href: "/quality/suppliers", label: "Suppliers", match: (p) => p === "/quality/suppliers" },
    ],
  },
  {
    id: "setup",
    sidebarLabel: "Setup",
    sidebarHref: "/quality/specs",
    audience: "client",
    tabs: [
      { href: "/quality/specs", label: "Specs and grades", match: (p) => p === "/quality/specs" },
      { href: "/quality/gauge-rr", label: "Gauge R&R", match: (p) => p === "/quality/gauge-rr" },
    ],
  },
  {
    id: "engineering",
    sidebarLabel: "Engineering",
    sidebarHref: "/quality/simulations",
    audience: "engineering",
    tabs: [
      { href: "/quality/simulations", label: "Simulation campaigns", match: (p) => p === "/quality/simulations" },
      { href: "/quality/monitor", label: "Monitor tuning", match: (p) => p === "/quality/monitor" },
      { href: "/quality/cause-gap", label: "Cause gap", match: (p) => p === "/quality/cause-gap" },
      { href: "/quality/causes", label: "Cause graphs", match: (p) => p === "/quality/causes" },
    ],
  },
];

export const ENGINEERING_PATH_PREFIXES = [
  "/process/dashboards",
  "/process/optimisation",
  "/process/simulations",
  "/process/modules",
  "/process/drift",
  "/quality/simulations",
  "/quality/monitor",
  "/quality/cause-gap",
  "/quality/causes",
] as const;

export function isEngineeringPath(path: string): boolean {
  return ENGINEERING_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

export function hubsVisibleTo(role: string, hubs: HubDef[]): HubDef[] {
  if (role === "stamped-engineer") return hubs;
  return hubs.filter((h) => h.audience === "client");
}

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
    return QUALITY_HUBS.find((h) => h.id === "lots");
  }
  return undefined;
}

export function sidebarActiveProcess(path: string): string | undefined {
  return hubForProcessPath(path)?.sidebarHref;
}

export function sidebarActiveQuality(path: string): string | undefined {
  return hubForQualityPath(path)?.sidebarHref;
}
