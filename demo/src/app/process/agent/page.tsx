import { ProcessHubTabs } from "@/components/process/ProcessHubTabs";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { PageHeader } from "@/components/ui/primitives";
import { crumbs, processEyebrow } from "@/components/process/common";
import { AgentAtWork } from "@/components/agent/AgentAtWork";
import { agentShowcase } from "@/lib/demo/agentShowcase";
import { demoRole } from "@/lib/role";

export const metadata = { title: "Agent at work · Process" };

export default function ProcessAgentPage() {
  const data = agentShowcase("process");
  const role = demoRole();
  return (
    <Workspace crumbs={crumbs({ label: "Agent at work" })} askContext="Process agent">
      <PageHeader
        eyebrow={processEyebrow("/process/agent")}
        title="Agent at work"
        meta="What Stamped is doing on process, and what it needs from you."
        actions={<AskButton context="Process agent" label="Ask about agent work" />}
      />
      <ProcessHubTabs />
      <AgentAtWork data={data} role={role} />
    </Workspace>
  );
}
