"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { lockStaffTools } from "@/lib/staff-unlock";

const ADMIN_PATH = "/settings/admin";

/**
 * Locks staff plant tools whenever the user leaves Administration.
 * Idle 30s lock is handled inside StaffPlantTools while on that page.
 */
export function StaffUnlockGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    if (pathname === ADMIN_PATH || pathname.startsWith(`${ADMIN_PATH}/`)) {
      return;
    }
    lockStaffTools();
  }, [pathname]);

  return <>{children}</>;
}
