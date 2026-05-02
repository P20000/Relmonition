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

# 3. Ingress Controller (Ensure it exists)
echo "🌐 Checking Ingress Controller..."
if ! helm list -n ingress-nginx | grep -q ingress-nginx; then
  echo "Installing Ingress Controller..."
  helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
  helm repo update
  helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx -n ingress-nginx --create-namespace
fi

# 4. App Deployment (Helm)
echo "☸️ Deploying Relmonition App for tenant 001..."
kubectl create namespace couple-001 --dry-run=client -o yaml | kubectl apply -f -

# Explicitly setting all variables
helm upgrade --install couple-001 ./charts/relmonition-tenant -n couple-001 \
  --set image.repository=$ECR_URL \
  --set image.tag=latest \
  --set coupleId="001" \
  --set turso.connectionUrl="${TURSO_CONNECTION_URL}" \
  --set turso.authToken="${TURSO_AUTH_TOKEN}"

echo "✅ Backend Deployment Successful!"
