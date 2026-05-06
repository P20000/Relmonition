terraform {
  backend "s3" {
    bucket         = "relmonition-terraform-state-prod"
    key            = "prod/eks-cluster.tfstate"
    region         = "ap-south-1"
    encrypt        = true
    use_lockfile   = true
  }

  required_providers {
    helm = {
      source  = "hashicorp/helm"
      version = "~> 3.1.0"
    }
  }
}
