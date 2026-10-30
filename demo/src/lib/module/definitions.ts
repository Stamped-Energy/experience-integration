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
      ],
    },
  ],
};

export function screenActive(href: string, path: string): boolean {
  if (href === "/process" || href === "/quality") return path === href;
  return path === href || path.startsWith(`${href}/`);
}
