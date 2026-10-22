import { Suspense } from "react";
import PageView from "./page-view";
import { StaticPageFallback } from "@/components/page/StaticPageFallback";
import { lotNo } from "@/components/quality/common";
import { lotIds } from "@/lib/static-paths";

export function generateStaticParams() {
  return lotIds();
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Lot ${lotNo(id)}` };
}

export default function Page() {
  return (
    <Suspense fallback={<StaticPageFallback><p className="muted">Loading…</p></StaticPageFallback>}>
      <PageView />
    </Suspense>
  );
}
