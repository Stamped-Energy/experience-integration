/** Side panel contents: the same turn component as the Ask page, narrower. Scoped to the object on screen by the frame's chip. */
import Link from "next/link";
import * as D from "@/lib/demo/data";
import { TurnView, turnsOf } from "./convo";

export function AskPanelContents() {
  const t = D.askThreads[0];
  const base = `/ask/${t.id}`;
  return (
    <div className="stack panel-ask">
      {turnsOf(t, base).map((x, i) => <TurnView key={i} t={x} idx={i} compact />)}
      <div className="panel-open"><Link className="link" href={base}>Open in Ask</Link></div>
    </div>
  );
}
