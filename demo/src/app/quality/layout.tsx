import { qualityModule } from "@/lib/module/definitions";
import { ModuleShell } from "@/components/shell/ModuleShell";

export default function QualityLayout({ children }: { children: React.ReactNode }) {
  return <ModuleShell module={qualityModule}>{children}</ModuleShell>;
}
