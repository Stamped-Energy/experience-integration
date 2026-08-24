variable "aws_region" {
  type        = string
  description = "AWS region for the pilot stack."
  default     = "ap-south-1"
}

variable "environment" {
  type        = string
  description = "Environment name (e.g. pilot, staging)."
  default     = "pilot"
}

variable "name_prefix" {
  type        = string
  description = "Resource name prefix."
  default     = "stamped-pilot"
}

variable "vpc_cidr" {
  type        = string
  default     = "10.42.0.0/16"
}

variable "public_subnet_cidrs" {
  type        = list(string)
  description = "Public subnet CIDRs (one per AZ). NO NAT Gateway."
  default     = ["10.42.0.0/24", "10.42.1.0/24"]
}

variable "private_subnet_cidrs" {
  type        = list(string)
  description = "Private subnets for RDS only (no NAT — intra-VPC traffic only)."
  default     = ["10.42.10.0/24", "10.42.11.0/24"]
}

variable "ssh_ingress_cidrs" {
  type        = list(string)
  description = "Unused — SSH is SSM-only. Kept for documentation."
  default     = []
}

variable "allowed_https_cidrs" {
  type        = list(string)
  description = "CIDRs allowed to reach HTTPS :443 (BFF / UI)."
  default     = ["0.0.0.0/0"]
}

variable "allowed_mqtts_cidrs" {
  type        = list(string)
  description = "CIDRs allowed to reach MQTTS :8883 (edge uplink)."
  default     = ["0.0.0.0/0"]
}

variable "ec2_instance_type" {
  type        = string
  description = "Pilot host — Graviton."
  default     = "t4g.small"
}

variable "rds_instance_class" {
  type        = string
  description = "RDS placeholder — Timescale via custom parameter group later."
  default     = "db.t4g.micro"
}

variable "db_name" {
  type    = string
  default = "stamped"
}

variable "db_username" {
  type    = string
  default = "stamped"
}

variable "create_rds" {
  type        = bool
  description = "Set false to skip RDS while validating network-only plans."
  default     = true
}

variable "bills_bucket_name" {
  type        = string
  description = "Optional override; leave empty to auto-name."
  default     = ""
}
