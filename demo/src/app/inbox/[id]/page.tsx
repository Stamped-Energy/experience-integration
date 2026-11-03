import PageView from "./page-view";
import { inboxIds } from "@/lib/static-paths";

export function generateStaticParams() {
  return inboxIds();
}

export default async function CardDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PageView id={id} />;
}
