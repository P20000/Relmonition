#!/bin/bash
# Exit immediately if a command exits with a non-zero status
set -e

# Accept tenant ID as first argument
TENANT_ID="${1}"

if [[ -z "${TENANT_ID}" ]]; then
  echo "❌ Error: Tenant ID is required for undeployment."
  exit 1
fi

echo "🗑️ Starting Undeployment (Backend) for Tenant: ${TENANT_ID}..."

# 1. Update Kubernetes Context (if not already done by CI)
if [[ -z "$GITHUB_ACTIONS" ]]; then
  echo "🔄 Updating Kubeconfig..."
  aws eks update-kubeconfig --name relmonition-cluster --region ap-south-1 || echo "⚠️ Warning: Failed to update kubeconfig. Continuing..."
fi

NAMESPACE="couple-${TENANT_ID}"

# 2. Uninstall Helm release
echo "☸️ Uninstalling Helm release couple-${TENANT_ID} from namespace ${NAMESPACE}..."
if helm status "couple-${TENANT_ID}" -n "${NAMESPACE}" >/dev/null 2>&1; then
  helm uninstall "couple-${TENANT_ID}" -n "${NAMESPACE}"
  echo "✅ Helm release couple-${TENANT_ID} uninstalled."
else
  echo "ℹ️ Helm release couple-${TENANT_ID} not found or already deleted."
fi

# 3. Delete Kubernetes namespace
echo "☸️ Deleting Kubernetes namespace ${NAMESPACE}..."
if kubectl get namespace "${NAMESPACE}" >/dev/null 2>&1; then
  kubectl delete namespace "${NAMESPACE}" --wait=false
  echo "✅ Namespace ${NAMESPACE} deletion initiated."
else
  echo "ℹ️ Namespace ${NAMESPACE} not found or already deleted."
fi

echo "✅ Backend Undeployment Successful for tenant ${TENANT_ID}!"
