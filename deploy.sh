#!/bin/bash
set -e

# Configuration
PROJECT="relmonition"
REGION="ap-south-1"
ECR_URL=$(aws sts get-caller-identity --query Account --output text --region $REGION).dkr.ecr.${REGION}.amazonaws.com/${PROJECT}-server

echo "🚀 Starting Full Deployment (Infrastructure + App)..."

# 1. Infrastructure (Terraform)
echo "📦 Provisioning Infrastructure..."
cd terraform
terraform init -input=false
terraform apply -auto-approve
cd ..

# 2. Container Registry (ECR)
echo "🐳 Preparing Container Registry..."
aws ecr describe-repositories --repository-names ${PROJECT}-server --region ${REGION} >/dev/null 2>&1 || \
aws ecr create-repository --repository-name ${PROJECT}-server --region ${REGION} >/dev/null

# 3. Build & Push Docker Image
echo "🔨 Building and Pushing Docker Image..."
aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ECR_URL}
docker build -t ${PROJECT}-server:latest ./server
docker tag ${PROJECT}-server:latest ${ECR_URL}:latest
docker push ${ECR_URL}:latest

# 4. Deploy to Kubernetes (Helm)
echo "☸️ Deploying to Cluster..."
aws eks update-kubeconfig --name ${PROJECT}-cluster --region ${REGION}

helm upgrade --install couple-001 charts/relmonition-tenant \
    --set coupleId="001" \
    --set image.repository=${ECR_URL} \
    --set tursoUrl="${TURSO_CONNECTION_URL}" \
    --set tursoToken="${TURSO_AUTH_TOKEN}" \
    --set geminiKey="${GEMINI_API_KEY}" \
    --namespace couple-001 \
    --create-namespace

echo "✅ Full Deployment Successful! Your app is live."
