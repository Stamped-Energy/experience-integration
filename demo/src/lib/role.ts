import { cookies } from "next/headers";
import type { RoleId } from "@/lib/demo/types";
import { roles } from "@/lib/demo/data";

export const ROLE_COOKIE = "stamped-role";
export const DEFAULT_ROLE: RoleId = "plant-head";

/** Server-side: the role the showcase is viewed as. Set by the role switcher (cookie). */
export async function currentRole(): Promise<RoleId> {
  const v = (await cookies()).get(ROLE_COOKIE)?.value;
  return roles.some((r) => r.id === v) ? (v as RoleId) : DEFAULT_ROLE;
}
