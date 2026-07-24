"use client";

import { useState } from "react";
import { AlarmFullCase } from "@/components/alarms/AlarmFullCase";
import { ToastRegion } from "@/components/ui/primitives";
import type { EvidenceSample } from "@/fixtures/evidence-samples";
import type { EvidencePack } from "@/lib/evidence";
import {
  actionsForState,
  applyAlarmAction,
  type AlarmAction,
} from "@/lib/alarms";
import type { Alarm } from "@/lib/types";
import type { DemoAsset } from "@/fixtures/demo";

const ACTION_LABEL: Record<Exclude<AlarmAction, "evidence">, string> = {
  ack: "Acknowledge",
  unack: "Unacknowledge",
  escalate: "Escalate",
  silence: "Silence",
  unsilence: "Unsilence",
};

export function AlarmDetailClient({
  initial,
  asset,
  pack,
  evidenceSample,
  evidenceHref,
  prescriptionHref,
}: {
  initial: Alarm;
  asset?: DemoAsset;
  pack: EvidencePack;
  evidenceSample?: EvidenceSample;
  evidenceHref?: string;
  prescriptionHref?: string;
}) {
  const [alarm, setAlarm] = useState(initial);
  const [toast, setToast] = useState<string | null>(null);

  const actionButtons = actionsForState(alarm.state)
    .filter((a): a is Exclude<AlarmAction, "evidence"> => a !== "evidence")
    .map((action) => ({
      id: action,
      label: ACTION_LABEL[action],
      variant:
        action === "ack"
          ? ("primary" as const)
          : action === "escalate"
            ? ("secondary" as const)
            : ("ghost" as const),
    }));

  function onAction(id: string) {
    const action = id as Exclude<AlarmAction, "evidence">;
    setAlarm((prev) => applyAlarmAction(prev, action));
    setToast(`${ACTION_LABEL[action]} — ${alarm.assetLabel}`);
  }

  return (
    <>
      <AlarmFullCase
        alarm={alarm}
        asset={asset}
        pack={pack}
        evidenceSample={evidenceSample}
        evidenceHref={evidenceHref}
        prescriptionHref={prescriptionHref}
        actions={actionButtons}
        onAction={onAction}
      />
      <ToastRegion message={toast} tone="good" />
    </>
  );
}
