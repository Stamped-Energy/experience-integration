/** Side panel contents: the same turn component as the Ask page, narrower. The conversation is picked by the scope on screen:
 *  the asset first, then its line, then a general fallback. */
import Link from "next/link";
import * as D from "@/lib/demo/data";
import { TurnView, turnsOf } from "./convo";
import { PanelPicker, type PanelItem } from "./PanelPicker";

export function AskPanelContents() {
  const render = (id: string) => { const t = D.askThreads.find((x) => x.id === id)!; const base = `/ask/${t.id}`; return (
    <div className="stack panel-ask">{turnsOf(t, base).map((x, i) => <TurnView key={i} t={x} idx={i} compact />)}<div className="panel-open"><Link className="link" href={base}>Open in Ask</Link></div></div>
  ); };
  const general = D.askThreads.filter((t) => !t.scope).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? D.askThreads[0];
  const items: PanelItem[] = D.askThreads.filter((t) => t.scope).map((t) => ({ id: t.id, assetId: t.scope!.assetId, lineId: t.scope!.lineId, node: render(t.id) }));
  const names = {
    assets: Object.fromEntries(D.assets.map((a) => [a.name.toLowerCase(), { id: a.id, lineId: a.lineId }])),
    lines: Object.fromEntries(D.lines.flatMap((l) => [[l.name.toLowerCase(), l.id], [l.short.toLowerCase(), l.id]])),
  };
  return <PanelPicker items={items} names={names} fallback={render(general.id)} />;
}
