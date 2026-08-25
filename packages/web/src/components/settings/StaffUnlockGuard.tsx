"use client";

/**
 * Previously locked staff plant tools when leaving Admin.
 * Password gate removed — plant switch is membership-authorized on the BFF.
 */
export function StaffUnlockGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
