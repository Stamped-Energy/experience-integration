import * as D from "@/lib/demo/data";
import { ThreadView } from "@/components/ask/ThreadView";

export const metadata = { title: "Ask" };
export default async function AskHome({ searchParams }: { searchParams: Promise<{ q?: string; evidence?: string; ev?: string }> }) {
  const sp = await searchParams;
  const t = D.askThreads.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).find((x) => x.messages.some((m) => m.cardRef)) ?? D.askThreads[0];
  return <ThreadView t={t} {...sp} />;
}
