import { Suspense } from "react";
import PageView from "./page-view";
import { StaticPageFallback } from "@/components/page/StaticPageFallback";
import * as D from "@/lib/demo/data";
import { lineIds } from "@/lib/static-paths";

export function generateStaticParams() {
  return lineIds();
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: D.byId.line(id)?.name ?? "Line" };
}

export default function Page() {
  return (
    <Suspense fallback={<StaticPageFallback><p className="muted">Loading…</p></StaticPageFallback>}>
      <PageView />
    </Suspense>
  );
}
