import type { ModuleDefinition, ModuleScreen } from "./types";
import { PROCESS_HUBS, QUALITY_HUBS } from "./hubs";

const screen = (s: Omit<ModuleScreen, "count">): ModuleScreen => s;

const processScreens = PROCESS_HUBS.map((h) =>
  screen({ id: h.id, label: h.sidebarLabel, href: h.sidebarHref }),
);

const qualityScreens = QUALITY_HUBS.map((h) =>
  screen({ id: h.id, label: h.sidebarLabel, href: h.sidebarHref }),
);

export const processModule: ModuleDefinition = {
  id: "process",
  label: "Process",
  homeHref: "/process/proposals",
  groups: [
    {
      id: "main",
      label: "Process",
      screens: processScreens,
    },
  ],
};

export const qualityModule: ModuleDefinition = {
  id: "quality",
  label: "Quality",
  homeHref: "/quality/actions",
  groups: [
    {
      id: "main",
      label: "Quality",
      screens: qualityScreens,
    },
  ],
};

export function screenActive(href: string, path: string): boolean {
  if (href === "/process/proposals") {
    return (
      path === href ||
      path.startsWith("/process/proposals/") ||
      path === "/process/trials" ||
      path.startsWith("/process/trials/") ||
      path === "/process/actions" ||
      path.startsWith("/process/actions/") ||
      path === "/process/agent"
    );
  }
  if (href === "/process") {
    return path === "/process" || path.startsWith("/process/lines/") || path.startsWith("/process/runs/") || path === "/process/line" || path === "/process/health";
  }
  if (href === "/process/analytics") {
    return (
      path === "/process/analytics" ||
      path === "/process/oee" ||
      path === "/process/cycle-time" ||
      path === "/process/tool-life" ||
      path === "/process/smed" ||
      path === "/process/simulate"
    );
  }
  if (href === "/process/reports") {
    return path === "/process/reports" || path.startsWith("/process/reports/");
  }
  if (href === "/process/settings") {
    return path === "/process/settings" || path === "/process/measurement" || path === "/process/model-fit";
  }
  if (href === "/process/dashboards") {
    return (
      path === "/process/dashboards" ||
      path === "/process/optimisation" ||
      path === "/process/simulations" ||
      path === "/process/modules" ||
      path === "/process/drift"
    );
  }
  if (href === "/quality/actions") {
    return (
      path === "/quality/actions" ||
      path.startsWith("/quality/actions/") ||
      path === "/quality/capa" ||
      path === "/quality/corrections" ||
      path === "/quality/links" ||
      path === "/quality/agent" ||
      path === "/quality/investigations" ||
      path.startsWith("/quality/investigations/")
    );
  }
  if (href === "/quality") {
    return (
      path === "/quality" ||
      path.startsWith("/quality/lots/") ||
      path === "/quality/spc" ||
      path === "/quality/capability" ||
      path === "/quality/drift" ||
      path === "/quality/genealogy" ||
      path === "/quality/health"
    );
  }
  if (href === "/quality/analytics") {
    return path === "/quality/analytics" || path === "/quality/roi" || path === "/quality/suppliers";
  }
  if (href === "/quality/specs") {
    return path === "/quality/specs" || path === "/quality/gauge-rr";
  }
  if (href === "/quality/simulations") {
    return (
      path === "/quality/simulations" ||
      path === "/quality/monitor" ||
      path === "/quality/cause-gap" ||
      path === "/quality/causes"
    );
  }
  if (href === "/process" || href === "/quality") return path === href;
  return path === href || path.startsWith(`${href}/`);
}
