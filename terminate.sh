#!/bin/bash
set -e

echo "⚠️  WARNING: This will permanently DELETE all infrastructure, ECR images, and Kubernetes resources."
read -p "Are you absolutely sure you want to terminate the entire backend? (y/N) " confirm

if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "Termination aborted."
    exit 1
fi

echo "🚀 Starting Full Termination..."

# 1. Cleanup Kubernetes Resources
echo "☸️ Removing Kubernetes resources..."
helm uninstall couple-001 -n couple-001 --ignore-not-found
kubectl delete namespace couple-001 --ignore-not-found

# 2. Cleanup Docker Images (Optional)
echo "🐳 Removing Docker Images from ECR..."
aws ecr delete-repository --repository-name relmonition-server --force --region ap-south-1 || true

# 3. Destroy Infrastructure (Terraform)
echo "🔥 Destroying Infrastructure (Terraform)..."
cd terraform
terraform destroy -auto-approve
cd ..

echo "✅ Termination Complete. AWS account is clean."