# Terraform — stamped pilot stack (Phase H scaffold)

**NEVER `terraform apply` from an agent.** Human reviews `terraform plan` first.

## Shape

| Resource | Choice |
|----------|--------|
| VPC | Public subnets for EC2 + private for RDS |
| NAT | **None** — confirm absent in plan |
| EC2 | `t4g.small` (ARM64/Graviton) |
| RDS | `db.t4g.micro` Postgres placeholder |
| Endpoints | S3 gateway + SSM / ssmmessages / ec2messages |
| SG inbound | **443 + 8883 only** (no SSH; use SSM Session Manager) |
| S3 | Bills bucket |
| SSM | SecureString placeholders under `/stamped/<env>/` |

Do **not** copy patterns from `infra/src/lib/l6-pilot-stack.ts` (CDK stub provisions a NAT).

## Validate (local)

```bash
cd deploy/terraform
terraform init -backend=false
terraform validate
terraform plan -var-file=terraform.tfvars.example   # human reviews; no apply
```

## Review checklist

- [ ] Plan contains **zero** `aws_nat_gateway` / NAT EIP associations for egress
- [ ] Host SG ingress is only 443 and 8883
- [ ] RDS `publicly_accessible = false`
- [ ] SSM parameter values still `REPLACE_BEFORE_CONTAINER_START` until rotated
