import { Suspense } from "react";
import PageView from "./page-view";
import { StaticPageFallback } from "@/components/page/StaticPageFallback";
import * as D from "@/lib/demo/data";
import { runLabel } from "@/components/process/common";
import { runIds } from "@/lib/static-paths";

export function generateStaticParams() {
  return runIds();
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = D.runs.find((x) => x.id === id);
  return { title: r ? runLabel(r) : "Run" };
}

export default function Page() {
  return (
    <Suspense fallback={<StaticPageFallback><p className="muted">Loading…</p></StaticPageFallback>}>
      <PageView />
    </Suspense>
  );
}
