import Link from "next/link";
import { Workspace } from "@/components/shell/Shell";
import { EmptyState, PageHeader } from "@/components/ui/primitives";
export default function NotFound() {
  return (
    <Workspace crumbs={[{ label: "Demonstration plant", href: "/" }, { label: "Not found" }]}>
      <PageHeader title="This page is not part of the product" />
      <EmptyState title="Nothing at this address" body="Older showcase pages moved into Home, Inbox, Process, Quality and Plant." action={<Link className="btn" href="/">Go to Home</Link>} />
    </Workspace>
  );
}
