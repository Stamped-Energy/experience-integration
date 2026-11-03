"use client";

import { useParams } from "next/navigation";
import { ActionDetailView } from "@/components/cards/ActionDetailView";
import { getAction } from "@/lib/demo/actions";
import { notFound } from "next/navigation";

export default function PageView() {
  const { id } = useParams() as { id: string };
  const a = getAction(id);
  if (!a || a.area !== "Quality") notFound();
  return <ActionDetailView id={id} />;
}
