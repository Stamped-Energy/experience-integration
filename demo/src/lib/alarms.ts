import type { Alarm, AlarmSeverity, AlarmState } from "@/lib/types";

const SEVERITY_RANK: Record<AlarmSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

/** Severity first, then oldest raised first. Cleared excluded by caller. */
export function sortAlarms(alarms: readonly Alarm[]): Alarm[] {
  return [...alarms].sort((a, b) => {
    const sev = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (sev !== 0) return sev;
    return Date.parse(a.raisedAt) - Date.parse(b.raisedAt);
  });
}

export type AlarmAction =
  | "ack"
  | "unack"
  | "escalate"
  | "silence"
  | "unsilence"
  | "evidence";

export function actionsForState(state: AlarmState): AlarmAction[] {
  switch (state) {
    case "raised":
      return ["ack", "escalate", "silence", "evidence"];
    case "acked":
      return ["unack", "escalate", "silence", "evidence"];
    case "escalated":
      return ["silence", "evidence"];
    case "silenced":
      return ["unsilence", "evidence"];
    case "cleared":
      return ["evidence"];
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

export function applyAlarmAction(
  alarm: Alarm,
  action: Exclude<AlarmAction, "evidence">,
): Alarm {
  if (action === "ack") return { ...alarm, state: "acked" };
  if (action === "unack") return { ...alarm, state: "raised" };
  if (action === "escalate") return { ...alarm, state: "escalated" };
  if (action === "silence") return { ...alarm, state: "silenced" };
  if (action === "unsilence") return { ...alarm, state: "acked" };
  return alarm;
}

export function moveSelection(
  index: number,
  delta: number,
  length: number,
): number {
  if (length <= 0) return 0;
  return Math.max(0, Math.min(length - 1, index + delta));
}
