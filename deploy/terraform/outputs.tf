output "vpc_id" {
  value = aws_vpc.pilot.id
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}

output "host_instance_id" {
  value = aws_instance.host.id
}

output "host_public_ip" {
  value = aws_eip.host.public_ip
}

output "host_security_group_id" {
  value = aws_security_group.host.id
}

output "rds_endpoint" {
  value     = var.create_rds ? aws_db_instance.pilot[0].address : null
  sensitive = false
}

output "bills_bucket" {
  value = aws_s3_bucket.bills.bucket
}

output "ssm_parameter_prefix" {
  value = local.ssm_prefix
}

output "no_nat_gateway" {
  description = "Human review gate: must remain true. This stack never creates aws_nat_gateway."
  value       = true
}

output "allowed_inbound_ports" {
  description = "Only 443 and 8883 are admitted on the host SG."
  value       = [443, 8883]
}
