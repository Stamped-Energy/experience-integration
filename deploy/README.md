# Deploy scaffolding — Phase H0 lean + Phase H (apply-ready, not applied)

Owns the **stamped-cloud** image, Terraform for the single-host pilot, bill-extract
Lambda stub, and host hardening units. Edge profile lives in
`connectors-edge/deploy/profiles/`.

## Container budget

| Artifact | Where |
|----------|--------|
| `stamped-cloud` | this folder — L1–L5 + L6 BFF under supervisord |
| `stamped-edge` | `connectors-edge` — edge-agent only |
| Mosquitto | **host process** on EC2 (not a container) |
| L6 web | **Vercel** — see [docs/deploy/vercel-fixtures.md](../docs/deploy/vercel-fixtures.md) |

## H0 lean (demo backup)

1. Map Vercel env from [`env/vercel-fixtures.env.example`](../env/vercel-fixtures.env.example)
2. Deploy with root [`vercel.json`](../vercel.json) (`USE_FIXTURES=true`)
3. Rehearse walkthrough with source indicators visible

No AWS required.

## Phase H tree

```text
deploy/
├── README.md                 ← this file (includes rollback)
├── stamped-cloud/            ← Dockerfile + supervisord (ARM64)
├── terraform/                ← VPC public/no-NAT, t4g.small, RDS t4g.micro, SSM, VPCE
├── lambda/bill-extract/      ← S3 → BillLine stub
└── host/                     ← systemd unit, memory notes, rollback script
```

## Rollback — previous image tag pull

On the EC2 host after every successful deploy the workflow/operator must retain:

| File | Content |
|------|---------|
| `/opt/stamped/state/CURRENT_IMAGE_TAG` | Image just started |
| `/opt/stamped/state/PREVIOUS_IMAGE_TAG` | Image that ran before |

**One-command revert:**

```bash
sudo /opt/stamped/bin/rollback-cloud.sh
# → docker pull $PREVIOUS → systemctl restart stamped-cloud
```

Record wall-clock duration in the runbook (Phase H / N gate). Migrations are
additive — no down-migration. L6 Vercel Instant Rollback is independent.

## Terraform

```bash
cd deploy/terraform
terraform init -backend=false
terraform validate   # if terraform CLI installed
# terraform plan     # human only
# NEVER terraform apply from an agent
```

Confirm plan has **no NAT Gateway** and host SG admits only **443 + 8883**.

## Related

- [stamped-cloud/ARM64.md](./stamped-cloud/ARM64.md)
- [host/MEMORY.md](./host/MEMORY.md)
- [terraform/README.md](./terraform/README.md)
- CDK stub at `infra/src/lib/l6-pilot-stack.ts` — **do not use** (provisions NAT)
