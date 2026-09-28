"use client";

import { AnalystWorkspace } from "@/components/analyst/AnalystWorkspace";
import { AgentCard } from "@/components/home/AgentCard";
import { AppShell } from "@/components/shell/AppShell";
import { alarmsForPlant, prescriptionsForPlant } from "@/fixtures/demo";
import { formatInr, formatIstTime } from "@/lib/format";
import { sortPrescriptions } from "@/lib/prescriptions";
import { usePlant } from "@/lib/plant-context";
import { useProductShell } from "@/lib/product-shell";
import "@/components/home/home.css";

const IST = "Asia/Kolkata";

function greeting(now: Date): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-IN", { hour: "numeric", hourCycle: "h23", timeZone: IST }).format(now),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const { activePlant, plants, setActivePlantId } = usePlant();
  const { role, connection } = useProductShell();
  const now = new Date();

  const alarms = alarmsForPlant(activePlant.plantId).filter((a) => a.state !== "cleared");
  const critical = alarms.filter((a) => a.severity === "critical");
  const topAlarm = [...(critical.length ? critical : alarms)].sort((a, b) =>
    b.raisedAt.localeCompare(a.raisedAt),
  )[0];

  const prescriptions = prescriptionsForPlant(activePlant.plantId);
  const alarmRx = prescriptions.find((p) => p.id === topAlarm?.relatedPrescriptionId);
  const topRx = sortPrescriptions(
    prescriptions.filter((p) => p.lane === "needs_review" && p.id !== alarmRx?.id),
  )[0];

  return (
    <AppShell
      active="home"
      plantName={activePlant.plantName}
      plantId={activePlant.plantId}
      plants={plants.map((p) => ({ id: p.plantId, name: p.plantName }))}
      onPlantChange={setActivePlantId}
      role={role}
      connection={connection}
      screenTitle="Home"
      contextSummary={[`${critical.length} critical alarms`, activePlant.plantName, activePlant.shift]}
    >
      <div className="home">
        <header className="home__hello">
          <h1 className="home__greeting" suppressHydrationWarning>
            {greeting(now)}
            <span className="home__dot">.</span>
          </h1>
          <p className="home__date" suppressHydrationWarning>
            {new Intl.DateTimeFormat("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              timeZone: IST,
            }).format(now)}{" "}
            · {activePlant.plantName}
          </p>
        </header>

        <section className="home__agent" aria-label="Stamped Agent">
          {topAlarm ? (
            <AgentCard
              kind={topAlarm.severity === "critical" ? "Critical" : "Watch"}
              tone="critical"
              context="Threshold crossed this shift"
              time={formatIstTime(topAlarm.raisedAt)}
              message={
                <>
                  <strong>{topAlarm.assetLabel}</strong>: {topAlarm.summary}.
                </>
              }
              recommendation={
                alarmRx ? (
                  <>
                    {alarmRx.title}. Worth <strong>{formatInr(alarmRx.impactInrPerMonth)}/month</strong>.
                  </>
                ) : (
                  "Acknowledge and assign an owner before the next TOD peak."
                )
              }
              href={`/alarms/${topAlarm.id}`}
            />
          ) : null}
          {topRx ? (
            <AgentCard
              kind="Opportunity"
              tone="primary"
              context={`${topRx.category ?? "Prescription"} · ${topRx.dueLabel ?? "This week"}`}
              message={
                <>
                  <strong>{topRx.title}</strong>. {topRx.why}. Worth{" "}
                  <strong>{formatInr(topRx.impactInrPerMonth)}/month</strong>.
                </>
              }
              recommendation={topRx.actions?.[0] ?? topRx.why}
              href={`/prescriptions/${topRx.id}`}
            />
          ) : null}
        </section>

        <section className="home__ask" aria-labelledby="home-ask-title">
          <h2 id="home-ask-title" className="home__ask-title">
            Ask Stamped
          </h2>
          <AnalystWorkspace compact />
        </section>
      </div>
    </AppShell>
  );
}
