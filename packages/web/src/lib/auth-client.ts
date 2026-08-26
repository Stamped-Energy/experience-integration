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

export type SessionResult =
  | { kind: "authenticated"; data: MeResponse }
  | { kind: "unauthenticated" }
  | { kind: "unreachable"; message: string };

const BFF_UNREACHABLE_MESSAGE =
  "Unable to reach the sign-in service. The server may be offline — try again later.";

export async function fetchSession(): Promise<SessionResult> {
  try {
    const res = await fetch(bffUrl("/api/me"), {
      credentials: "include",
      cache: "no-store",
    });
    if (res.status === 401) return { kind: "unauthenticated" };
    if (!res.ok) {
      return {
        kind: "unreachable",
        message: `Sign-in service returned ${res.status}. Try again later.`,
      };
    }
    return { kind: "authenticated", data: (await res.json()) as MeResponse };
  } catch {
    return { kind: "unreachable", message: BFF_UNREACHABLE_MESSAGE };
  }
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
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
    let message = "Sign-in failed. Check your email and password.";
    try {
      const body = (await res.json()) as { message?: string; code?: string };
      message = body.message || body.code || message;
    } catch {
      /* ignore */
    }
    return { ok: false, message };
  } catch {
    return { ok: false, message: BFF_UNREACHABLE_MESSAGE };
  }
}

export async function signOut(): Promise<void> {
  try {
    await fetch(bffUrl("/api/auth/sign-out"), {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Origin: typeof window !== "undefined" ? window.location.origin : "",
      },
      body: "{}",
    });
  } catch {
    /* offline sign-out — clear client state anyway */
  }
}

export { BFF_UNREACHABLE_MESSAGE };
