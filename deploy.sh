#!/bin/bash
set -e

echo "🚀 Starting Full Deployment (App + Ingress)..."

# # 1. Infrastructure (Terraform)
# echo "🏗️ Applying Infrastructure (Terraform)..."
# cd terraform
# terraform init
# terraform apply -auto-approve
# cd ..

# 2. Update Kubernetes Context
echo "🔄 Updating Kubeconfig..."
aws eks update-kubeconfig --name relmonition-cluster --region ap-south-1 --force

# 3. ECR & Docker Build
echo "🐳 Preparing Container Registry..."
# Create repo if it doesn't exist
ECR_URL=$(aws ecr describe-repositories --repository-names relmonition-server --region ap-south-1 --query 'repositories[0].repositoryUri' --output text 2>/dev/null || aws ecr create-repository --repository-name relmonition-server --region ap-south-1 --query 'repository.repositoryUri' --output text)

echo "🔑 Authenticating Docker..."
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin $ECR_URL

echo "🔨 Building Docker Image..."
docker build -t relmonition-server ./server
docker tag relmonition-server:latest $ECR_URL:latest
docker push $ECR_URL:latest

# 4. Ingress Controller (Automated)
echo "🌐 Installing/Upgrading Ingress Controller..."
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx -n ingress-nginx --create-namespace

# 5. App Deployment (Helm)
echo "☸️ Deploying Relmonition App..."
kubectl create namespace couple-001 --dry-run=client -o yaml | kubectl apply -f -
helm upgrade --install couple-001 ./charts/relmonition-tenant -n couple-001 \
  --set image.repository=$ECR_URL \
  --set coupleId="001"

echo "✅ Full Deployment Successful! Your app is live."