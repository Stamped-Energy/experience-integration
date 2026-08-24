import type { FastifyInstance } from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import { z } from "zod";
import type { Auth } from "../auth/index.js";
import { UpstreamError } from "../upstream/http.js";
import {
  AnalystContextEnvelopeSchema,
  L4AnalystClient,
} from "../upstream/l4/client.js";

const CreateSessionBody = z.object({
  orgId: z.string().min(1),
  plantId: z.string().min(1),
  userId: z.string().min(1).optional(),
});

const StreamMessageBody = z.object({
  content: z.string().min(1),
  envelope: AnalystContextEnvelopeSchema,
  entityPlantId: z.string().optional(),
});

export type AnalystRouteDeps = {
  auth: Auth;
  l4: L4AnalystClient;
  live: boolean;
  /** Local OX / demo: allow envelope user when no Better Auth cookie. */
  allowAnonymous: boolean;
};

function unauthorized(reply: {
  status: (n: number) => { send: (b: unknown) => unknown };
}, requestId: string) {
  return reply.status(401).send({
    type: "https://httpstatuses.com/401",
    title: "Unauthorized",
    status: 401,
    detail: "Session required",
    request_id: requestId,
  });
}

export async function registerAnalystRoutes(
  app: FastifyInstance,
  deps: AnalystRouteDeps,
): Promise<void> {
  const { auth, l4, live, allowAnonymous } = deps;

  app.get("/api/analyst/meta", async () => ({
    live,
    surface: "ask_analyst",
    allow_anonymous: allowAnonymous,
  }));

  app.post("/api/analyst/sessions", async (request, reply) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    const body = CreateSessionBody.parse(request.body);
    const userId = session?.user.id || body.userId;
    if (!userId) {
      if (!allowAnonymous) return unauthorized(reply, request.id);
      return reply.status(400).send({
        type: "https://httpstatuses.com/400",
        title: "Bad Request",
        status: 400,
        detail: "userId required when anonymous analyst is enabled",
        request_id: request.id,
      });
    }
    if (!session && !allowAnonymous) return unauthorized(reply, request.id);

    try {
      const created = await l4.createSession({
        orgId: body.orgId,
        plantId: body.plantId,
        userId,
      });
      return {
        sessionId: created.session_id,
        orgId: created.org_id,
        plantId: created.plant_id,
        createdAt: created.created_at,
        live,
        anonymous: !session,
      };
    } catch (err) {
      if (err instanceof UpstreamError) {
        return reply.status(err.status).send({
          type: `https://httpstatuses.com/${err.status}`,
          title: err.code,
          status: err.status,
          detail: err.message,
          request_id: request.id,
        });
      }
      throw err;
    }
  });

  app.post("/api/analyst/sessions/:sessionId/messages/stream", async (request, reply) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    const sessionId = String((request.params as { sessionId: string }).sessionId);
    const body = StreamMessageBody.parse(request.body);
    if (!session && !allowAnonymous) return unauthorized(reply, request.id);

    const envelope = {
      ...body.envelope,
      userId: session?.user.id || body.envelope.userId,
    };
    if (!envelope.userId) {
      return reply.status(400).send({
        type: "https://httpstatuses.com/400",
        title: "Bad Request",
        status: 400,
        detail: "envelope.userId required when anonymous",
        request_id: request.id,
      });
    }

    try {
      const upstream = await l4.openMessageStream({
        sessionId,
        content: body.content,
        envelope,
        entityPlantId: body.entityPlantId,
      });
      reply.hijack();
      reply.raw.writeHead(200, {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-cache",
        connection: "keep-alive",
        "x-accel-buffering": "no",
        "x-request-id": request.id,
      });
      const reader = upstream.body?.getReader();
      if (!reader) {
        reply.raw.end();
        return;
      }
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value) continue;
        reply.raw.write(Buffer.from(value));
      }
      reply.raw.end();
    } catch (err) {
      if (reply.raw.headersSent) {
        const message = err instanceof Error ? err.message : "stream failed";
        reply.raw.write(
          `event: error\ndata: ${JSON.stringify({ message })}\n\n`,
        );
        reply.raw.end();
        return;
      }
      if (err instanceof UpstreamError) {
        return reply.status(err.status).send({
          type: `https://httpstatuses.com/${err.status}`,
          title: err.code,
          status: err.status,
          detail: err.message,
          request_id: request.id,
        });
      }
      throw err;
    }
  });
}
