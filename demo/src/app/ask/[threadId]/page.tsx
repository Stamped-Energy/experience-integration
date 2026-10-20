import { notFound } from "next/navigation";
import * as D from "@/lib/demo/data";
import { ThreadView } from "@/components/ask/ThreadView";

export async function generateMetadata({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  return { title: D.askThreads.find((t) => t.id === threadId)?.title ?? "Ask" };
}
export default async function Thread({ params, searchParams }: { params: Promise<{ threadId: string }>; searchParams: Promise<{ q?: string; evidence?: string; ev?: string }> }) {
  const { threadId } = await params;
  const t = D.askThreads.find((x) => x.id === threadId);
  if (!t) notFound();
  return <ThreadView t={t} {...(await searchParams)} />;
}
