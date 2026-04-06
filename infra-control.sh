#!/bin/bash
set -e

# This script simplifies your infrastructure management.
# It initializes and applies your Terraform configuration in one go.

echo "🚀 Starting Infrastructure Provisioning..."

cd terraform

echo "🔄 Initializing Terraform..."
terraform init -input=false

echo "🚀 Applying Infrastructure changes..."
terraform apply -auto-approve

echo "✅ Infrastructure Provisioning Complete!"
