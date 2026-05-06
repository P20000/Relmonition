#!/bin/bash
set -e

# Accept tenant ID as first argument, default to 001
TENANT_ID="${1:-001}"

echo "🚀 Starting Deployment (Backend) for Tenant: ${TENANT_ID}..."

# 1. Update Kubernetes Context (if not already done by CI)
if [[ -z "$GITHUB_ACTIONS" ]]; then
  echo "🔄 Updating Kubeconfig..."
  aws eks update-kubeconfig --name relmonition-cluster --region ap-south-1
fi

# 2. ECR Registry URL
if [[ -z "$ECR_REGISTRY" ]]; then
  echo "🔍 Fetching ECR Registry URL..."
  ECR_URL=$(aws ecr describe-repositories --repository-names relmonition-server --region ap-south-1 --query 'repositories[0].repositoryUri' --output text)
else
  ECR_URL="$ECR_REGISTRY/relmonition-server"
fi


# 3. App Deployment (Helm)
echo "☸️ Deploying Relmonition App for tenant ${TENANT_ID}..."
NAMESPACE="couple-${TENANT_ID}"

# Create namespace with proper compliance metadata
kubectl create namespace "${NAMESPACE}" --dry-run=client -o yaml | \
  kubectl label -f - compliance-tier=hipaa-gdpr encryption-required=true --local -o yaml | \
  kubectl apply -f -

# Explicitly setting all variables
helm upgrade --install "couple-${TENANT_ID}" ./charts/relmonition-tenant -n "${NAMESPACE}" \
  --set image.repository=$ECR_URL \
  --set image.tag=latest \
  --set coupleId="${TENANT_ID}" \
  --set turso.connectionUrl="${TURSO_CONNECTION_URL}" \
  --set turso.authToken="${TURSO_AUTH_TOKEN}"

echo "✅ Backend Deployment Successful for tenant ${TENANT_ID}!"
