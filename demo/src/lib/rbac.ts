/**
 * RBAC matrix (spec §3): permission = role × action × scope. Template defaults; each plant edits them.
 * Signing defaults to the plant head; a plant may assign it to another named role beforehand.
 * "Release a hold" does not exist as an action in any role.
 */
import type { ActionId, Grant, Permission, RoleId } from "@/lib/demo/types";

const R: RoleId[] = ["operator", "shift-lead", "process-engineer", "quality-head", "plant-head", "owner", "stamped-engineer", "viewer"];
type Row = [ActionId, string, string]; // action, label, 8 chars: a=allow v=view .=hidden in R order

const ROWS: Row[] = [
  ["see-own-line", "See own line or area", "aaaaavvv"],
  ["see-plant-value", "See plant-wide context and value", ".vvvaavv"],
  ["decide-proposal", "Accept, adjust or decline a per-run proposal", "aaa.a..."],
  ["press-stop", "Press Stop on an asset in scope", "aaa.a..."],
  ["revoke-lease", "Revoke the offline lease on site", ".a..a..."],
  ["draft-trial", "Draft a trial", "..a.a.a."],
  ["sign-trial", "Sign a trial order", "....a..."],
  ["sign-limits", "Sign limits", "....a..."],
  ["narrow-limit", "Narrow a limit", "..a.a.a."],
  ["grant-standing-approval", "Grant a standing approval", "....a..."],
  ["confirm-lot-link", "Confirm a lot link", "...a...."],
  ["send-correction", "Send a correction to Process", "...a...."],
  ["accept-correction", "Accept a correction into a proposal", "..a.a..."],
  ["use-ask", "Use Ask", "aaaaaaaa"],
  ["manage-people", "Manage people, roles and routing", "....a.a."],
  ["manage-integrations", "Integrations and API keys", "....a.a."],
  ["export-reports", "Export reports", ".aaaaa.a"],
  ["audit-log", "Audit log", ".vvvaava"],
];

export const ACTION_LABELS: Record<ActionId, string> = Object.fromEntries(ROWS.map(([a, l]) => [a, l])) as Record<ActionId, string>;
export const ACTIONS: ActionId[] = ROWS.map(([a]) => a);
export const ROLE_ORDER = R;

export const permissions: Permission[] = ROWS.flatMap(([action, , cells]) =>
  R.map((role, i) => ({ role, action, value: (cells[i] === "a" ? "allow" : cells[i] === "v" ? "view" : "hidden") as Grant })),
);

export function grant(role: RoleId, action: ActionId): Grant {
  return permissions.find((p) => p.role === role && p.action === action)?.value ?? "hidden";
}

/** Scope check. In the showcase operators are scoped to Line A; everyone else to the site. */
export const ROLE_SCOPE: Record<RoleId, string[]> = {
  operator: ["line-a", "line-b"], // showcase lens: one operator view covers both demo lines
  "shift-lead": ["site-demo"], "process-engineer": ["site-demo"], "quality-head": ["site-demo"], "plant-head": ["site-demo"],
  owner: ["site-demo"], "stamped-engineer": ["site-demo"], viewer: ["site-demo"],
};

export function can(role: RoleId, action: ActionId, scope?: string): boolean {
  if (grant(role, action) !== "allow") return false;
  if (!scope) return true;
  const s = ROLE_SCOPE[role];
  return s.includes("site-demo") || s.includes(scope);
}

/** Roles that can do an action, for disabled-reason text ("Plant head can sign"). */
export function whoCan(action: ActionId): RoleId[] {
  return R.filter((r) => grant(r, action) === "allow");
}
