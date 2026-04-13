terraform {
  backend "s3" {
    bucket         = "relmonition-terraform-state-prod"
    key            = "prod/eks-cluster.tfstate"
    region         = "ap-south-1"
    encrypt        = true
    dynamodb_table = "relmonition-terraform-lock"
  }
}
