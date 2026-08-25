import { bffUrl } from "@/lib/bff";

export type OrgMember = {
  id: string;
  userId: string;
  orgId: string;
  role: string;
  status: string;
  plantIds: string[];
};

export type AuditEvent = {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  actorUserId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type AuthorizedPlantDto = {
  id: string;
  orgId: string;
  externalPlantId: string;
  name: string;
  timezone: string;
  role: string;
};

async function readProblem(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: string; message?: string };
    return body.detail || body.message || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

export async function listOrgMembers(orgId: string): Promise<OrgMember[]> {
  const res = await fetch(
    bffUrl(`/api/admin/orgs/${encodeURIComponent(orgId)}/members`),
    { credentials: "include", cache: "no-store" },
  );
  if (!res.ok) throw new Error(await readProblem(res));
  const body = (await res.json()) as { members?: OrgMember[] };
  return Array.isArray(body.members) ? body.members : [];
}

export async function listAuditEvents(
  orgId: string,
  limit = 50,
): Promise<AuditEvent[]> {
  const res = await fetch(
    bffUrl(
      `/api/admin/orgs/${encodeURIComponent(orgId)}/audit-events?limit=${limit}`,
    ),
    { credentials: "include", cache: "no-store" },
  );
  if (!res.ok) throw new Error(await readProblem(res));
  const body = (await res.json()) as { items?: AuditEvent[] };
  return Array.isArray(body.items) ? body.items : [];
}

export async function inviteUser(input: {
  email: string;
  name: string;
}): Promise<{ user: { id: string; email: string; name: string } }> {
  const res = await fetch(bffUrl("/api/admin/invites"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readProblem(res));
  return (await res.json()) as {
    user: { id: string; email: string; name: string };
  };
}

export async function addOrgMember(
  orgId: string,
  input: { userId: string; role: string; plantIds: string[] },
): Promise<OrgMember> {
  const res = await fetch(
    bffUrl(`/api/admin/orgs/${encodeURIComponent(orgId)}/members`),
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  if (!res.ok) throw new Error(await readProblem(res));
  const body = (await res.json()) as { membership: OrgMember };
  return body.membership;
}

export async function patchOrgMember(
  orgId: string,
  membershipId: string,
  body: { role?: string; plantIds?: string[]; status?: "active" | "inactive" },
): Promise<OrgMember> {
  const res = await fetch(
    bffUrl(
      `/api/admin/orgs/${encodeURIComponent(orgId)}/members/${encodeURIComponent(membershipId)}`,
    ),
    {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) throw new Error(await readProblem(res));
  const json = (await res.json()) as { membership: OrgMember };
  return json.membership;
}

export async function listPlants(): Promise<{
  plants: AuthorizedPlantDto[];
  activePlant: AuthorizedPlantDto | null;
}> {
  const res = await fetch(bffUrl("/api/plants"), {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await readProblem(res));
  const body = (await res.json()) as {
    plants?: AuthorizedPlantDto[];
    activePlant?: AuthorizedPlantDto | null;
  };
  return {
    plants: Array.isArray(body.plants) ? body.plants : [],
    activePlant: body.activePlant ?? null,
  };
}

export async function setActivePlant(input: {
  orgId: string;
  plantId: string;
}): Promise<AuthorizedPlantDto> {
  const res = await fetch(bffUrl("/api/plants/active"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readProblem(res));
  const body = (await res.json()) as { activePlant: AuthorizedPlantDto };
  return body.activePlant;
}
