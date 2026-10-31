"use client";

import { ProcessHubTabs } from "@/components/process/ProcessHubTabs";
import { useSearchParams } from "next/navigation";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { ActionsBoard } from "@/components/cards/ExampleActions";
import { PageHeader } from "@/components/ui/primitives";
import { crumbs } from "@/components/process/common";
import { demoRole } from "@/lib/role";

export default function PageView() {
  const sp = Object.fromEntries(useSearchParams().entries());
  const role = demoRole();
  return (
    <Workspace crumbs={crumbs({ label: "Actions" })} askContext="Process actions">
      <PageHeader eyebrow="Process · Decide" title="Process actions" meta="Every action on both lines, grouped by what it needs from you." actions={<AskButton context="Process actions" label="Ask about actions" />} />
      <ProcessHubTabs />
      <ActionsBoard area="Process" role={role} base="/process/actions" status={sp.status} line={sp.line} mine={sp.mine} />
    </Workspace>
  );
}
