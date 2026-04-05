#!/bin/bash
set -e # Exit on any error

export AWS_REGION="ap-south-1"
export AWS_DEFAULT_REGION="ap-south-1"
# Configuration
PROJECT="relmonition"
REGION="ap-south-1"
ECR_URL=$(aws sts get-caller-identity --query Account --output text).dkr.ecr.${REGION}.amazonaws.com/${PROJECT}-server

echo "🚀 Starting Full Deployment for ${PROJECT}..."

# 1. Infrastructure (Terraform)
echo "📦 Provisioning Infrastructure..."
cd terraform
terraform init -input=false
terraform apply -auto-approve
cd ..

# 2. Container Registry (ECR)
echo "🐳 Preparing Container Registry..."
aws ecr describe-repositories --repository-names ${PROJECT}-server >/dev/null 2>&1 || \
aws ecr create-repository --repository-name ${PROJECT}-server >/dev/null

# 3. Build & Push
echo "🔨 Building Docker Image..."
aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ECR_URL}
docker build -t ${PROJECT}-server:latest ./server
docker tag ${PROJECT}-server:latest ${ECR_URL}:latest
docker push ${ECR_URL}:latest

# 4. Deploy to Kubernetes
echo "☸️ Deploying to Cluster..."
aws eks update-kubeconfig --name ${PROJECT}-cluster --region ${REGION}

# Create namespace if it doesn't exist (assuming couple-001 for now)
kubectl create namespace couple-001 --dry-run=client -o yaml | kubectl apply -f -

# Deploy via Helm
helm upgrade --install couple-001 charts/relmonition-tenant \
    --set coupleId=001 \
    --set image.repository=${ECR_URL} \
    --namespace couple-001

echo "✅ Deployment Successful! Your app is live."