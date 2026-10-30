import type { ModuleDefinition, ModuleScreen } from "./types";

const screen = (s: Omit<ModuleScreen, "count">): ModuleScreen => s;

export const processModule: ModuleDefinition = {
  id: "process",
  label: "Process",
  homeHref: "/process",
  groups: [
    {
      id: "scan",
      label: "Scan",
      screens: [
        screen({ id: "overview", label: "Overview", href: "/process" }),
        screen({ id: "health", label: "Health map", href: "/process/health" }),
        screen({ id: "line", label: "Process line view", href: "/process/line" }),
        screen({ id: "analytics", label: "Analytics", href: "/process/analytics" }),
        screen({ id: "oee", label: "OEE", href: "/process/oee" }),
        screen({ id: "drift", label: "Drift", href: "/process/drift" }),
        screen({ id: "modules", label: "Modules", href: "/process/modules" }),
      ],
    },
    {
      id: "decide",
      label: "Decide",
      screens: [
        screen({ id: "actions", label: "Actions", href: "/process/actions" }),
        screen({ id: "proposals", label: "Proposals", href: "/process/proposals" }),
      ],
    },
    {
      id: "improve",
      label: "Improve",
      screens: [
        screen({ id: "optimisation", label: "Optimisation runs", href: "/process/optimisation" }),
        screen({ id: "simulations", label: "Simulations", href: "/process/simulations" }),
        screen({ id: "simulate", label: "Simulate (legacy)", href: "/process/simulate" }),
        screen({ id: "trials", label: "Trials and stops", href: "/process/trials" }),
      ],
    },
    {
      id: "setup",
      label: "Setup",
      screens: [
        screen({ id: "measurement", label: "Measurement plans", href: "/process/measurement" }),
        screen({ id: "settings", label: "Running settings", href: "/process/settings" }),
        screen({ id: "model-fit", label: "Model fit", href: "/process/model-fit" }),
        screen({ id: "cycle-time", label: "Cycle time", href: "/process/cycle-time" }),
        screen({ id: "smed", label: "SMED", href: "/process/smed" }),
        screen({ id: "tool-life", label: "Tool life", href: "/process/tool-life" }),
      ],
    },
  ],
};

export const qualityModule: ModuleDefinition = {
  id: "quality",
  label: "Quality",
  homeHref: "/quality",
  groups: [
    {
      id: "scan",
      label: "Scan",
      screens: [
        screen({ id: "overview", label: "Overview", href: "/quality" }),
        screen({ id: "health", label: "Health map", href: "/quality/health" }),
        screen({ id: "analytics", label: "Analytics", href: "/quality/analytics" }),
        screen({ id: "monitor", label: "Monitor", href: "/quality/monitor" }),
        screen({ id: "drift", label: "Drift", href: "/quality/drift" }),
        screen({ id: "capability", label: "Capability", href: "/quality/capability" }),
      ],
    },
    {
      id: "decide",
      label: "Decide",
      screens: [
        screen({ id: "actions", label: "Actions", href: "/quality/actions" }),
        screen({ id: "agent", label: "Agent work", href: "/quality/agent" }),
        screen({ id: "investigations", label: "Investigations", href: "/quality/investigations" }),
        screen({ id: "links", label: "Link confirmations", href: "/quality/links" }),
      ],
    },
    {
      id: "improve",
      label: "Improve",
      screens: [screen({ id: "simulations", label: "Simulations", href: "/quality/simulations" })],
    },
    {
      id: "setup",
      label: "Setup",
      screens: [
        screen({ id: "specs", label: "Specs and grades", href: "/quality/specs" }),
        screen({ id: "corrections", label: "Corrections", href: "/quality/corrections" }),
        screen({ id: "spc", label: "SPC", href: "/quality/spc" }),
        screen({ id: "capa", label: "CAPA", href: "/quality/capa" }),
        screen({ id: "genealogy", label: "Genealogy", href: "/quality/genealogy" }),
        screen({ id: "gauge-rr", label: "Gauge R&R", href: "/quality/gauge-rr" }),
        screen({ id: "suppliers", label: "Suppliers", href: "/quality/suppliers" }),
      ],
    },
  ],
};

export function screenActive(href: string, path: string): boolean {
  if (href === "/process" || href === "/quality") return path === href;
  return path === href || path.startsWith(`${href}/`);
}
