#!/bin/bash
# Refined termination script to prevent AWS dependency violations

echo "🚀 Starting Full AWS Cleanup..."

# 1. Cleanup Kubernetes Apps
echo "☸️ Finding and deleting all active tenant Helm releases and namespaces..."
for ns in $(kubectl get namespaces -o jsonpath='{.items[*].metadata.name}' | tr ' ' '\n' | grep '^couple-'); do
  tenant_id=${ns#couple-}
  echo "🗑️ Uninstalling Helm release: couple-${tenant_id} in namespace ${ns}..."
  helm uninstall "couple-${tenant_id}" -n "${ns}" --ignore-not-found || true
  echo "🗑️ Deleting namespace: ${ns}..."
  kubectl delete namespace "${ns}" --ignore-not-found || true
done
echo "✅ Dynamic tenant cleanup complete."


# 2. Cleanup Docker images (ECR)
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