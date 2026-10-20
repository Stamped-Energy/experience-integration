/** Contents of the Ask side panel: the latest cited answer, an abstain example and a way into the full page. */
import Link from "next/link";
import * as D from "@/lib/demo/data";
import { Answer, AbstainNote } from "./common";

export function AskPanelContents() {
  const t = D.askThreads[0];
  const ab = D.askThreads.find((x) => x.messages.some((m) => m.abstain));
  const base = `/ask/${t.id}`;
  const ans = t.messages[1];
  return (
    <div className="stack panel-ask">
      <div className="ask-msg-person">{t.messages[0].text}</div>
      <Answer claims={ans.claims} cardRef={ans.cardRef} base={base} />
      <div className="panel-open"><Link className="link" href={base}>Open in Ask</Link>{ans.cardRef ? <Link className="link" href={`/process/proposals/${ans.cardRef}`}>Open the card</Link> : null}</div>
      {ab ? <><div className="ask-msg-person">{ab.messages[0].text}</div><AbstainNote text={ab.messages.find((m) => m.abstain)!.abstain!} /></> : null}
    </div>
  );
}
