"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { EvidenceIndexClient } from "@/components/evidence/EvidenceIndexClient";
import { getDemoEvidenceSamples } from "@/lib/demo-data";

function EvidenceIndexInner() {
  const rxId = useSearchParams().get("rxId");
  useEffect(() => {
    if (rxId) window.location.replace(`/evidence/evd_${rxId}`);
  }, [rxId]);

  if (rxId) {
    return <div className="forge-page-stack">Opening evidence case…</div>;
  }
  return <EvidenceIndexClient samples={getDemoEvidenceSamples()} />;
}

export default function EvidencePage() {
  return (
    <Suspense fallback={<div className="forge-page-stack">Loading evidence…</div>}>
      <EvidenceIndexInner />
    </Suspense>
  );
}
