import { Workspace } from "@/components/shell/Shell";
import { PageHeader } from "@/components/ui/primitives";
export default function Home() {
  return <Workspace crumbs={[{ label: "Demonstration plant" }]}><PageHeader title="Home" /></Workspace>;
}
