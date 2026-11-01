"use client";

import { QualityHubTabs } from "@/components/quality/QualityHubTabs";
import { useSearchParams } from "next/navigation";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { ActionsBoard } from "@/components/cards/ExampleActions";
import { PageHeader } from "@/components/ui/primitives";
import { crumbs } from "@/components/quality/common";
import { demoRole } from "@/lib/role";

export default function PageView() {
  const sp = Object.fromEntries(useSearchParams().entries());
  const role = demoRole();
  return (
    <Workspace crumbs={crumbs({ label: "Actions" })} askContext="Quality actions">
      <PageHeader eyebrow="Quality · Decide" title="Quality actions" meta="Every quality action, grouped by what it needs from you." actions={<AskButton context="Quality actions" label="Ask about actions" />} />
      <QualityHubTabs />
      <ActionsBoard area="Quality" role={role} base="/quality/actions" status={sp.status} line={sp.line} mine={sp.mine} />
    </Workspace>
  );
}
