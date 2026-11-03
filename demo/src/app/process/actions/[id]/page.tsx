import { Suspense } from "react";
import PageView from "./page-view";
import { StaticPageFallback } from "@/components/page/StaticPageFallback";
import { actionIds } from "@/lib/demo/actionDetail";
import { getAction } from "@/lib/demo/actions";

export function generateStaticParams() {
  return actionIds().filter(({ id }) => getAction(id)?.area === "Process");
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = getAction(id);
  return { title: a?.title ?? "Process action" };
}

export default function Page() {
  return (
    <Suspense fallback={<StaticPageFallback><p className="muted">Loading…</p></StaticPageFallback>}>
      <PageView />
    </Suspense>
  );
}
