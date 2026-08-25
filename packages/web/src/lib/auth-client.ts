import { bffUrl } from "@/lib/bff";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  emailVerified?: boolean;
  role?: string;
};

export type MeResponse = {
  user: AuthUser;
  session: { id: string; expiresAt: string };
  /** Active org from plant membership; null if none. */
  orgId?: string | null;
  /** Active plant id; null if none. */
  plantId?: string | null;
  /** L6 product RBAC role (memberships.role). Prefer over DEMO_SHELL_ROLE. */
  membershipRole?: string | null;
};

export async function fetchSession(): Promise<MeResponse | null> {
  const res = await fetch(bffUrl("/api/me"), {
    credentials: "include",
    cache: "no-store",
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`session ${res.status}`);
  return (await res.json()) as MeResponse;
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const res = await fetch(bffUrl("/api/auth/sign-in/email"), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Origin: typeof window !== "undefined" ? window.location.origin : "",
    },
    body: JSON.stringify({ email: email.trim(), password }),
  });
  if (res.ok) return { ok: true };
  let message = "Sign-in failed";
  try {
    const body = (await res.json()) as { message?: string; code?: string };
    message = body.message || body.code || message;
  } catch {
    /* ignore */
  }
  return { ok: false, message };
}

export async function signOut(): Promise<void> {
  await fetch(bffUrl("/api/auth/sign-out"), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Origin: typeof window !== "undefined" ? window.location.origin : "",
    },
    body: "{}",
  });
}
