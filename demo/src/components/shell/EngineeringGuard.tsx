"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useRole, useSetRole } from "@/lib/role.client";
import { Tag } from "@/components/ui/primitives";

/** Soft gate: plant roles see a switch prompt; Stamped engineer sees the Engineering view. */
export function EngineeringGuard({
  children,
  backHref,
  backLabel,
}: {
  children: ReactNode;
  backHref: string;
  backLabel: string;
}) {
  const role = useRole();
  const setRole = useSetRole();

  if (role !== "stamped-engineer") {
    return (
      <div className="eng-guard" role="status">
        <Tag tone="info">Engineering view</Tag>
        <h2 className="eng-guard-title">This console is for Stamped engineers</h2>
        <p className="secondary">
          Campaigns, loop runs and model upkeep stay here so plant roles keep a clearer Actions and Lots view.
        </p>
        <div className="eng-guard-actions">
          <button type="button" className="btn btn-primary" onClick={() => setRole("stamped-engineer")}>
            Switch to Stamped engineer
          </button>
          <Link className="btn" href={backHref}>
            {backLabel}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="eng-view">
      <p className="eng-view-tag">
        <Tag tone="info">Engineering view</Tag>
      </p>
      {children}
    </div>
  );
}
