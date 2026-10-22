import Link from "next/link";
import { redirect } from "next/navigation";
import * as D from "@/lib/demo/data";
import { rel } from "@/lib/format";
import { AskPage, steps, type AskSP } from "@/components/ask/AskPage";
import { TurnView, liveTurn, suggestions } from "@/components/ask/convo";
import { AskHero } from "@/components/ask/AskClient";
import { RichTurnView } from "@/components/ask/Rich";
import { richConvs, suggestedAnswer } from "@/lib/demo/askRich";
import { currentRole } from "@/lib/role";
import { StampedMascot } from "@/components/mascot/StampedMascot";

export const metadata = { title: "Ask" };
export default async function AskHome({ searchParams }: { searchParams: Promise<AskSP> }) {
  const sp = await searchParams;
  const q = sp.q?.trim();
  const role = await currentRole();
  if (q) {
    const rich = suggestedAnswer(q, role);
    if (rich) return <AskPage title={rich.q} base={`/ask?q=${encodeURIComponent(q)}`} sp={{ ...sp, q: undefined }}><RichTurnView t={rich} idx={0} role={role} /></AskPage>;
    const rc = richConvs.find((c) => c.title.toLowerCase() === q.toLowerCase() || c.turns[0].q.toLowerCase() === q.toLowerCase());
    if (rc) redirect(`/ask/${rc.id}`);
    const t = D.askThreads.find((x) => x.title.toLowerCase() === q.toLowerCase() || x.messages[0].text?.toLowerCase() === q.toLowerCase());
    if (t) redirect(`/ask/${t.id}`);
    if (sp.state === "error") return (
      <AskPage title="Ask" base="/ask" sp={sp}>
        <div className="turn"><div className="q-bubble">{q}</div><div className="a-row"><span className="a-mascot"><StampedMascot mode="error" size={28} label="Stamped assistant, error" /></span><div className="a-prose"><p className="a-lead">Ask could not reach plant data just now.</p><p className="muted">Nothing was changed. <Link className="link" href={`/ask?q=${encodeURIComponent(q)}`}>Try again</Link></p></div></div></div>
      </AskPage>
    );
    return <AskPage title="Ask" base={`/ask?q=${encodeURIComponent(q)}`} sp={{ ...sp, q: undefined }}><TurnView t={liveTurn(q, `/ask?q=${encodeURIComponent(q)}`)} idx={0} /></AskPage>;
  }
  const recent = [...richConvs.filter((c) => c.role !== "owner" || role === "owner"), ...D.askThreads].slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3);
  return (
    <AskPage title="Ask" base="/ask" sp={sp} composer="mobile">
      <div className="ask-empty">
        <AskHero steps={steps()}>
          <div className="sugg">{suggestions().slice(0, 6).map((s) => <Link key={s.q} prefetch={false} href={s.href}>{s.q}</Link>)}</div>
          <div className="recent">{recent.map((t) => <Link key={t.id} prefetch={false} href={`/ask/${t.id}`}>{t.title}<span>{rel(t.updatedAt)}</span></Link>)}</div>
        </AskHero>
      </div>
    </AskPage>
  );
}
