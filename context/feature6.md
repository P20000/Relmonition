# Automatic Tenant Redeployment (Self-Healing) Plan

Enable the system to automatically detect and recreate Kubernetes namespaces and pods for existing active tenants when the EKS cluster is redeployed.

## Proposed Design

Currently, tenant pods are provisioned asynchronously by the `relmonition-worker` (running inside the `couple-001` control-plane namespace). The worker polls the global database (external to EKS on Turso) for tenants in `'provisioning'` status and runs `deploy.sh <tenant_id>`.

To automate redeployment when the cluster is destroyed and recreated:
1. When the cluster is redeployed, the user brings up the core control-plane tenant (`001`) via `./deploy.sh 001`. This starts the `relmonition-worker`.
2. Upon startup, before entering its polling loop, the worker will run a **self-healing sync check**:
   - Check if `kubectl` is available and has connection to the API server (e.g., by checking the `kube-system` namespace).
   - If reachable, query all existing Kubernetes namespaces starting with `couple-`.
   - Query the global database for all active, processing, or failed tenants that are not soft-deleted (`deletedAt is null`) and not already queueing (`status != 'provisioning'`).
   - If any of these tenants are missing their respective namespaces in the cluster (e.g., `couple-<tenant_id>` is missing), automatically update their status back to `'provisioning'` and reset `provisioningAttempts = 0`.
   - The worker's standard asynchronous polling loop will then pick up these tenants and run `deploy.sh` for each, cleanly and sequentially recreating their workloads.

---

## Proposed Changes

### Backend Worker

#### [MODIFY] [worker.ts](file:///run/media/pranavissam/files%20and%20data/programming/mega%20projects/Relmonition/server/src/worker.ts)
- Add a helper to run commands synchronously or asynchronously using `exec`.
- Add `syncTenantDeployments()` that:
  - Validates `kubectl` connectivity.
  - Lists all `couple-` namespaces from the cluster.
  - Checks if any active database tenants are missing from the cluster.
  - Resets missing tenants' status to `'provisioning'` with attempts reset to `0`.
- Invoke `syncTenantDeployments()` at the start of the `main()` function before starting the infinite polling loop.

---

## Verification Plan

### Automated/Manual Verification
1. Run the database seed scripts to ensure some active tenants exist.
2. Simulate a deleted tenant namespace: run `kubectl delete namespace couple-XXX` for an existing tenant (but leave their status as `'active'` in the database).
3. Restart the worker.
4. Verify that the worker logs detect the missing namespace, reset the status to `'provisioning'`, and automatically run `deploy.sh` to redeploy the tenant pods.
