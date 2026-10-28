import { Suspense } from "react";
import PageView from "./page-view";
import { StaticPageFallback } from "@/components/page/StaticPageFallback";

export const metadata = { title: "Value ROI" };

export default function ValueRoiPage() {
  return (
    <Suspense fallback={<StaticPageFallback><p className="muted">Loading value ROI…</p></StaticPageFallback>}>
      <PageView />
    </Suspense>
  );
}
