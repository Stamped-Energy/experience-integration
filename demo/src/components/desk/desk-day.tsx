/** Desk-style day list (PlantCraft Desk pattern, Apache-2.0). Sits beside DecisionCard, not instead of it. */
import Link from "next/link";
import { hhmm } from "@/lib/format";

export type DeskItem = { id: string; at: string; title: string; sub?: string; href: string; kind: "action" | "message" | "note" };

export function DeskDayList({ items, title = "My day" }: { items: DeskItem[]; title?: string }) {
  return (
    <section aria-label={title}>
      <div className="desk-list">
        {items.map((i) => (
          <Link key={i.id} href={i.href} className="desk-row">
            <span className="desk-time">{hhmm(i.at)}</span>
            <span>
              <span className="row-title">{i.title}</span>
              {i.sub ? <span className="row-sub">{i.sub}</span> : null}
            </span>
            <Tag kind={i.kind} />
          </Link>
        ))}
      </div>
    </section>
  );
}

function Tag({ kind }: { kind: DeskItem["kind"] }) {
  const label = kind === "action" ? "Action" : kind === "message" ? "Message" : "Note";
  return <span className="tag">{label}</span>;
}
