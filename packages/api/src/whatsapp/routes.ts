import type { FastifyInstance } from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import { z } from "zod";
import type { Auth } from "../auth/index.js";
import { AuthzError, requirePermission } from "../authz/index.js";
import type { Db } from "../db/client.js";
import { notifyPeople } from "../db/schema.js";
import { and, eq } from "drizzle-orm";
import { resolveActivePlant } from "../tenancy/service.js";
import { verifyMetaSignature } from "./client.js";
import {
  enqueueWhatsAppNotification,
  listRecentWhatsAppLogs,
  whatsappConnectionStatus,
} from "./service.js";
import {
  WHATSAPP_TEMPLATES,
  isAllowedWhatsAppButton,
  type WhatsAppTemplateId,
} from "./templates.js";

export type WhatsAppRouteDeps = { auth: Auth; db: Db };

function problem(
  reply: { status: (n: number) => { send: (b: unknown) => unknown } },
  status: number,
  detail: string,
  requestId: string,
) {
  return reply.status(status).send({
    type: `https://httpstatuses.com/${status}`,
    title: status === 401 ? "Unauthorized" : status === 403 ? "Forbidden" : "Error",
    status,
    detail,
    request_id: requestId,
  });
}

export async function registerWhatsAppRoutes(
  app: FastifyInstance,
  deps: WhatsAppRouteDeps,
): Promise<void> {
  app.get("/api/integrations/whatsapp", async (request, reply) => {
    const session = await deps.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) return problem(reply, 401, "Session required", request.id);
    const resolved = await resolveActivePlant(deps.db, {
      userId: session.user.id,
    });
    const plant = resolved.activePlant ?? resolved.authorized[0];
    if (!plant) return problem(reply, 403, "No plant membership", request.id);
    try {
      requirePermission(plant.role, "admin:integrations");
    } catch (err) {
      if (err instanceof AuthzError) {
        return problem(reply, 403, err.message, request.id);
      }
      throw err;
    }
    const logs = await listRecentWhatsAppLogs(deps.db, plant.id, 10);
    return {
      ...whatsappConnectionStatus(),
      recent: logs.map((l) => ({
        id: l.id,
        template_id: l.templateId,
        status: l.status,
        mode: l.mode,
        created_at: l.createdAt,
        context_type: l.contextType,
        context_id: l.contextId,
      })),
    };
  });

  app.post("/api/integrations/whatsapp/test-send", async (request, reply) => {
    const session = await deps.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) return problem(reply, 401, "Session required", request.id);
    const resolved = await resolveActivePlant(deps.db, {
      userId: session.user.id,
    });
    const plant = resolved.activePlant ?? resolved.authorized[0];
    if (!plant) return problem(reply, 403, "No plant membership", request.id);
    try {
      requirePermission(plant.role, "admin:integrations");
    } catch (err) {
      if (err instanceof AuthzError) {
        return problem(reply, 403, err.message, request.id);
      }
      throw err;
    }

    const body = z
      .object({
        personId: z.string().uuid().optional(),
        phone: z.string().min(8).optional(),
        template: z
          .enum(
            Object.keys(WHATSAPP_TEMPLATES) as [
              WhatsAppTemplateId,
              ...WhatsAppTemplateId[],
            ],
          )
          .default("issue"),
      })
      .safeParse(request.body ?? {});
    if (!body.success) {
      return problem(reply, 400, body.error.message, request.id);
    }

    let to = body.data.phone;
    let personId = body.data.personId ?? null;
    if (personId) {
      const person = await deps.db
        .select()
        .from(notifyPeople)
        .where(
          and(
            eq(notifyPeople.id, personId),
            eq(notifyPeople.plantId, plant.id),
          ),
        )
        .then((rows) => rows[0]);
      if (!person) return problem(reply, 404, "Person not found", request.id);
      to = person.phoneE164;
    }
    if (!to) return problem(reply, 400, "personId or phone required", request.id);

    const { logId, result } = await enqueueWhatsAppNotification(deps.db, {
      orgId: plant.orgId,
      plantId: plant.id,
      personId,
      toPhoneE164: to.startsWith("+") ? to : `+${to.replace(/\D/g, "")}`,
      template: body.data.template,
      contextType: "test_send",
      contextId: session.user.id,
    });

    return reply.status(201).send({ log_id: logId, ...result });
  });

  /** Meta webhook verification (subscribe challenge). */
  app.get("/api/webhooks/whatsapp", async (request, reply) => {
    const q = request.query as Record<string, string | undefined>;
    const mode = q["hub.mode"];
    const token = q["hub.verify_token"];
    const challenge = q["hub.challenge"];
    const expected = process.env.META_WA_VERIFY_TOKEN;
    if (mode === "subscribe" && expected && token === expected && challenge) {
      return reply.status(200).type("text/plain").send(challenge);
    }
    return problem(reply, 403, "Verify token mismatch", request.id);
  });

  /** Meta inbound webhook — signature required; unknown buttons rejected. */
  app.post("/api/webhooks/whatsapp", {
    config: { rawBody: true },
  }, async (request, reply) => {
    const secret = process.env.META_WA_APP_SECRET ?? "";
    const signature = request.headers["x-hub-signature-256"] as
      | string
      | undefined;
    const rawBodyCandidate = (request as unknown as { rawBody?: Buffer | string })
      .rawBody;
    const rawBody =
      typeof rawBodyCandidate === "string" || Buffer.isBuffer(rawBodyCandidate)
        ? rawBodyCandidate
        : typeof request.body === "string"
          ? request.body
          : JSON.stringify(request.body ?? {});
    if (!verifyMetaSignature(rawBody, signature, secret)) {
      return problem(reply, 401, "Invalid signature", request.id);
    }

    const payload = (
      typeof request.body === "string"
        ? JSON.parse(request.body)
        : request.body
    ) as {
      entry?: Array<{
        changes?: Array<{
          value?: {
            messages?: Array<{
              type?: string;
              button?: { payload?: string };
              interactive?: {
                button_reply?: { id?: string };
              };
            }>;
          };
        }>;
      }>;
    };

    const buttons: string[] = [];
    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        for (const msg of change.value?.messages ?? []) {
          const id =
            msg.button?.payload ??
            msg.interactive?.button_reply?.id ??
            "";
          if (!id) continue;
          if (!isAllowedWhatsAppButton(id)) {
            return problem(reply, 400, `Unknown button id: ${id}`, request.id);
          }
          buttons.push(id);
        }
      }
    }

    // P1: map buttons → Rx ack/done/defer. Stub acknowledges receipt.
    return { ok: true, buttons };
  });
}
