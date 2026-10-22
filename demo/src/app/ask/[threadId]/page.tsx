import { notFound } from "next/navigation";
import * as D from "@/lib/demo/data";
import { AskPage, type AskSP } from "@/components/ask/AskPage";
import { RichTurnView } from "@/components/ask/Rich";
import { richConvs } from "@/lib/demo/askRich";
import { currentRole } from "@/lib/role";
import { TurnView, turnsOf } from "@/components/ask/convo";

export async function generateMetadata({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  return { title: richConvs.find((t) => t.id === threadId)?.title ?? D.askThreads.find((t) => t.id === threadId)?.title ?? "Ask" };
}
export default async function Thread({ params, searchParams }: { params: Promise<{ threadId: string }>; searchParams: Promise<AskSP> }) {
  const { threadId } = await params;
  const rc = richConvs.find((x) => x.id === threadId);
  if (rc) {
    const role = await currentRole();
    if (rc.role === "owner" && role !== "owner") notFound();
    return <AskPage title={rc.title} base={`/ask/${rc.id}`} sp={await searchParams} current={rc.id}>{rc.turns.map((x, i) => <RichTurnView key={i} t={x} idx={i} role={role} />)}</AskPage>;
  }
  const t = D.askThreads.find((x) => x.id === threadId);
  if (!t) notFound();
  const sp = await searchParams;
  const base = `/ask/${t.id}`;
  return (
    <AskPage title={t.title} base={base} sp={sp} current={t.id}>
      {turnsOf(t, base).map((x, i) => <TurnView key={i} t={x} idx={i} />)}
    </AskPage>
  );
}
