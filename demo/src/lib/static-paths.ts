/** Build-time paths for dynamic segments (keeps showcase pages static on Vercel). */
import * as D from "@/lib/demo/data";

export const inboxIds = () => D.inboxItems.map((i) => ({ id: i.id }));
import { convsFor } from "@/lib/demo/askRich";
import type { RoleId } from "@/lib/demo/types";

const richIds = new Set<string>();
for (const role of D.roles.map((r) => r.id as RoleId)) {
  for (const c of convsFor(role)) richIds.add(c.id);
}
export const askThreadIds = () => [
  ...D.askThreads.map((t) => ({ threadId: t.id })),
  ...[...richIds].map((id) => ({ threadId: id })),
];
export const assetIds = () => D.assets.map((a) => ({ id: a.id }));
export const lineIds = () => D.lines.map((l) => ({ id: l.id }));
export const proposalIds = () => D.proposals.map((p) => ({ id: p.id }));
export const runIds = () => D.runs.map((r) => ({ id: r.id }));
export const trialIds = () => D.trials.map((t) => ({ id: t.id }));
export const investigationIds = () => D.investigations.map((i) => ({ id: i.id }));
export const lotIds = () => D.lots.map((l) => ({ id: l.id }));
