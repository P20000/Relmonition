terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-south-1"
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"

  name = "relmonition-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["ap-south-1a", "ap-south-1b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = true
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.8" 

  cluster_name    = "relmonition-cluster"
  cluster_version = "1.30"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  cluster_endpoint_public_access = true

  eks_managed_node_groups = {
    general = {
      min_size     = 1
      max_size     = 2
      desired_size = 1
      instance_types = ["t3.medium"]
    }
  }
}


# 1. Register the IAM user as an Access Entry in the EKS cluster
resource "aws_eks_access_entry" "ci_cd_admin" {
  cluster_name      = module.eks.cluster_name
  principal_arn     = "arn:aws:iam::982534376726:user/DEV-user-alpha"
  type              = "STANDARD"
}

# 2. Associate the Admin Policy with that Access Entry
resource "aws_eks_access_policy_association" "ci_cd_admin_policy" {
  cluster_name  = module.eks.cluster_name
  principal_arn = aws_eks_access_entry.ci_cd_admin.principal_arn
  
  # This policy grants equivalent permissions to 'system:masters'
  policy_arn    = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"

  access_scope {
    type = "cluster"
  }
}