"use client";

import { useParams, useSearchParams } from "next/navigation";
import { notFound } from "next/navigation";
import * as D from "@/lib/demo/data";
import { AskPage, type AskSP } from "@/components/ask/AskPage";
import { RichTurnView } from "@/components/ask/Rich";
import { convsFor } from "@/lib/demo/askRich";
import { demoRole } from "@/lib/role";
import { TurnView, turnsOf } from "@/components/ask/convo";

export default function Thread() {
  const { threadId } = useParams() as { threadId: string };
  const role = demoRole();
  const rc = convsFor(role).find((x) => x.id === threadId);
  if (rc) {
    return <AskPage title={rc.title} base={`/ask/${rc.id}`} sp={Object.fromEntries(useSearchParams().entries())} current={rc.id}>{rc.turns.map((x, i) => <RichTurnView key={i} t={x} idx={i} role={role} />)}</AskPage>;
  }
  const t = D.askThreads.find((x) => x.id === threadId);
  if (!t) notFound();
  const sp = Object.fromEntries(useSearchParams().entries());
  const base = `/ask/${t.id}`;
  return (
    <AskPage title={t.title} base={base} sp={sp} current={t.id}>
      {turnsOf(t, base).map((x, i) => <TurnView key={i} t={x} idx={i} />)}
    </AskPage>
  );
}
