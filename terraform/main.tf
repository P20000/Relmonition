provider "aws" {
  region = "ap-south-1"
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"
  name    = "relmonition-vpc"
  cidr    = "10.0.0.0/16"
  azs             = ["ap-south-1a", "ap-south-1b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]
  enable_nat_gateway = true
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.8" 
  cluster_name    = "relmonition-cluster"
  cluster_version = "1.30"
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnets

  # HIPAA Compliance: Enable Logs
  cluster_enabled_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  # Enable Secret Encryption with our KMS Key (defined in kms.tf)
  cluster_encryption_config = {
    resources        = ["secrets"]
    provider_key_arn = aws_kms_key.eks_secrets.arn
  }

  # IAM Role for Service Accounts (IRSA)
  enable_irsa = true

  fargate_profiles = {
    kube_system = {
      name = "kube-system"
      selectors = [
        { namespace = "kube-system" }
      ]
    }
    # Main profile for tenant applications
    # For now, we specify the namespaces explicitly or use a common one
    tenants = {
      name = "tenants"
      selectors = [
        { namespace = "couple-001" },
        { namespace = "shared-services" },
        { namespace = "default" }
      ]
    }
  }
}
