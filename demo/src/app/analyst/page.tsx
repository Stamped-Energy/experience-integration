"use client";

import { AnalystWorkspace } from "@/components/analyst/AnalystWorkspace";
import { AppShell } from "@/components/shell/AppShell";
import { investigationsFixture } from "@/fixtures/demo";
import { useProductShell } from "@/lib/product-shell";
import { usePlant } from "@/lib/plant-context";

export default function AnalystPage() {
  const { activePlant, plants, setActivePlantId } = usePlant();
  const { role, connection } = useProductShell();

  return (
    <AppShell
      active="analyst"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      plants={plants.map((p) => ({ id: p.plantId, name: p.plantName }))}
      onPlantChange={setActivePlantId}
      role={role}
      connection={connection}
      screenTitle="Ask Stamped"
      contextSummary={[
        `${investigationsFixture.length} saved investigations`,
        "Answers include source citations",
        activePlant.plantName,
      ]}
    >
      <h1 className="sr-only">Ask Stamped</h1>
      <AnalystWorkspace />
    </AppShell>
  );
}
