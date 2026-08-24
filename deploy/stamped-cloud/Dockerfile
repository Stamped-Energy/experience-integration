# stamped-cloud — single ARM64 image for the pilot host
#
# Container budget (program brief): one cloud container under a supervisor.
# Processes: L1 cloud ingest, relay, L2 ingest, L2 query API, L3 scheduler,
# L4 API + worker, L5 API, L6 BFF. Mosquitto stays a *host* process — not here.
#
# Build (from experience-integration, after sibling checkouts exist):
#   docker buildx build --platform linux/arm64 \
#     -f deploy/stamped-cloud/Dockerfile \
#     -t stamped-cloud:local \
#     --build-arg BUILD_CONTEXT=workspace \
#     .
#
# Signal policy: supervisord is PID 1 with stopasgroup/killasgroup so SIGTERM
# reaches workers (Phase K graceful shutdown depends on this).

FROM --platform=linux/arm64 public.ecr.aws/docker/library/python:3.12-slim-bookworm AS python-base

RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl tini supervisor \
    && rm -rf /var/lib/apt/lists/*

# Node for L6 BFF (Graviton / ARM64)
FROM --platform=linux/arm64 public.ecr.aws/docker/library/node:22-bookworm-slim AS node-base
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# ---------------------------------------------------------------------------
# Runtime image — placeholders until multi-repo COPY contexts are wired in CI.
# Production builds should COPY pre-built artifacts from each layer's CI job
# (see .github/workflows/deploy-stamped-cloud.yml) rather than compiling here.
# ---------------------------------------------------------------------------
FROM --platform=linux/arm64 public.ecr.aws/docker/library/python:3.12-slim-bookworm

LABEL org.opencontainers.image.title="stamped-cloud" \
      org.opencontainers.image.description="L1–L5 + L6 BFF under supervisord (ARM64/Graviton)" \
      org.opencontainers.image.source="https://github.com/stamped-energy/experience-integration"

RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl tini supervisor \
      # Node runtime for BFF (install from NodeSource would bloat; use distro node for scaffold)
      nodejs npm \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /etc/supervisor/conf.d /var/log/supervisor /opt/stamped \
               /opt/stamped/l1 /opt/stamped/l2 /opt/stamped/l3 \
               /opt/stamped/l4 /opt/stamped/l5 /opt/stamped/l6-bff

COPY deploy/stamped-cloud/supervisord.conf /etc/supervisor/supervisord.conf
COPY deploy/stamped-cloud/conf.d/ /etc/supervisor/conf.d/
COPY deploy/stamped-cloud/scripts/entrypoint.sh /usr/local/bin/stamped-entrypoint
COPY deploy/stamped-cloud/scripts/healthcheck.sh /usr/local/bin/stamped-healthcheck
COPY deploy/stamped-cloud/scripts/stub-process.sh /usr/local/bin/stamped-stub-process

RUN chmod +x /usr/local/bin/stamped-entrypoint \
             /usr/local/bin/stamped-healthcheck \
             /usr/local/bin/stamped-stub-process

# Health probe ports (documented; stubs listen when STAMPED_CLOUD_STUBS=1)
EXPOSE 3001 8080 8091 8092

ENV SUPERVISOR_LOG_LEVEL=info \
    STAMPED_CLOUD_STUBS=1 \
    PYTHONUNBUFFERED=1

# tini as true PID 1 → forwards signals; supervisord then fans out to children
ENTRYPOINT ["/usr/bin/tini", "--", "/usr/local/bin/stamped-entrypoint"]
CMD ["supervisord", "-n", "-c", "/etc/supervisor/supervisord.conf"]
