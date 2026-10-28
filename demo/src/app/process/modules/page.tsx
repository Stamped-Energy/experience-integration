import { Suspense } from "react";
import PageView from "./page-view";
import { StaticPageFallback } from "@/components/page/StaticPageFallback";

export const metadata = { title: "Modules and shadow" };

export default function Page() {
  return (
    <Suspense fallback={<StaticPageFallback><p className="muted">Loading…</p></StaticPageFallback>}>
      <PageView />
    </Suspense>
  );
}
