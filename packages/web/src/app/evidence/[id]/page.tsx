import { notFound } from "next/navigation";
import { EvidenceDetailClient } from "@/components/evidence/EvidenceDetailClient";
import { findEvidenceSample } from "@/fixtures/evidence-samples";

export default async function EvidenceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sample = findEvidenceSample(id);
  if (!sample) notFound();

  return <EvidenceDetailClient sample={sample} />;
}
