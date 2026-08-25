import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";
import { registerAdminRoutes } from "./admin/routes.js";
import { registerAlarmRoutes } from "./alarms/routes.js";
import type { AlarmStore } from "./alarms/service.js";
import type { Auth } from "./auth/index.js";
import { registerAuthRoutes } from "./auth/routes.js";
import { type Env, loadEnv } from "./config.js";
import type { Db } from "./db/client.js";
import { registerEventRoutes } from "./events/routes.js";
import { registerExportRoutes } from "./exports/routes.js";
import { registerIntegrationRoutes } from "./integrations/routes.js";
import type { Mailer } from "./mail/mailer.js";
import { registerPlantRoutes } from "./plants/routes.js";
import { registerNegotiationRoutes } from "./negotiation/routes.js";
import { registerPrescriptionRoutes } from "./prescriptions/routes.js";
import type { PrescriptionStore } from "./prescriptions/service.js";
import { problemHandler } from "./problems.js";
import { registerPublicApiRoutes } from "./public/routes.js";
import { registerReportRoutes } from "./reports/routes.js";
import { registerTelemetryRoutes } from "./telemetry/routes.js";
import { correlationStore } from "./upstream/correlation.js";
import type { L5WorkflowClient } from "./upstream/l5/client.js";
import type { L4AnalystClient } from "./upstream/l4/client.js";
import type { L2QueryClient } from "./upstream/l2/client.js";
import { registerAnalystRoutes } from "./analyst/routes.js";
import { registerCaseRoutes } from "./cases/routes.js";
import { registerL2Routes } from "./l2/routes.js";
import { registerOverviewRoutes } from "./overview/routes.js";
import { registerInsightsRoutes } from "./insights/routes.js";
import { probeUpstreams } from "./meta/upstreams.js";
import { orgIdForExternalPlantId } from "./upstream/mappings.js";
import type pg from "pg";

export type AppDeps = {
  env?: Env;
  checkReady?: () => Promise<boolean> | boolean;
  auth?: Auth;
  mailer?: Mailer;
  db?: Db;
  pool?: pg.Pool;
  l5?: L5WorkflowClient | null;
  l4?: L4AnalystClient | null;
  l2?: L2QueryClient | null;
  createL2Client?: (orgId: string) => L2QueryClient | null;
  publicRateLimitMax?: number;
  alarmFixture?: AlarmStore;
  prescriptionFixture?: PrescriptionStore;
  enqueueReportGenerate?: (reportJobId: string) => Promise<string | null>;
};

export async function buildApp(
  opts: AppDeps = {},
): Promise<FastifyInstance> {
  const env = opts.env ?? loadEnv();
  const logger: FastifyServerOptions["logger"] =
    env.NODE_ENV === "test"
      ? false
      : {
          level: env.LOG_LEVEL,
          base: { service: "l6-api" },
          redact: [
            "req.headers.authorization",
            "req.headers.cookie",
            "password",
            "newPassword",
            "token",
          ],
        };

  const app = Fastify({
    logger,
    requestIdHeader: "x-request-id",
    genReqId: (req) => {
      const header = req.headers["x-request-id"];
      if (typeof header === "string" && header.length > 0) return header;
      return crypto.randomUUID();
    },
  });

  await app.register(sensible);
  await app.register(helmet, {
    // Report-only CSP first (Phase K) — tighten to enforce after pilot reports are clean.
    contentSecurityPolicy: {
      reportOnly: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    // Browser web (localhost:3000) reads BFF (localhost:3001) with credentials;
    // default same-origin CORP breaks credentialed cross-origin SSE/fetch.
    crossOriginResourcePolicy: { policy: "cross-origin" },
  });
  await app.register(cors, {
    // Local web may be opened as localhost or 127.0.0.1 — both must work with credentials.
    origin: (origin, cb) => {
      const allowed = new Set([
        env.WEB_ORIGIN,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ]);
      if (!origin || allowed.has(origin)) {
        cb(null, true);
        return;
      }
      if (env.NODE_ENV !== "production" && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
        cb(null, true);
        return;
      }
      cb(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-Request-Id",
      "Last-Event-ID",
    ],
  });

  await app.register(rateLimit, {
    global: true,
    max: env.NODE_ENV === "test" ? 10_000 : 300,
    timeWindow: "1 minute",
    // omit ban — ban:0 means "403 immediately on exceed" in @fastify/rate-limit
  });

  app.setErrorHandler(problemHandler);
  app.setNotFoundHandler(async (request, reply) => {
    await reply
      .status(404)
      .header("content-type", "application/problem+json; charset=utf-8")
      .send({
        type: "https://httpstatuses.com/404",
        title: "Not Found",
        status: 404,
        detail: `Route ${request.method} ${request.url} not found`,
        instance: request.url,
        request_id: request.id,
      });
  });

  app.addHook("onRequest", (request, _reply, done) => {
    // enterWith so outbound upstreamFetch sees the same id for the request lifetime.
    correlationStore.enterWith({ requestId: request.id });
    done();
  });

  app.addHook("onSend", async (request, reply, payload) => {
    reply.header("x-request-id", request.id);
    return payload;
  });

  app.get("/health", async () => ({
    status: "ok",
    service: "l6-api",
  }));

  app.get("/ready", async () => ({
    status: "ready",
    service: "l6-api",
  }));

  app.get("/health/deep", async (_request, reply) => {
    if (env.REQUIRE_DATABASE && opts.checkReady) {
      const ready = await opts.checkReady();
      if (!ready) {
        return reply.status(503).send({
          type: "https://httpstatuses.com/503",
          title: "Service Unavailable",
          status: 503,
          detail: "Database is not ready",
          request_id: _request.id,
        });
      }
    }
    return { status: "ok", service: "l6-api", db: "connected" };
  });

  app.get("/api/meta", async () => ({
    name: "stamped-l6-bff",
    surface: "product",
    public_api: Boolean(opts.db),
    auth: Boolean(opts.auth),
    strict_live: env.L6_STRICT_LIVE,
  }));

  app.get("/api/meta/upstreams", async (request) => {
    const q = request.query as { plantId?: string; orgId?: string };
    const plantId = q.plantId?.trim() || "plant_lnm_faridabad_1";
    const orgId = q.orgId?.trim() || orgIdForExternalPlantId(plantId);
    const l5Live = Boolean(opts.l5) && !env.USE_FIXTURES && env.L5_LIVE && env.L6_L5_LIVE;
    const l2Live = !env.USE_FIXTURES && env.L2_LIVE;
    const l4Live = Boolean(opts.l4) && !env.USE_FIXTURES && env.L4_LIVE;
    return probeUpstreams(
      {
        l5: opts.l5,
        l4: opts.l4,
        createL2Client: opts.createL2Client,
        l2Live,
        l5Live,
        l4Live,
      },
      { orgId, plantId },
    );
  });

  await registerTelemetryRoutes(app, { db: opts.db, auth: opts.auth });

  if (opts.db) {
    await registerPublicApiRoutes(app, {
      db: opts.db,
      publicRateLimitMax: opts.publicRateLimitMax,
    });
  }

  if (opts.auth && opts.mailer) {
    await registerAuthRoutes(app, opts.auth, opts.mailer, env);
  }
  if (opts.auth && opts.db) {
    await registerAdminRoutes(app, opts.auth, opts.db);
    await registerPlantRoutes(app, opts.auth, opts.db);
    await registerAlarmRoutes(app, {
      auth: opts.auth,
      db: opts.db,
      l5: opts.l5,
      fixture: opts.alarmFixture,
      strictLive: env.L6_STRICT_LIVE,
    });
    await registerPrescriptionRoutes(app, {
      auth: opts.auth,
      db: opts.db,
      l5: opts.l5,
      fixture: opts.prescriptionFixture,
      strictLive: env.L6_STRICT_LIVE,
    });
    await registerNegotiationRoutes(app, {
      auth: opts.auth,
      db: opts.db,
      discussEnabled: env.DISCUSS_ENABLED,
      l5: opts.l5,
    });
    await registerExportRoutes(app, { auth: opts.auth, db: opts.db });
    await registerReportRoutes(app, {
      auth: opts.auth,
      db: opts.db,
      enqueueGenerate: opts.enqueueReportGenerate,
    });
    await registerIntegrationRoutes(app, { auth: opts.auth, db: opts.db });
    await registerL2Routes(app, {
      auth: opts.auth,
      db: opts.db,
      l2: opts.l2,
      createL2Client: opts.createL2Client,
    });
    await registerOverviewRoutes(app, {
      auth: opts.auth,
      db: opts.db,
      l5: opts.l5,
      createL2Client: opts.createL2Client,
      alarmFixture: opts.alarmFixture,
      prescriptionFixture: opts.prescriptionFixture,
      strictLive: env.L6_STRICT_LIVE,
    });
    await registerInsightsRoutes(app, {
      auth: opts.auth,
      db: opts.db,
      createL2Client: opts.createL2Client,
    });
    await registerCaseRoutes(app, {
      auth: opts.auth,
      db: opts.db,
      l5: opts.l5,
      createL2Client: opts.createL2Client,
    });
  }
  if (opts.auth && opts.l4) {
    await registerAnalystRoutes(app, {
      auth: opts.auth,
      l4: opts.l4,
      live: Boolean(env.L4_LIVE && !env.USE_FIXTURES),
      allowAnonymous:
        Boolean(env.L4_LIVE && !env.USE_FIXTURES) &&
        (env.NODE_ENV === "development" ||
          process.env.L4_ANALYST_ALLOW_ANON === "true"),
    });
  }
  if (opts.auth && opts.db && opts.pool) {
    await registerEventRoutes(app, opts.auth, opts.db, opts.pool);
  }

  return app;
}

export async function startServer(
  opts: AppDeps = {},
): Promise<FastifyInstance> {
  const env = opts.env ?? loadEnv();
  const app = await buildApp({ ...opts, env });
  await app.listen({ host: env.HOST, port: env.PORT });
  return app;
}
