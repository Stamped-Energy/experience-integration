"use client";

import Link from "next/link";
import { leases, roles } from "@/lib/demo/data";
import { nameOf } from "@/lib/names";
import { useRole } from "@/lib/role.client";
import { AskButton, RoleSwitcher } from "./ShellClient";
import { SearchLaunch } from "./Search";
import { Tag } from "@/components/ui/primitives";

export function CrumbTools({ askContext }: { askContext?: string }) {
  const role = useRole();
  const lease = leases[0];
  return (
    <div className="crumb-tools">
      <SearchLaunch />
      <RoleSwitcher role={role} roles={roles.map((r) => ({ id: r.id, name: r.name }))} />
      <Tag tone={lease.state === "active" && lease.offlineMin === 0 ? "success" : "warning"} dot title={`Lease ${nameOf(lease.id)}: at most ${lease.maxOfflineH} h offline, never more than ${lease.hardCapH} h`}>
        {lease.offlineMin === 0 ? "Connected" : `Offline · ${lease.offlineMin} min of 4 h`}
      </Tag>
      <AskButton context={askContext} className="btn btn-sm btn-accent" mascot />
    </div>
  );
}
