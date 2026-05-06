#!/bin/bash
set -e

echo "🚀 Starting Deployment (Backend)..."

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
echo "☸️ Deploying Relmonition App for tenant 001..."
# Create namespace with proper compliance metadata
kubectl create namespace couple-001 --dry-run=client -o yaml | \
  kubectl label -f - compliance-tier=hipaa-gdpr encryption-required=true --local -o yaml | \
  kubectl apply -f -

# Explicitly setting all variables
helm upgrade --install couple-001 ./charts/relmonition-tenant -n couple-001 \
  --set image.repository=$ECR_URL \
  --set image.tag=latest \
  --set coupleId="001" \
  --set turso.connectionUrl="${TURSO_CONNECTION_URL}" \
  --set turso.authToken="${TURSO_AUTH_TOKEN}"

echo "✅ Backend Deployment Successful!"
