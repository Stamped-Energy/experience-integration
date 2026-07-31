import type { AnalystContextEnvelope } from "./types";
import { alarmsFixture, prescriptionsFixture } from "@/fixtures/demo";
import { fixtureAnalystReplyRich } from "./analyst-fixtures";
export interface ContextChip {
  key: string;
  value: string;
}

export type AnalystCitation = {
  id: string;
  title: string;
  snippet?: string;
  path?: "H" | "W";
};

export type AnalystMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: AnalystCitation[];
  /** When true, UI streams content letter-by-letter. */
  stream?: boolean;
};

export type AnalystRelatedLink = {
  kind: "alarm" | "prescription";
  id: string;
  label: string;
  href: string;
};

/** @deprecated Use relatedLinksFromReply - dashboard navigates; no upstream handoff. */
export type ProposedAction = {
  id: string;
  kind: "ack_alarm" | "assign_rx" | "open_evidence";
  label: string;
  targetId: string;
  summary: string;
};

/**
 * Build the user-visible context chips for Mode A analyst.
 * Strips excluded keys; never includes secrets.
 */
export function visibleContextChips(
  envelope: AnalystContextEnvelope,
): ContextChip[] {
  const excluded = new Set(envelope.excludeKeys ?? []);
  const candidates: ContextChip[] = [
    { key: "screen", value: envelope.screenTitle },
    {
      key: "focus",
      value: envelope.focusEntity
        ? envelope.focusEntity.type === "alarm"
          ? "Alarm in focus"
          : envelope.focusEntity.type === "prescription"
            ? "Prescription in focus"
            : envelope.focusEntity.type === "asset"
              ? "Asset in focus"
              : "Entry in focus"
        : "",
    },    ...(envelope.timeRange
      ? [
          {
            key: "range",
            value: `${envelope.timeRange.from} → ${envelope.timeRange.to}`,
          },
        ]
      : []),
    ...envelope.visibleSummary.map((s, i) => ({
      key: `summary:${i}`,
      value: s,
    })),
  ];

  return candidates.filter((c) => c.value && !excluded.has(c.key));
}

/** Reject cross-tenant focus entities at the BFF boundary. */
export function assertTenantMatch(
  envelope: AnalystContextEnvelope,
  entityPlantId: string | undefined,
): boolean {
  if (!entityPlantId) return true;
  return entityPlantId === envelope.plantId;
}

export function suggestionPrompts(envelope: AnalystContextEnvelope): string[] {
  const focus = envelope.focusEntity;
  if (focus?.type === "alarm") {
    return [
      "Why is this alarm critical right now?",
      "What evidence supports MD coincidence?",
      "Propose an ack with rationale",
    ];
  }
  if (focus?.type === "prescription") {
    return [
      "Summarise impact and confidence",
      "What proof should I open first?",
      "Draft an assign-to-me action",
    ];
  }
  return [
    "What needs attention on this screen?",
    "Compare vs baseline for the plant",
    "List confirmed savings this month",
  ];
}

/** Fixture Auto L4 reply - mirrors API client shape without network. */
export function fixtureAnalystReply(
  envelope: AnalystContextEnvelope,
  question: string,
): AnalystMessage {
  return fixtureAnalystReplyRich(envelope, question);
}

const ALARM_ID_PATTERN = String.raw`\b(alm_\d+)\b`;
const RX_ID_PATTERN = String.raw`\b(rx_\d+)\b`;

function collectIds(text: string, pattern: string): string[] {
  const re = new RegExp(pattern, "gi");
  const ids = new Set<string>();
  for (const match of text.matchAll(re)) {
    ids.add(match[1]!.toLowerCase());
  }
  return [...ids];
}

/**
 * Extract alarm / prescription links cited in an analyst reply.
 * Used for in-dashboard navigation - not upstream writes.
 */
export function relatedLinksFromReply(reply: AnalystMessage): AnalystRelatedLink[] {
  const text = `${reply.content}`;
  if (/ignore (all|previous)|system:|<\/?script/i.test(text)) {
    return [];
  }

  const alarmIds = new Set(collectIds(text, ALARM_ID_PATTERN));
  const rxIds = new Set(collectIds(text, RX_ID_PATTERN));

  for (const citation of reply.citations ?? []) {
    const blob = `${citation.title} ${citation.snippet ?? ""} ${citation.id}`;
    collectIds(blob, ALARM_ID_PATTERN).forEach((id) => alarmIds.add(id));
    collectIds(blob, RX_ID_PATTERN).forEach((id) => rxIds.add(id));

    const citeAlarm = citation.id.match(/^cite_(alm_\d+)$/i);
    if (citeAlarm) alarmIds.add(citeAlarm[1]!.toLowerCase());
    const citeRx = citation.id.match(/^cite_(rx_\d+)$/i);
    if (citeRx) rxIds.add(citeRx[1]!.toLowerCase());
  }

  const links: AnalystRelatedLink[] = [
    ...[...alarmIds].map((id) => {
      const alarm = alarmsFixture.find((a) => a.id === id);
      return {
        kind: "alarm" as const,
        id,
        label: alarm ? `View ${alarm.assetLabel} alarm` : "View alarm",
        href: `/alarms/${id}`,
      };
    }),
    ...[...rxIds].map((id) => {
      const rx = prescriptionsFixture.find((p) => p.id === id);
      return {
        kind: "prescription" as const,
        id,
        label: rx ? `View ${rx.title}` : "View prescription",
        href: `/prescriptions/${id}`,
      };
    }),
  ];
  return links.slice(0, 4);
}

/** @deprecated Use relatedLinksFromReply */
export function proposeActionFromReply(
  envelope: AnalystContextEnvelope,
  reply: AnalystMessage,
): ProposedAction | null {
  const links = relatedLinksFromReply(reply);
  const first = links[0];
  if (!first) return null;
  return {
    id: `act_${first.id}`,
    kind: first.kind === "alarm" ? "ack_alarm" : "assign_rx",
    label: first.label,
    targetId: first.id,
    summary: first.label,
  };
}

export function confirmActionGate(input: {
  proposed: ProposedAction | null;
  confirmed: boolean;
}): { allowed: boolean; reason: string } {
  if (!input.proposed) {
    return { allowed: false, reason: "No action proposed" };
  }
  if (!input.confirmed) {
    return { allowed: false, reason: "Human confirmation required" };
  }
  return { allowed: true, reason: "Confirmed" };
}
