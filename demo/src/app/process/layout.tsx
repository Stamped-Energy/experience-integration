import { processModule } from "@/lib/module/definitions";
import { ModuleShell } from "@/components/shell/ModuleShell";

export default function ProcessLayout({ children }: { children: React.ReactNode }) {
  return <ModuleShell module={processModule}>{children}</ModuleShell>;
}
