import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "stamped-dev",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-10-20",
    compatibilityFlags: ["nodejs_compat"],
    domains: ["dev.stamped.work"],
    observability: {
      enabled: true,
      logs: { enabled: true },
      traces: { enabled: true },
    },
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      IMAGES: bindings.images(),
    },
  }),
});
