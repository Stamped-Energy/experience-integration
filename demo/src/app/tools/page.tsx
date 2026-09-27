"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { PageHead, Panel, StatusChip } from "@/components/ui/primitives";
import {
  Activity,
  BarChart3,
  Leaf,
  Map,
  Settings,
  Users,
} from "@/components/ui/icons";
import { listOrgMembers } from "@/lib/admin-api";
import { listPeople } from "@/lib/assignments-api";
import { useAuth } from "@/lib/auth-context";
import { useDataSource } from "@/lib/data-source-context";
import { getWhatsAppStatus, listWebhooks } from "@/lib/integrations-api";
import { usePlant } from "@/lib/plant-context";
import { connectionFromProbe, toShellRole } from "@/lib/shell-session";
import { connectionFixture } from "@/lib/plant-catalog";
import { membersFixture, webhooksFixture } from "@/fixtures/demo";
import { notifyPeopleFixture } from "@/fixtures/assignments";

const TOOLS = [
  {
    href: "/energy",
    title: "Energy Analytics",
    blurb: "Trends, baselines, and cost views.",
    Icon: BarChart3,
    badgeKey: null as string | null,
  },
  {
    href: "/equipment",
    title: "Machine Health",
    blurb: "Asset load, vibration, and temperature.",
    Icon: Activity,
    badgeKey: null,
  },
  {
    href: "/plant-map",
    title: "Plant Map / Energy twin",
    blurb: "Power, material, and heat flows by section.",
    Icon: Map,
    badgeKey: null,
  },
  {
    href: "/intensity",
    title: "Sustainability",
    blurb: "Energy intensity, emissions, and TOD bands.",
    Icon: Leaf,
    badgeKey: null,
  },
  {
    href: "/settings/assignments",
    title: "Assignments",
    blurb: "Notify roster and alarm WhatsApp routes for this plant.",
    Icon: Users,
    badgeKey: "people",
  },
  {
    href: "/settings/integrations",
    title: "Integrations",
    blurb: "API keys, webhooks, Entra, and WhatsApp status.",
    Icon: Settings,
    badgeKey: "webhooks",
  },
] as const;

type Counts = {
  members: number | null;
  people: number | null;
  webhooks: number | null;
  whatsappConfigured: boolean | null;
};

export default function ToolsPage() {
  const { activePlant } = usePlant();
  const { isDemoSession, orgId, membershipRole } = useAuth();
  const { probe } = useDataSource();
  const [counts, setCounts] = useState<Counts>({
    members: null,
    people: null,
    webhooks: null,
    whatsappConfigured: null,
  });

  useEffect(() => {
    if (isDemoSession) {
      setCounts({
        members: membersFixture.length,
        people: notifyPeopleFixture.length,
        webhooks: webhooksFixture.length,
        whatsappConfigured: false,
      });
      return;
    }

    let cancelled = false;
    async function load() {
      const next: Counts = {
        members: null,
        people: null,
        webhooks: null,
        whatsappConfigured: null,
      };
      const tasks: Promise<void>[] = [];
      if (orgId) {
        tasks.push(
          listOrgMembers(orgId)
            .then((m) => {
              next.members = m.length;
            })
            .catch(() => {
              next.members = null;
            }),
        );
      }
      tasks.push(
        listPeople()
          .then((r) => {
            next.people = r.people.length;
          })
          .catch(() => {
            next.people = null;
          }),
      );
      tasks.push(
        listWebhooks()
          .then((w) => {
            next.webhooks = w.length;
          })
          .catch(() => {
            next.webhooks = null;
          }),
      );
      tasks.push(
        getWhatsAppStatus()
          .then((wa) => {
            next.whatsappConfigured = wa.configured;
          })
          .catch(() => {
            next.whatsappConfigured = null;
          }),
      );
      await Promise.all(tasks);
      if (!cancelled) setCounts({ ...next });
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [activePlant.plantId, isDemoSession, orgId]);

  const badgeFor = (key: string | null) => {
    if (key === "people" && counts.people != null) {
      return `${counts.people} people`;
    }
    if (key === "webhooks" && counts.webhooks != null) {
      return `${counts.webhooks} webhooks`;
    }
    return null;
  };

  return (
    <AppShell
      active="tools"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      role={toShellRole(membershipRole)}
      connection={isDemoSession ? connectionFixture : connectionFromProbe(probe)}
      screenTitle="Tools"
      contextSummary={["Specialized plant tools", activePlant.plantName]}
    >
      <PageHead eyebrow="Operations" title="Tools" />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
        <StatusChip tone={counts.members != null ? "info" : "neutral"}>
          {counts.members != null ? `${counts.members} members` : "Members —"}
        </StatusChip>
        <StatusChip tone={counts.people != null ? "info" : "neutral"}>
          {counts.people != null ? `${counts.people} notify people` : "People —"}
        </StatusChip>
        <StatusChip tone={counts.webhooks != null ? "info" : "neutral"}>
          {counts.webhooks != null ? `${counts.webhooks} webhooks` : "Webhooks —"}
        </StatusChip>
        <StatusChip
          tone={
            counts.whatsappConfigured === true
              ? "good"
              : counts.whatsappConfigured === false
                ? "warning"
                : "neutral"
          }
        >
          {counts.whatsappConfigured === true
            ? "WhatsApp configured"
            : counts.whatsappConfigured === false
              ? "WhatsApp not configured"
              : "WhatsApp —"}
        </StatusChip>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 16,
          marginTop: 16,
        }}
      >
        {TOOLS.map(({ href, title, blurb, Icon, badgeKey }) => {
          const badge = badgeFor(badgeKey);
          return (
            <Link key={href} href={href} style={{ display: "block" }}>
              <Panel style={{ height: "100%", transition: "box-shadow 0.15s" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                    alignItems: "flex-start",
                  }}
                >
                  <Icon size={22} color="var(--forge-primary)" />
                  {badge ? <StatusChip tone="info">{badge}</StatusChip> : null}
                </div>
                <h2 className="forge-card-title" style={{ marginTop: 12, fontSize: 17 }}>
                  {title}
                </h2>
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: 13,
                    color: "var(--forge-on-surface-variant)",
                  }}
                >
                  {blurb}
                </p>
              </Panel>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
