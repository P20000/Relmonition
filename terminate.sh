#!/bin/bash
# Remove "set -e" so the script doesn't stop on the first error

echo "🚀 Starting Full AWS Cleanup..."

# 1. Cleanup Kubernetes (Don't stop if it fails)
echo "☸️ Attempting Kubernetes cleanup..."
helm uninstall couple-001 -n couple-001 --ignore-not-found || true
kubectl delete namespace couple-001 --ignore-not-found || true

# 2. Cleanup Docker images
echo "🐳 Removing Docker Images from ECR..."
aws ecr delete-repository --repository-name relmonition-server --force --region ap-south-1 || true

# 3. Destroy Infrastructure (Terraform)
echo "🔥 Destroying Infrastructure (Terraform)..."
cd terraform
terraform destroy -auto-approve
cd ..

echo "✅ AWS account has been cleaned."