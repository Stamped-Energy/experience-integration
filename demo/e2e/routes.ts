/** Every demo route covered by layout overflow checks (ADR-042 IA). */

export const TOP_ROUTES = ["/", "/inbox", "/ask", "/settings"] as const;

export const PROCESS_ROUTES = [
  "/process/proposals",
  "/process/proposals/prop-101",
  "/process/trials",
  "/process/drift",
  "/process/actions",
  "/process/actions/ex-p1",
  "/process/agent",
  "/process/dashboards",
  "/process/line",
  "/process/health",
  "/process/reports",
  "/process/reports/rep-forge-week",
  "/process/analytics",
  "/process/optimisation",
  "/process/simulations",
  "/process/simulate",
  "/process/measurement",
  "/process/settings",
  "/process/model-fit",
  "/process/modules",
  "/process/cycle-time",
  "/process/smed",
  "/process/tool-life",
  "/process/oee",
  "/process",
] as const;

export const QUALITY_ROUTES = [
  "/quality/actions",
  "/quality/actions/ex-q1",
  "/quality/capa",
  "/quality/corrections",
  "/quality/links",
  "/quality/agent",
  "/quality/investigations",
  "/quality/investigations/inv-1",
  "/quality/lots/lot-a-3307",
  "/quality/health",
  "/quality/spc",
  "/quality/genealogy",
  "/quality",
  "/quality/monitor",
  "/quality/capability",
  "/quality/drift",
  "/quality/analytics",
  "/quality/roi",
  "/quality/cause-gap",
  "/quality/causes",
  "/quality/simulations",
  "/quality/specs",
  "/quality/gauge-rr",
  "/quality/suppliers",
] as const;

export const ALL_LAYOUT_ROUTES = [...TOP_ROUTES, ...PROCESS_ROUTES, ...QUALITY_ROUTES] as const;

export const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 1920, height: 1080 },
] as const;

export type RailMode = "expanded" | "collapsed";
