data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  azs              = slice(data.aws_availability_zones.available.names, 0, 2)
  bills_bucket     = var.bills_bucket_name != "" ? var.bills_bucket_name : "${var.name_prefix}-bills-${var.environment}"
  ssm_prefix       = "/stamped/${var.environment}"
}

# -----------------------------------------------------------------------------
# VPC — public subnets for EC2, private for RDS. Intentionally NO NAT Gateway.
# S3 and SSM reached via VPC interface/gateway endpoints.
# -----------------------------------------------------------------------------
resource "aws_vpc" "pilot" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "${var.name_prefix}-vpc"
  }
}

resource "aws_internet_gateway" "pilot" {
  vpc_id = aws_vpc.pilot.id
  tags   = { Name = "${var.name_prefix}-igw" }
}

resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.pilot.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.name_prefix}-public-${count.index}"
    Tier = "public"
  }
}

resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.pilot.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]

  tags = {
    Name = "${var.name_prefix}-private-${count.index}"
    Tier = "private-no-nat"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.pilot.id
  tags   = { Name = "${var.name_prefix}-public-rt" }
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.pilot.id
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private RT has NO 0.0.0.0/0 — no NAT. RDS only needs VPC-local routes.
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.pilot.id
  tags   = { Name = "${var.name_prefix}-private-rt-no-nat" }
}

resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# -----------------------------------------------------------------------------
# VPC endpoints — S3 (gateway) + SSM suite (interface). Replaces NAT for these.
# -----------------------------------------------------------------------------
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.pilot.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.public.id, aws_route_table.private.id]

  tags = { Name = "${var.name_prefix}-vpce-s3" }
}

resource "aws_security_group" "vpce" {
  name_prefix = "${var.name_prefix}-vpce-"
  description = "Interface VPC endpoints"
  vpc_id      = aws_vpc.pilot.id

  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.name_prefix}-vpce-sg" }
}

resource "aws_vpc_endpoint" "ssm" {
  vpc_id              = aws_vpc.pilot.id
  service_name        = "com.amazonaws.${var.aws_region}.ssm"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpce.id]
  private_dns_enabled = true
  tags                = { Name = "${var.name_prefix}-vpce-ssm" }
}

resource "aws_vpc_endpoint" "ssmmessages" {
  vpc_id              = aws_vpc.pilot.id
  service_name        = "com.amazonaws.${var.aws_region}.ssmmessages"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpce.id]
  private_dns_enabled = true
  tags                = { Name = "${var.name_prefix}-vpce-ssmmessages" }
}

resource "aws_vpc_endpoint" "ec2messages" {
  vpc_id              = aws_vpc.pilot.id
  service_name        = "com.amazonaws.${var.aws_region}.ec2messages"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpce.id]
  private_dns_enabled = true
  tags                = { Name = "${var.name_prefix}-vpce-ec2messages" }
}

# -----------------------------------------------------------------------------
# Security groups — inbound 443 + 8883 only. No SSH port (use SSM Session Manager).
# -----------------------------------------------------------------------------
resource "aws_security_group" "host" {
  name_prefix = "${var.name_prefix}-host-"
  description = "stamped-cloud + Mosquitto host — 443/8883 only"
  vpc_id      = aws_vpc.pilot.id

  ingress {
    description = "HTTPS (L6 BFF / TLS)"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_https_cidrs
  }

  ingress {
    description = "MQTTS edge uplink"
    from_port   = 8883
    to_port     = 8883
    protocol    = "tcp"
    cidr_blocks = var.allowed_mqtts_cidrs
  }

  egress {
    description = "Outbound (SSM, S3 via endpoints, package updates)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.name_prefix}-host-sg" }
}

resource "aws_security_group" "rds" {
  name_prefix = "${var.name_prefix}-rds-"
  description = "RDS reachable only from pilot host"
  vpc_id      = aws_vpc.pilot.id

  ingress {
    description     = "Postgres from host"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.host.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.name_prefix}-rds-sg" }
}

# -----------------------------------------------------------------------------
# IAM — EC2 instance profile for SSM + ECR pull + SSM Parameter read
# -----------------------------------------------------------------------------
data "aws_iam_policy_document" "ec2_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "host" {
  name_prefix        = "${var.name_prefix}-host-"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume.json
}

resource "aws_iam_role_policy_attachment" "ssm_core" {
  role       = aws_iam_role.host.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "ecr_read" {
  role       = aws_iam_role.host.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

data "aws_iam_policy_document" "ssm_params" {
  statement {
    actions   = ["ssm:GetParameter", "ssm:GetParameters", "ssm:GetParametersByPath"]
    resources = ["arn:aws:ssm:${var.aws_region}:*:parameter${local.ssm_prefix}/*"]
  }
  statement {
    actions   = ["kms:Decrypt"]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "kms:ViaService"
      values   = ["ssm.${var.aws_region}.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy" "ssm_params" {
  name   = "ssm-params"
  role   = aws_iam_role.host.id
  policy = data.aws_iam_policy_document.ssm_params.json
}

resource "aws_iam_instance_profile" "host" {
  name_prefix = "${var.name_prefix}-host-"
  role        = aws_iam_role.host.name
}

# -----------------------------------------------------------------------------
# EC2 t4g.small — public subnet, SSM only (no key pair required for scaffold)
# -----------------------------------------------------------------------------
data "aws_ssm_parameter" "al2023_arm64" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-arm64"
}

resource "aws_instance" "host" {
  ami                    = data.aws_ssm_parameter.al2023_arm64.value
  instance_type          = var.ec2_instance_type
  subnet_id              = aws_subnet.public[0].id
  vpc_security_group_ids = [aws_security_group.host.id]
  iam_instance_profile   = aws_iam_instance_profile.host.name

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
  }

  root_block_device {
    volume_size = 40
    volume_type = "gp3"
    encrypted   = true
  }

  user_data = base64encode(templatefile("${path.module}/templates/user-data.sh.tftpl", {
    name_prefix = var.name_prefix
    environment = var.environment
  }))

  tags = {
    Name = "${var.name_prefix}-host"
    Role = "stamped-cloud+mosquitto"
  }
}

resource "aws_eip" "host" {
  domain   = "vpc"
  instance = aws_instance.host.id
  tags     = { Name = "${var.name_prefix}-host-eip" }
}

# -----------------------------------------------------------------------------
# RDS db.t4g.micro placeholder (Timescale extension applied post-provision)
# -----------------------------------------------------------------------------
resource "aws_db_subnet_group" "pilot" {
  count      = var.create_rds ? 1 : 0
  name       = "${var.name_prefix}-db"
  subnet_ids = aws_subnet.private[*].id
  tags       = { Name = "${var.name_prefix}-db-subnets" }
}

resource "random_password" "db" {
  count   = var.create_rds ? 1 : 0
  length  = 32
  special = false
}

resource "aws_db_instance" "pilot" {
  count = var.create_rds ? 1 : 0

  identifier     = "${var.name_prefix}-pg"
  engine         = "postgres"
  engine_version = "16"
  instance_class = var.rds_instance_class

  allocated_storage     = 20
  max_allocated_storage = 50
  storage_encrypted     = true

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db[0].result

  db_subnet_group_name   = aws_db_subnet_group.pilot[0].name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  multi_az               = false
  skip_final_snapshot    = true
  deletion_protection    = false
  backup_retention_period = 7

  tags = {
    Name        = "${var.name_prefix}-rds"
    Placeholder = "enable-timescaledb-post-provision"
  }
}

# -----------------------------------------------------------------------------
# S3 bills + SSM parameter placeholders (values filled by human before start)
# -----------------------------------------------------------------------------
resource "aws_s3_bucket" "bills" {
  bucket = local.bills_bucket
  tags   = { Name = local.bills_bucket }
}

resource "aws_s3_bucket_public_access_block" "bills" {
  bucket                  = aws_s3_bucket.bills.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "bills" {
  bucket = aws_s3_bucket.bills.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_ssm_parameter" "placeholders" {
  for_each = toset([
    "DATABASE_URL",
    "BETTER_AUTH_SECRET",
    "L2_SERVICE_KEY",
    "L5_AUTH_TOKEN",
  ])

  name  = "${local.ssm_prefix}/${each.key}"
  type  = "SecureString"
  value = "REPLACE_BEFORE_CONTAINER_START"

  lifecycle {
    ignore_changes = [value]
  }

  tags = {
    Name = each.key
  }
}

# Explicit assertion helper for reviewers: there must be zero NAT gateways.
# (No aws_nat_gateway resources exist in this module.)
