terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Configure a remote backend before any human apply.
  # backend "s3" {}
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "stamped-pilot"
      Environment = var.environment
      ManagedBy   = "terraform"
      # Subagent-authored; human must review plan before apply.
      ApplyPolicy = "human-only"
    }
  }
}
