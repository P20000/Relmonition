#!/bin/bash
# Refined termination script to prevent AWS dependency violations

echo "🚀 Starting Full AWS Cleanup..."

# 1. Cleanup Kubernetes Apps
echo "☸️ Attempting Kubernetes app cleanup..."
helm uninstall couple-001 -n couple-001 --ignore-not-found || true
kubectl delete namespace couple-001 --ignore-not-found || true

# 2. Cleanup Ingress Controller (CRITICAL)
echo "🌐 Removing Ingress Controller..."
helm uninstall ingress-nginx -n ingress-nginx --ignore-not-found || true
kubectl delete namespace ingress-nginx --ignore-not-found || true

# 3. Cleanup Docker images (ECR)
echo "🐳 Removing Docker Images from ECR..."
aws ecr delete-repository --repository-name relmonition-server --force --region ap-south-1 || true

# 4. Destroy Infrastructure (Terraform)
echo "🔥 Destroying Infrastructure (Terraform)..."
cd terraform
# Ensure state is refreshed and destroyed in order
terraform init
terraform destroy -auto-approve
cd ..

echo "✅ AWS cleanup complete."