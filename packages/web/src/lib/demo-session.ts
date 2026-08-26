import type { AuthUser } from "@/lib/auth-client";
import { DEMO_PLANT } from "@/lib/plant-catalog";

export const DEMO_LOGIN_EMAIL = "demo@stamped.local";
export const DEMO_LOGIN_PASSWORD = "StampedDemo123!";
export const DEMO_PLANT_ID = DEMO_PLANT.plantId;
export const DEMO_SESSION_KEY = "stamped.demo.session";

type DemoSessionPayload = {
  email: string;
  plantId: string;
  orgId: string;
  role: string;
  signedInAt: string;
};

export function isDemoCredentials(email: string, password: string): boolean {
  return (
    email.trim().toLowerCase() === DEMO_LOGIN_EMAIL &&
    password === DEMO_LOGIN_PASSWORD
  );
}

export function readDemoSession(): DemoSessionPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(DEMO_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoSessionPayload;
    if (parsed.plantId !== DEMO_PLANT_ID) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isDemoSessionActive(): boolean {
  return readDemoSession() != null;
}

export function enableDemoSession(): void {
  if (typeof window === "undefined") return;
  const payload: DemoSessionPayload = {
    email: DEMO_LOGIN_EMAIL,
    plantId: DEMO_PLANT_ID,
    orgId: DEMO_PLANT.orgId,
    role: "plant_head",
    signedInAt: new Date().toISOString(),
  };
  window.sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(payload));
}

export function clearDemoSession(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(DEMO_SESSION_KEY);
}

export function demoUser(): AuthUser {
  return {
    id: "user_demo_jaipur",
    email: DEMO_LOGIN_EMAIL,
    name: "Jaipur Demo",
    emailVerified: true,
    role: "plant_head",
  };
}
