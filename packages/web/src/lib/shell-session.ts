import type { UpstreamProbe } from "@/lib/bff";
import type { ConnectionStatus, Role } from "@/lib/types";

const ROLES: readonly Role[] = [
  "operator",
  "supervisor",
  "plant_head",
  "energy_manager",
  "sustainability",
  "cfo",
  "admin",
];

/** Map `/api/me` membershipRole to AppShell Role — never invent admin. */
export function toShellRole(membershipRole: string | null | undefined): Role {
  if (membershipRole && (ROLES as readonly string[]).includes(membershipRole)) {
    return membershipRole as Role;
  }
  return "operator";
}

/** Live-oriented connection chip from upstream probe (not demo fixture timestamps). */
export function connectionFromProbe(
  probe: UpstreamProbe | null,
): ConnectionStatus {
  if (!probe) {
    return { sse: "reconnecting" };
  }
  const anyLive =
    probe.l2 === "live" || probe.l5 === "live" || probe.l4 === "live";
  if (anyLive && !probe.demoMode) {
    return { sse: "live", lastEventAt: probe.checkedAt };
  }
  if (probe.l2 === "down" && probe.l5 === "down") {
    return { sse: "offline", lastEventAt: probe.checkedAt };
  }
  return { sse: "reconnecting", lastEventAt: probe.checkedAt };
}
