"use client";

import { QualityHubTabs } from "@/components/quality/QualityHubTabs";
import Link from "next/link";
import { Workspace } from "@/components/shell/Shell";
import { AskButton } from "@/components/shell/ShellClient";
import { PageHeader } from "@/components/ui/primitives";
import { crumbs, qualityEyebrow } from "@/components/quality/common";
import { AskedHere, Learned, Qualification, WorkingOn } from "@/components/agent/blocks";
import * as A from "@/lib/demo/agent";

export default function QualityAgentPage() {
  const questions = A.questions.filter((q) => A.QUALITY_Q.includes(q.type));
  return (
    <Workspace crumbs={crumbs({ label: "Agent work" })} askContext="Quality agent">
      <PageHeader eyebrow={qualityEyebrow("/quality/agent")} title="Agent work on quality" meta="What the agent is doing, and what it needs from you." actions={<AskButton context="Quality agent" label="Ask about agent work" />} />
      <QualityHubTabs />
      <div className="grid">
        <div className="span-8 stack">
          <WorkingOn items={A.qualityWork} />
          <Qualification />
        </div>
        <div className="span-4 stack ctx">
          <AskedHere list={questions} />
          <Learned items={A.qualityLearned} />
          <Link className="link" href="/quality/simulations">Open quality simulations</Link>
        </div>
      </div>
    </Workspace>
  );
}
