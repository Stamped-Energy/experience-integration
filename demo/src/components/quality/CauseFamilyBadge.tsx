import { Tag } from "@/components/ui/primitives";
import {
  CAUSE_FAMILY_LABEL,
  EXTRA_NODE_LABEL,
  familyFor,
  type CauseFamily,
} from "@/lib/demo/causeFamily";

const TONE: Record<CauseFamily, "accent" | "warning" | "info" | "neutral" | "success"> = {
  design: "accent",
  material: "info",
  process_setting: "neutral",
  tooling: "warning",
  machine: "warning",
  measurement: "info",
  method_operator: "neutral",
  environment: "neutral",
  scheduling: "neutral",
  unknown: "neutral",
};

/** Badge for a root-cause node: family from cause_family taxonomy (#126). */
export function CauseFamilyBadge({ nodeId }: { nodeId: string }) {
  const family = familyFor(nodeId);
  return (
    <Tag tone={TONE[family]} title={`Cause family: ${CAUSE_FAMILY_LABEL[family]}`}>
      {CAUSE_FAMILY_LABEL[family]}
    </Tag>
  );
}

export function causeNodeLabel(nodeId: string, fallback: (id: string) => string): string {
  return EXTRA_NODE_LABEL[nodeId] ?? fallback(nodeId);
}

export function isDesignCause(nodeId: string): boolean {
  return familyFor(nodeId) === "design";
}
