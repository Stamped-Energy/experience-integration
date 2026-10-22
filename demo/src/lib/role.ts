import type { RoleId } from "@/lib/demo/types";
import { roles } from "@/lib/demo/data";

export const ROLE_COOKIE = "stamped-role";
export const DEFAULT_ROLE: RoleId = "plant-head";

export function parseRoleId(value: string | null | undefined): RoleId {
  return roles.some((r) => r.id === value) ? (value as RoleId) : DEFAULT_ROLE;
}

/** Static demo pages use the default role at build time; live role comes from RoleProvider on the client. */
export function demoRole(): RoleId {
  return DEFAULT_ROLE;
}
