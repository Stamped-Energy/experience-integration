/** Rail order is the same for every role (spec §2.3, recognition over recall). Maintenance is hidden. */
export type AreaKey = "home" | "inbox" | "process" | "quality" | "plant" | "ask" | "planning" | "settings" | "activity";
export interface NavItem { key: AreaKey; label: string; href: string; soon?: boolean; mobile?: boolean; group: 1 | 2 }
export const NAV: NavItem[] = [
  { key: "home", label: "Home", href: "/", mobile: true, group: 1 },
  { key: "inbox", label: "Inbox", href: "/inbox", mobile: true, group: 1 },
  { key: "process", label: "Process", href: "/process", mobile: true, group: 1 },
  { key: "quality", label: "Quality", href: "/quality", mobile: true, group: 1 },
  { key: "plant", label: "Plant", href: "/plant", group: 1 },
  { key: "ask", label: "Ask", href: "/ask", mobile: true, group: 1 },
  { key: "planning", label: "Planning, coming soon", href: "/planning", soon: true, group: 2 },
  { key: "settings", label: "Settings", href: "/settings", group: 2 },
  { key: "activity", label: "Activity", href: "/activity", group: 2 },
];
export function areaFor(path: string): AreaKey {
  if (path === "/") return "home";
  const k = path.split("/")[1] as AreaKey;
  return NAV.some((n) => n.key === k) ? k : "home";
}
