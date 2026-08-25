import { bffUrl } from "@/lib/bff";
import type { Role } from "@/lib/types";

export type NotifyPersonDto = {
  id: string;
  name: string;
  role: string;
  phoneMasked: string;
  phoneE164?: string;
  areas: string[];
  assetIds: string[];
  skills: string[];
  whatsappEnabled: boolean;
};

export type AlarmRouteDto = {
  id: string;
  scope: "area" | "asset";
  target: string;
  label: string;
  primaryPersonId: string;
  backupPersonIds: string[];
  severityMin: string;
};

export type PersonCreateInput = {
  name: string;
  role: Role;
  phone: string;
  areas?: string[];
  assetIds?: string[];
  skills?: string[];
  whatsappEnabled?: boolean;
};

export type RouteCreateInput = {
  scope: "area" | "asset";
  target: string;
  label: string;
  primaryPersonId: string;
  backupPersonIds?: string[];
  severityMin?: string;
};

async function readProblem(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: string; message?: string };
    return body.detail || body.message || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

export async function listPeople(opts?: {
  reveal?: boolean;
}): Promise<{ people: NotifyPersonDto[]; plantId: string; orgId: string }> {
  const q = opts?.reveal ? "?reveal=1" : "";
  const res = await fetch(bffUrl(`/api/assignments/people${q}`), {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await readProblem(res));
  return (await res.json()) as {
    people: NotifyPersonDto[];
    plantId: string;
    orgId: string;
  };
}

export async function createPerson(
  body: PersonCreateInput,
): Promise<NotifyPersonDto> {
  const res = await fetch(bffUrl("/api/assignments/people"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readProblem(res));
  const json = (await res.json()) as { person: NotifyPersonDto };
  return json.person;
}

export async function patchPerson(
  id: string,
  body: Partial<PersonCreateInput>,
): Promise<NotifyPersonDto> {
  const res = await fetch(
    bffUrl(`/api/assignments/people/${encodeURIComponent(id)}`),
    {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) throw new Error(await readProblem(res));
  const json = (await res.json()) as { person: NotifyPersonDto };
  return json.person;
}

export async function deletePerson(id: string): Promise<void> {
  const res = await fetch(
    bffUrl(`/api/assignments/people/${encodeURIComponent(id)}`),
    { method: "DELETE", credentials: "include" },
  );
  if (!res.ok && res.status !== 204) throw new Error(await readProblem(res));
}

export async function listRoutes(): Promise<{
  routes: AlarmRouteDto[];
  plantId: string;
  orgId: string;
}> {
  const res = await fetch(bffUrl("/api/assignments/routes"), {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await readProblem(res));
  return (await res.json()) as {
    routes: AlarmRouteDto[];
    plantId: string;
    orgId: string;
  };
}

export async function createRoute(
  body: RouteCreateInput,
): Promise<AlarmRouteDto> {
  const res = await fetch(bffUrl("/api/assignments/routes"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readProblem(res));
  const json = (await res.json()) as { route: AlarmRouteDto };
  return json.route;
}

export async function patchRoute(
  id: string,
  body: Partial<RouteCreateInput>,
): Promise<AlarmRouteDto> {
  const res = await fetch(
    bffUrl(`/api/assignments/routes/${encodeURIComponent(id)}`),
    {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) throw new Error(await readProblem(res));
  const json = (await res.json()) as { route: AlarmRouteDto };
  return json.route;
}

export async function deleteRoute(id: string): Promise<void> {
  const res = await fetch(
    bffUrl(`/api/assignments/routes/${encodeURIComponent(id)}`),
    { method: "DELETE", credentials: "include" },
  );
  if (!res.ok && res.status !== 204) throw new Error(await readProblem(res));
}

export type AssignmentNotifyResult = {
  log_id: string;
  mode: "dry_run" | "live";
  status: "accepted" | "dry_run" | "failed";
  provider_message_id: string | null;
  error: string | null;
  person: { id: string; name: string; phone_masked: string };
};

/** Enqueue WhatsApp for an assignee; returns real dry_run / accepted / failed. */
export async function notifyAssignee(input: {
  personId: string;
  prescriptionId?: string;
  template?: string;
}): Promise<AssignmentNotifyResult> {
  const res = await fetch(bffUrl("/api/assignments/notify"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readProblem(res));
  return (await res.json()) as AssignmentNotifyResult;
}
