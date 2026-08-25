import type { FastifyInstance } from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import type { Auth } from "./index.js";
import type { Mailer } from "../mail/mailer.js";
import type { Env } from "../config.js";
import type { Db } from "../db/client.js";
import { resolveActivePlant } from "../tenancy/service.js";

const InviteBody = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120),
});

function cookieHeader(setCookie: string | string[] | undefined): string {
  if (!setCookie) return "";
  const parts = Array.isArray(setCookie) ? setCookie : [setCookie];
  return parts.map((c) => c.split(";")[0]).join("; ");
}

/**
 * Mount Better Auth under /api/auth/* for the product BFF.
 * Public customer /v1 auth is out of scope (DEC-010).
 */
export async function registerAuthRoutes(
  app: FastifyInstance,
  auth: Auth,
  mailer: Mailer,
  env: Env,
  db?: Db,
): Promise<void> {
  app.route({
    method: ["GET", "POST"],
    url: "/api/auth/*",
    async handler(request, reply) {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const headers = fromNodeHeaders(request.headers);
      let body: string | undefined;
      if (request.method !== "GET" && request.method !== "HEAD") {
        body =
          typeof request.body === "string"
            ? request.body
            : JSON.stringify(request.body ?? {});
      }
      const req = new Request(url.toString(), {
        method: request.method,
        headers,
        body,
      });
      const response = await auth.handler(req);
      reply.status(response.status);
      response.headers.forEach((value, key) => {
        reply.header(key, value);
      });
      const text = await response.text();
      return reply.send(text === "" ? null : text);
    },
  });

  app.get("/api/me", async (request, reply) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) {
      return reply.status(401).send({
        type: "https://httpstatuses.com/401",
        title: "Unauthorized",
        status: 401,
        detail: "No active session",
        request_id: request.id,
      });
    }

    let orgId: string | null = null;
    let plantId: string | null = null;
    let membershipRole: string | null = null;
    if (db) {
      const resolved = await resolveActivePlant(db, {
        userId: session.user.id,
      });
      const plant = resolved.activePlant ?? resolved.authorized[0] ?? null;
      if (plant) {
        orgId = plant.orgId;
        plantId = plant.id;
        membershipRole = plant.role;
      }
    }

    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        emailVerified: session.user.emailVerified,
        role: "role" in session.user ? session.user.role : undefined,
      },
      session: {
        id: session.session.id,
        expiresAt: session.session.expiresAt,
      },
      orgId,
      plantId,
      /** L6 product RBAC role from memberships (prefer over DEMO_SHELL_ROLE). */
      membershipRole,
    };
  });

  /**
   * Admin invite: create credential user with a one-time password, email a
   * reset link so the invitee sets their own password. Signup stays disabled.
   */
  app.post("/api/admin/invites", async (request, reply) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) {
      return reply.status(401).send({
        type: "https://httpstatuses.com/401",
        title: "Unauthorized",
        status: 401,
        detail: "Admin session required",
        request_id: request.id,
      });
    }
    const role =
      "role" in session.user ? String(session.user.role ?? "") : "";
    if (role !== "admin") {
      return reply.status(403).send({
        type: "https://httpstatuses.com/403",
        title: "Forbidden",
        status: 403,
        detail: "Admin role required",
        request_id: request.id,
      });
    }

    const parsed = InviteBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        type: "https://httpstatuses.com/400",
        title: "Bad Request",
        status: 400,
        detail: parsed.error.issues.map((i) => i.message).join("; "),
        request_id: request.id,
      });
    }

    const tempPassword = `Tmp-${randomBytes(18).toString("base64url")}`;
    const created = await auth.api.createUser({
      body: {
        email: parsed.data.email,
        name: parsed.data.name,
        password: tempPassword,
        role: "user",
      },
      headers: fromNodeHeaders(request.headers),
    });

    // Trigger Better Auth reset email (captured by mailer).
    await auth.api.requestPasswordReset({
      body: {
        email: parsed.data.email,
        redirectTo: `${env.WEB_ORIGIN}/reset-password`,
      },
    });

    const resetMail = [...mailer.outbox()]
      .reverse()
      .find((m) => m.to === parsed.data.email && m.kind === "password_reset");

    await mailer.send({
      to: parsed.data.email,
      subject: "You're invited to Stamped",
      text: [
        `${parsed.data.name}, you have been invited to Stamped L6.`,
        resetMail?.text ??
          `Sign in after setting your password at ${env.WEB_ORIGIN}`,
        `This invite expires in ${env.AUTH_TOKEN_TTL_SECONDS} seconds.`,
      ].join("\n\n"),
      kind: "invite",
    });

    return reply.status(201).send({
      user: {
        id: created.user.id,
        email: created.user.email,
        name: created.user.name,
      },
      invite_emailed: true,
    });
  });

  // Dev-only outbox inspector (never enable in production).
  if (env.NODE_ENV !== "production") {
    app.get("/api/dev/outbox", async () => ({
      messages: mailer.outbox(),
    }));
  }
}

export { cookieHeader };
