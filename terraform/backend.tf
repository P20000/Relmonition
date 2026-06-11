terraform {
  backend "s3" {
    bucket         = "relmonition-terraform-state-prod"
    key            = "prod/eks-cluster.tfstate"
    region         = "ap-south-1"
    encrypt        = true
  }

  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.30.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.17.0"
    }
  }
}
