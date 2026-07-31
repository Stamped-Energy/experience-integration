import type { NavKey, Role } from "@/lib/types";

export type NavItem = {
  key: NavKey;
  href: string;
  label: string;
  permission: `route:${string}`;
  tier: "primary" | "reveal";
};

/**
 * Nav order mirrors stamped-energy-dashboard, plus ops screens (Alarms, Ask Analyst, Tools).
 * Plant Map is its own route - not a Machine Health tab.
 */
export const NAV_ITEMS: NavItem[] = [
  { key: "today", href: "/", label: "Overview", permission: "route:today", tier: "primary" },
  { key: "live", href: "/live", label: "Live", permission: "route:live", tier: "primary" },
  {
    key: "energy",
    href: "/energy",
    label: "Energy Analytics",
    permission: "route:energy",
    tier: "primary",
  },
  {
    key: "equipment",
    href: "/equipment",
    label: "Machine Health",
    permission: "route:equipment",
    tier: "primary",
  },
  { key: "alarms", href: "/alarms", label: "Alarms", permission: "route:alarms", tier: "primary" },
  {
    key: "prescriptions",
    href: "/prescriptions",
    label: "Prescriptions",
    permission: "route:prescriptions",
    tier: "primary",
  },
  {
    key: "plant_map",
    href: "/plant-map",
    label: "Plant Map",
    permission: "route:equipment",
    tier: "primary",
  },
  {
    key: "reports",
    href: "/reports",
    label: "Reports",
    permission: "route:reports",
    tier: "primary",
  },
  {
    key: "intensity",
    href: "/intensity",
    label: "Sustainability",
    permission: "route:intensity",
    tier: "primary",
  },
  {
    key: "analyst",
    href: "/analyst",
    label: "Ask Analyst",
    permission: "route:analyst",
    tier: "primary",
  },
  {
    key: "tools",
    href: "/tools",
    label: "Tools",
    permission: "route:today",
    tier: "reveal",
  },
  {
    key: "assignments",
    href: "/settings/assignments",
    label: "Assignments",
    permission: "route:admin",
    tier: "reveal",
  },
  {
    key: "admin",
    href: "/settings/admin",
    label: "Settings",
    permission: "route:admin",
    tier: "primary",
  },
  {
    key: "integrations",
    href: "/settings/integrations",
    label: "Integrations",
    permission: "route:integrations",
    tier: "reveal",
  },
  {
    key: "evidence",
    href: "/evidence",
    label: "Evidence",
    permission: "route:evidence",
    tier: "primary",
  },
];

const ROLE_ROUTES: Record<Role, readonly string[]> = {
  operator: [
    "route:today",
    "route:live",
    "route:alarms",
    "route:prescriptions",
    "route:evidence",
    "route:analyst",
    "route:equipment",
  ],
  supervisor: [
    "route:today",
    "route:live",
    "route:alarms",
    "route:prescriptions",
    "route:evidence",
    "route:analyst",
    "route:reports",
    "route:energy",
    "route:equipment",
  ],
  plant_head: [
    "route:today",
    "route:live",
    "route:alarms",
    "route:prescriptions",
    "route:evidence",
    "route:analyst",
    "route:reports",
    "route:ledger",
    "route:energy",
    "route:equipment",
    "route:intensity",
  ],
  energy_manager: [
    "route:today",
    "route:live",
    "route:alarms",
    "route:prescriptions",
    "route:evidence",
    "route:analyst",
    "route:reports",
    "route:ledger",
    "route:energy",
    "route:equipment",
    "route:intensity",
  ],
  sustainability: [
    "route:today",
    "route:reports",
    "route:ledger",
    "route:intensity",
    "route:evidence",
    "route:analyst",
  ],
  cfo: ["route:today", "route:reports", "route:ledger", "route:analyst"],
  admin: [
    "route:today",
    "route:live",
    "route:alarms",
    "route:prescriptions",
    "route:evidence",
    "route:analyst",
    "route:reports",
    "route:ledger",
    "route:energy",
    "route:equipment",
    "route:intensity",
    "route:integrations",
    "route:admin",
  ],
};

export function canAccessRoute(role: Role, permission: string): boolean {
  return ROLE_ROUTES[role]?.includes(permission) === true;
}

export const OPS_INVARIANTS: readonly NavKey[] = ["alarms", "prescriptions"];

export const NAV_PIN_STORAGE_KEY = "stamped.l6.nav.pins";
export const NAV_COLLAPSE_STORAGE_KEY = "stamped.l6.nav.collapsed";
export const NAV_GROUPS_STORAGE_KEY = "stamped.l6.nav.groups";

/** Top-level links - always visible, never tucked in a group. */
export const STANDALONE_NAV_KEYS: readonly NavKey[] = ["today", "live", "analyst"];

export type NavGroupId = "operations" | "insights" | "reports" | "administration";

/** Collapsible sidebar groups - keeps the nav calm instead of 15 flat links. */
export const NAV_GROUP_DEFS: readonly {
  id: NavGroupId;
  label: string;
  keys: readonly NavKey[];
}[] = [
  { id: "operations", label: "Operations", keys: ["alarms", "prescriptions", "evidence"] },
  {
    id: "insights",
    label: "Insights",
    keys: ["energy", "equipment", "plant_map", "intensity"],
  },
  { id: "reports", label: "Reports", keys: ["reports"] },
  {
    id: "administration",
    label: "Administration",
    keys: ["admin", "assignments", "integrations", "tools"],
  },
];

export type NavTreeGroup = {
  id: NavGroupId;
  label: string;
  items: NavItem[];
  defaultOpen: boolean;
};

export type NavTree = {
  standalone: NavItem[];
  groups: NavTreeGroup[];
};

export function navForRole(role: Role): {
  primary: NavItem[];
  reveal: NavItem[];
} {
  const allowed = NAV_ITEMS.filter((item) => canAccessRoute(role, item.permission));
  return {
    primary: allowed.filter((i) => i.tier === "primary"),
    reveal: allowed.filter((i) => i.tier === "reveal"),
  };
}

export function isOpsInvariant(key: NavKey): boolean {
  return OPS_INVARIANTS.includes(key);
}

export function sanitizePins(role: Role, pins: readonly NavKey[]): NavKey[] {
  const { reveal } = navForRole(role);
  const revealKeys = new Set(reveal.map((i) => i.key));
  const seen = new Set<NavKey>();
  const out: NavKey[] = [];
  for (const key of pins) {
    if (isOpsInvariant(key)) continue;
    if (!revealKeys.has(key)) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

export function readPins(storage: Pick<Storage, "getItem"> | null | undefined): NavKey[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(NAV_PIN_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((k): k is NavKey => typeof k === "string") as NavKey[];
  } catch {
    return [];
  }
}

export function writePins(
  storage: Pick<Storage, "setItem"> | null | undefined,
  pins: readonly NavKey[],
): void {
  if (!storage) return;
  storage.setItem(NAV_PIN_STORAGE_KEY, JSON.stringify(pins));
}

export function readCollapsed(storage: Pick<Storage, "getItem"> | null | undefined): boolean {
  if (!storage) return false;
  return storage.getItem(NAV_COLLAPSE_STORAGE_KEY) === "1";
}

export function writeCollapsed(
  storage: Pick<Storage, "setItem"> | null | undefined,
  collapsed: boolean,
): void {
  if (!storage) return;
  storage.setItem(NAV_COLLAPSE_STORAGE_KEY, collapsed ? "1" : "0");
}

export function composeNav(
  role: Role,
  pins: readonly NavKey[] = [],
): { primary: NavItem[]; reveal: NavItem[] } {
  const base = navForRole(role);
  const clean = sanitizePins(role, pins);
  const pinSet = new Set(clean);
  const pinned = base.reveal.filter((i) => pinSet.has(i.key));
  const remainingReveal = base.reveal.filter((i) => !pinSet.has(i.key));
  return {
    primary: [...base.primary, ...pinned],
    reveal: remainingReveal,
  };
}

export function togglePin(role: Role, pins: readonly NavKey[], key: NavKey): NavKey[] {
  if (isOpsInvariant(key)) return sanitizePins(role, pins);
  const set = new Set(sanitizePins(role, pins));
  if (set.has(key)) set.delete(key);
  else set.add(key);
  return sanitizePins(role, [...set]);
}

export function mobileDock(role: Role, pins: readonly NavKey[] = []): NavItem[] {
  return composeNav(role, pins).primary.slice(0, 3);
}

export function readOpenGroups(
  storage: Pick<Storage, "getItem"> | null | undefined,
): NavGroupId[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(NAV_GROUPS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const valid = new Set(NAV_GROUP_DEFS.map((g) => g.id));
    return parsed.filter((id): id is NavGroupId => typeof id === "string" && valid.has(id as NavGroupId));
  } catch {
    return [];
  }
}

export function writeOpenGroups(
  storage: Pick<Storage, "setItem"> | null | undefined,
  groups: readonly NavGroupId[],
): void {
  if (!storage) return;
  storage.setItem(NAV_GROUPS_STORAGE_KEY, JSON.stringify(groups));
}

export function composeNavTree(
  role: Role,
  pins: readonly NavKey[] = [],
  opts?: { active?: NavKey; persistedOpen?: readonly NavGroupId[]; forceOpen?: readonly NavGroupId[] },
): NavTree {
  const { primary, reveal } = composeNav(role, pins);
  const allItems = [...primary, ...reveal];
  const itemMap = new Map(allItems.map((item) => [item.key, item]));
  const pinSet = new Set(sanitizePins(role, pins));
  const active = opts?.active;
  const persistedOpen = new Set(opts?.persistedOpen ?? []);
  const forceOpen = new Set(opts?.forceOpen ?? []);

  const standalone = STANDALONE_NAV_KEYS.map((key) => itemMap.get(key)).filter(
    (item): item is NavItem => item != null,
  );

  const groups: NavTreeGroup[] = [];
  for (const def of NAV_GROUP_DEFS) {
    const items = def.keys
      .map((key) => itemMap.get(key))
      .filter((item): item is NavItem => item != null);
    if (items.length === 0) continue;

    const hasActive = active != null && items.some((item) => item.key === active);
    const hasPinned = items.some((item) => pinSet.has(item.key));
    const defaultOpen =
      forceOpen.has(def.id) ||
      hasActive ||
      hasPinned ||
      persistedOpen.has(def.id);

    groups.push({ id: def.id, label: def.label, items, defaultOpen });
  }

  return { standalone, groups };
}

/** Flat list for icon-only sidebar mode. */
export function flattenNavTree(tree: NavTree): NavItem[] {
  return [...tree.standalone, ...tree.groups.flatMap((group) => group.items)];
}
