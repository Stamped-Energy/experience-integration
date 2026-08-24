# ARM64 / Graviton notes — stamped-cloud

## Why ARM64

Pilot host is `t4g.small` (Graviton). Images must be `linux/arm64`. amd64 images
will not start on the host.

## Build

```bash
docker buildx create --use --name stamped-arm64 || true
docker buildx build --platform linux/arm64 \
  -f deploy/stamped-cloud/Dockerfile \
  -t "${ECR_URI}/stamped-cloud:${GIT_SHA}" \
  --push \
  .
```

On Apple Silicon / Windows arm64 laptops, omit `--push` and use `--load` for local smoke.

## Multi-arch (optional later)

Do **not** publish amd64-only tags for production. If CI runners are amd64, always
pass `--platform linux/arm64` (QEMU) or use an arm64 runner.

## Runtime packages

Prefer official ARM64 base images (`public.ecr.aws/docker/library/...`). Avoid
copying host-native wheels; pin manylinux / aarch64 Python wheels.

## Go edge agent

`stamped-edge` is a separate image (`connectors-edge`). Build with
`GOARCH=arm64` / `CGO_ENABLED=0` for plant PCs that are also ARM, or the
arch matching the plant gateway.
