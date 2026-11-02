import { QualityHubTabs } from "@/components/quality/QualityHubTabs";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { PageHeader } from "@/components/ui/primitives";
import { crumbs, qualityEyebrow } from "@/components/quality/common";
import { AgentAtWork } from "@/components/agent/AgentAtWork";
import { agentShowcase } from "@/lib/demo/agentShowcase";
import { demoRole } from "@/lib/role";

export const metadata = { title: "Agent at work · Quality" };

export default function QualityAgentPage() {
  const data = agentShowcase("quality");
  const role = demoRole();
  return (
    <Workspace crumbs={crumbs({ label: "Agent at work" })} askContext="Quality agent">
      <PageHeader
        eyebrow={qualityEyebrow("/quality/agent")}
        title="Agent at work"
        meta="What Stamped is doing on quality, and what it needs from you."
        actions={<AskButton context="Quality agent" label="Ask about agent work" />}
      />
      <QualityHubTabs />
      <AgentAtWork data={data} role={role} />
    </Workspace>
  );
}
