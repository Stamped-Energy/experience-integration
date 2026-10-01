import type { Role } from "@/lib/types";

export type NotifyPerson = {
  id: string;
  name: string;
  role: Role;
  phoneMasked: string;
  areas: string[];
  assetIds: string[];
  skills: string[];
  whatsappEnabled: boolean;
};

export type AlarmRouteRule = {
  id: string;
  scope: "area" | "asset";
  /** Area name or asset id */
  target: string;
  label: string;
  primaryPersonId: string;
  backupPersonIds: string[];
  severityMin: "critical" | "warning" | "info";
};

/** People who can receive WhatsApp / be assigned work. */
export const notifyPeopleFixture: NotifyPerson[] = [
  {
    id: "usr_op",
    name: "Imran Khan",
    role: "operator",
    phoneMasked: "+91 •••• •• 4412",
    areas: ["Utilities", "Pyro"],
    assetIds: ["kiln_1", "comp_2"],
    skills: ["compressors", "kiln shift"],
    whatsappEnabled: true,
  },
  {
    id: "usr_sup",
    name: "Neha Singh",
    role: "supervisor",
    phoneMasked: "+91 •••• •• 8821",
    areas: ["Pyro", "Grinding", "Utilities"],
    assetIds: ["kiln_1", "cm_1", "mill_2", "comp_2"],
    skills: ["shift lead", "Rx triage"],
    whatsappEnabled: true,
  },
  {
    id: "usr_em",
    name: "Priya Nair",
    role: "energy_manager",
    phoneMasked: "+91 •••• •• 1033",
    areas: ["Grinding", "Dispatch", "Buildings"],
    assetIds: ["cm_1", "mill_2", "pack_1", "hvac_admin"],
    skills: ["TOD", "MD", "baseline"],
    whatsappEnabled: true,
  },
  {
    id: "usr_ph",
    name: "Ravi Mehta",
    role: "plant_head",
    phoneMasked: "+91 •••• •• 5500",
    areas: ["Pyro", "Grinding", "Utilities", "Dispatch", "Buildings"],
    assetIds: [],
    skills: ["escalation", "closure"],
    whatsappEnabled: true,
  },
  {
    id: "usr_op2",
    name: "Suresh Patil",
    role: "operator",
    phoneMasked: "+91 •••• •• 2290",
    areas: ["Dispatch", "Grinding"],
    assetIds: ["pack_1", "cm_1"],
    skills: ["packing", "mill"],
    whatsappEnabled: true,
  },
  {
    id: "usr_sus",
    name: "Kabir Das",
    role: "sustainability",
    phoneMasked: "+91 •••• •• 6677",
    areas: ["Buildings"],
    assetIds: ["hvac_admin"],
    skills: ["emissions", "SEC"],
    whatsappEnabled: false,
  },
];

export const alarmRouteRulesFixture: AlarmRouteRule[] = [
  {
    id: "route_pyro",
    scope: "area",
    target: "Pyro",
    label: "Pyro / kiln area",
    primaryPersonId: "usr_op",
    backupPersonIds: ["usr_sup", "usr_ph"],
    severityMin: "warning",
  },
  {
    id: "route_util",
    scope: "area",
    target: "Utilities",
    label: "Utilities (compressors, chillers)",
    primaryPersonId: "usr_op",
    backupPersonIds: ["usr_sup"],
    severityMin: "info",
  },
  {
    id: "route_grind",
    scope: "area",
    target: "Grinding",
    label: "Grinding mills",
    primaryPersonId: "usr_em",
    backupPersonIds: ["usr_sup", "usr_op2"],
    severityMin: "warning",
  },
  {
    id: "route_kiln1",
    scope: "asset",
    target: "kiln_1",
    label: "Kiln 1 (asset override)",
    primaryPersonId: "usr_sup",
    backupPersonIds: ["usr_op", "usr_ph"],
    severityMin: "critical",
  },
];

export function personById(id: string): NotifyPerson | undefined {
  return notifyPeopleFixture.find((p) => p.id === id);
}

/**
 * Recommend 2–3 assignees for a prescription/alarm from area + asset overlap.
 */
export function recommendAssignees(opts: {
  area?: string;
  assetId?: string;
  limit?: number;
}): NotifyPerson[] {
  const limit = opts.limit ?? 3;
  const scored = notifyPeopleFixture
    .filter((p) => p.whatsappEnabled)
    .map((p) => {
      let score = 0;
      if (opts.assetId && p.assetIds.includes(opts.assetId)) score += 5;
      if (opts.area && p.areas.includes(opts.area)) score += 3;
      if (p.role === "supervisor") score += 1;
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.p.name.localeCompare(b.p.name));

  const top = scored.slice(0, limit).map((x) => x.p);
  if (top.length >= 2) return top;
  // Fallback: supervisors + operators who can notify
  return notifyPeopleFixture
    .filter((p) => p.whatsappEnabled && (p.role === "supervisor" || p.role === "operator"))
    .slice(0, limit);
}

export function routesForPerson(personId: string): AlarmRouteRule[] {
  return alarmRouteRulesFixture.filter(
    (r) => r.primaryPersonId === personId || r.backupPersonIds.includes(personId),
  );
}
