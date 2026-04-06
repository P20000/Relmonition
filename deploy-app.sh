#!/bin/bash
set -e

# Configuration
PROJECT="relmonition"
REGION="ap-south-1"
ECR_URL=$(aws sts get-caller-identity --query Account --output text --region $REGION).dkr.ecr.${REGION}.amazonaws.com/${PROJECT}-server

echo "🚀 Starting App-Only Deployment..."

# 1. Container Registry & Docker (Push image)
echo "🐳 Building and Pushing Docker Image..."

# Ensure the repository exists before pushing
aws ecr describe-repositories --repository-names ${PROJECT}-server --region ${REGION} >/dev/null 2>&1 || \
aws ecr create-repository --repository-name ${PROJECT}-server --region ${REGION}

aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ECR_URL}

docker build -t ${PROJECT}-server:latest ./server
docker tag ${PROJECT}-server:latest ${ECR_URL}:latest
docker push ${ECR_URL}:latest

# 2. Deploy to Kubernetes
echo "☸️ Deploying to Cluster via Helm..."
aws eks update-kubeconfig --name ${PROJECT}-cluster --region ${REGION}
helm upgrade --install couple-001 charts/relmonition-tenant \
    --set coupleId="001" \
    --set image.repository=${ECR_URL} \
    --namespace couple-001 \
    --create-namespace

echo "✅ App Deployment Successful!"