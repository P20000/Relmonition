output "ecr_repository_url" {
  description = "The URL of the ECR repository"
  value       = aws_ecr_repository.server.repository_url
}

output "eks_cluster_name" {
  description = "The name of the EKS cluster"
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "The endpoint for the EKS cluster"
  value       = module.eks.cluster_endpoint
}

output "ingress_load_balancer_hostname" {
  description = "The hostname of the load balancer created by the ingress controller"
  value       = data.kubernetes_service.ingress_nginx.status[0].load_balancer[0].ingress[0].hostname
}

