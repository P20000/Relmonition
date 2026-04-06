#!/bin/bash
set -e

# Configuration
cd terraform

case "$1" in
    init)
        echo "🔄 Initializing Terraform..."
        terraform init
        ;;
    plan)
        echo "📋 Planning Infrastructure changes..."
        terraform plan
        ;;
    apply)
        echo "🚀 Applying Infrastructure changes..."
        terraform apply -auto-approve
        ;;
    *)
        echo "Usage: ./infra-control.sh {init|plan|apply}"
        echo "  init  : Initialize terraform"
        echo "  plan  : Preview infrastructure changes"
        echo "  apply : Apply infrastructure changes"
        exit 1
        ;;
esac