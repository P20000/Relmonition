#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# Smart Terraform Deploy Wrapper
# Automatically detects if import targets exist in AWS. If they do not, it
# disables imports.tf to allow a clean deployment.
# -----------------------------------------------------------------------------
set -e

REGION="ap-south-1"
IMPORT_FILE="imports.tf"
DISABLED_FILE="imports.tf.disabled"

# Helper to check if CLI tools exist
exists() {
  command -v "$1" >/dev/null 2>&1
}

# Default checks
RESOURCES_EXIST=true

if [ -f "$IMPORT_FILE" ]; then
  echo "🔍 Checking if referenced AWS resources exist in region '$REGION'..."

  if exists aws; then
    # Check ECR Repository
    echo "  - Checking ECR repository: relmonition-server..."
    if ! aws ecr describe-repositories --repository-names "relmonition-server" --region "$REGION" >/dev/null 2>&1; then
      echo "    ❌ ECR repository not found."
      RESOURCES_EXIST=false
    else
      echo "    ✅ ECR repository found."
    fi

    # Check KMS Key
    echo "  - Checking KMS Key: 113f0c47-8fb3-4ae7-b49c-e84eb63a90bf..."
    if ! aws kms describe-key --key-id "113f0c47-8fb3-4ae7-b49c-e84eb63a90bf" --region "$REGION" >/dev/null 2>&1; then
      echo "    ❌ KMS Key not found."
      RESOURCES_EXIST=false
    else
      echo "    ✅ KMS Key found."
    fi
  else
    echo "⚠️  AWS CLI not found. Assuming resources do not exist for safety."
    RESOURCES_EXIST=false
  fi

  if [ "$RESOURCES_EXIST" = "false" ]; then
    echo "🚫 Import resources are missing. Disabling '$IMPORT_FILE' for a clean deploy..."
    mv "$IMPORT_FILE" "$DISABLED_FILE"
  else
    echo "📦 All import resources found. Retaining '$IMPORT_FILE' for adoption..."
  fi
else
  # If imports.tf is already disabled, see if resources now exist (to re-enable it)
  if [ -f "$DISABLED_FILE" ]; then
    echo "ℹ️  '$IMPORT_FILE' is currently disabled. Checking if it needs to be restored..."
    
    if exists aws; then
      if aws kms describe-key --key-id "113f0c47-8fb3-4ae7-b49c-e84eb63a90bf" --region "$REGION" >/dev/null 2>&1; then
        echo "🔄 Existing resources detected! Re-enabling '$IMPORT_FILE'..."
        mv "$DISABLED_FILE" "$IMPORT_FILE"
      else
        echo "👍 No active resources found. Continuing with clean deployment configuration."
      fi
    fi
  fi
fi

# Run Terraform plan / apply
echo "🚀 Running terraform apply..."
terraform apply -auto-approve
