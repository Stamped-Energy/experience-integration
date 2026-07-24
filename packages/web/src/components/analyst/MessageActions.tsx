import Link from "next/link";
import type { AnalystRelatedLink } from "@/lib/analyst-context";
import { AlertTriangle, FileText } from "@/components/ui/icons";
export function MessageActions({ links }: { links: AnalystRelatedLink[] }) {
  if (!links.length) return null;

  return (
    <div className="analyst-msg__actions">
      {links.map((link) => (
        <Link key={`${link.kind}-${link.id}`} href={link.href} className="analyst-msg__action">
          {link.kind === "alarm" ? <AlertTriangle size={14} /> : <FileText size={14} />}
          {link.label}
        </Link>
      ))}
    </div>
  );
}
