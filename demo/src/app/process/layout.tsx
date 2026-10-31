import { processModule } from "@/lib/module/definitions";
import { ModuleShell } from "@/components/shell/ModuleShell";
import { ScreenRouteGate } from "@/components/shell/ScreenRouteGate";

export default function ProcessLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleShell module={processModule}>
      <ScreenRouteGate>{children}</ScreenRouteGate>
    </ModuleShell>
  );
}
