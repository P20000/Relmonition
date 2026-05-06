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
  single_nat_gateway = true
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

  # Enable Public API Server Endpoint so we can configure EKS from outside the VPC
  cluster_endpoint_public_access = true

  # Grant administrative permissions to the IAM identity that created the cluster (required for Helm/Kubernetes providers)
  enable_cluster_creator_admin_permissions = true

  # Managed Node Groups (Scalable for any number of namespaces)
  eks_managed_node_groups = {
    tenants = {
      instance_types = ["t3.medium"]
      capacity_type  = "SPOT" # Cost-effective for multi-tenant workloads
      min_size     = 1
      max_size     = 10
      desired_size = 2

      # Use Bottlerocket for HIPAA/Security compliance
      ami_type = "BOTTLEROCKET_x86_64"
      
      labels = {
        role = "tenant-workload"
      }
    }
  }

  fargate_profiles = {
    kube_system = {
      name = "kube-system"
      selectors = [
        { namespace = "kube-system" }
      ]
    }
  }
}

# Helm Provider configured to dynamically connect to our EKS Cluster
provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
    exec {
      api_version = "client.authentication.k8s.io/v1"
      args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name]
      command     = "aws"
    }
  }
}

# Autonomously deploy the Nginx Ingress Controller
# When 'terraform destroy' is run, Terraform will uninstall this Helm release FIRST,
# which cleanly deletes the AWS Network Load Balancer (NLB) before the VPC is destroyed.
resource "helm_release" "ingress_nginx" {
  name             = "ingress-nginx"
  repository       = "https://kubernetes.github.io/ingress-nginx"
  chart            = "ingress-nginx"
  namespace        = "ingress-nginx"
  create_namespace = true

  # Ensure this is created only after Node Groups are ready,
  # and uninstalled BEFORE the cluster or nodes are destroyed.
  depends_on = [module.eks]
}
