import { qualityModule } from "@/lib/module/definitions";
import { ModuleShell } from "@/components/shell/ModuleShell";
import { ScreenRouteGate } from "@/components/shell/ScreenRouteGate";

export default function QualityLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleShell module={qualityModule}>
      <ScreenRouteGate>{children}</ScreenRouteGate>
    </ModuleShell>
  );
}
