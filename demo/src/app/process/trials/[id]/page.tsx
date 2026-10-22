import { Suspense } from "react";
import PageView from "./page-view";
import { StaticPageFallback } from "@/components/page/StaticPageFallback";
import * as D from "@/lib/demo/data";
import { trialIds } from "@/lib/static-paths";

export function generateStaticParams() {
  return trialIds();
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: D.byId.trial(id)?.change ?? "Trial" };
}

export default function Page() {
  return (
    <Suspense fallback={<StaticPageFallback><p className="muted">Loading…</p></StaticPageFallback>}>
      <PageView />
    </Suspense>
  );
}
