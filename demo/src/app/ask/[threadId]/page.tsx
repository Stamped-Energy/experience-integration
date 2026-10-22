import { Suspense } from "react";
import PageView from "./page-view";
import { StaticPageFallback } from "@/components/page/StaticPageFallback";
import * as D from "@/lib/demo/data";
import { convsFor } from "@/lib/demo/askRich";
import { demoRole } from "@/lib/role";
import { askThreadIds } from "@/lib/static-paths";

export function generateStaticParams() {
  return askThreadIds();
}

export async function generateMetadata({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  return { title: convsFor(demoRole()).find((t) => t.id === threadId)?.title ?? D.askThreads.find((t) => t.id === threadId)?.title ?? "Ask" };
}

export default function Page() {
  return (
    <Suspense fallback={<StaticPageFallback><p className="muted">Loading…</p></StaticPageFallback>}>
      <PageView />
    </Suspense>
  );
}
