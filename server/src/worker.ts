import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './db/schema';
import { eq, and, isNull, lt, ne } from 'drizzle-orm';
import { spawn, exec } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

const url = process.env.TURSO_CONNECTION_URL || process.env.TURSO_API_URL;
const authToken = process.env.TURSO_AUTH_TOKEN || process.env.TURSO_API_TOKEN;

if (!url) {
  console.error('[Worker] Error: TURSO_CONNECTION_URL or TURSO_API_URL is required.');
  process.exit(1);
}

const client = createClient({ url, authToken });
const db = drizzle(client, { schema });

const MAX_ATTEMPTS = 3;
const POLL_INTERVAL_MS = 5000;

// Execute deployment command asynchronously
function runDeployment(tenantId: string): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve) => {
    console.log(`[Worker] Starting deployment process for tenant ${tenantId}...`);
    
    // Resolve relative path to root deploy.sh script
    const scriptPath = path.join(__dirname, '../../deploy.sh');
    
    // Spawn script execution
    const child = spawn('bash', [scriptPath, tenantId], {
      env: {
        ...process.env,
        // Make sure EKS details map correctly if needed
        TURSO_CONNECTION_URL: process.env.TURSO_CONNECTION_URL || process.env.TURSO_API_URL,
        TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN || process.env.TURSO_API_TOKEN,
      },
    });

    let output = '';

    child.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(`[deploy.sh:${tenantId}] ${text}`);
    });

    child.stderr.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stderr.write(`[deploy.sh:${tenantId}-err] ${text}`);
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`[Worker] Deployment successful for tenant ${tenantId}`);
        resolve({ success: true, output });
      } else {
        console.error(`[Worker] Deployment failed for tenant ${tenantId} with exit code ${code}`);
        resolve({ success: false, output });
      }
    });

    child.on('error', (err) => {
      console.error(`[Worker] Failed to start deployment process for tenant ${tenantId}:`, err);
      resolve({ success: false, output: err.message });
    });
  });
}

// Main polling loop
async function pollAndProcess() {
  try {
    // Find next tenant awaiting provisioning
    const pendingTenants = await db
      .select()
      .from(schema.tenants)
      .where(
        and(
          eq(schema.tenants.status, 'provisioning'),
          isNull(schema.tenants.deletedAt),
          lt(schema.tenants.provisioningAttempts, MAX_ATTEMPTS)
        )
      )
      .limit(1);

    if (pendingTenants.length === 0) {
      return;
    }

    const tenant = pendingTenants[0];
    const newAttemptCount = (tenant.provisioningAttempts || 0) + 1;
    console.log(`[Worker] Found pending tenant ${tenant.id}. Processing attempt ${newAttemptCount}/${MAX_ATTEMPTS}...`);

    // Lock the tenant row immediately to prevent duplicate runs
    await db
      .update(schema.tenants)
      .set({
        status: 'processing',
        provisioningAttempts: newAttemptCount,
      })
      .where(eq(schema.tenants.id, tenant.id));

    // Execute deployment
    const result = await runDeployment(tenant.id);

    if (result.success) {
      // Mark active on success
      await db
        .update(schema.tenants)
        .set({
          status: 'active',
          provisioningError: null,
        })
        .where(eq(schema.tenants.id, tenant.id));
      console.log(`[Worker] Promoted tenant ${tenant.id} to active.`);
    } else {
      // Handle failures
      if (newAttemptCount < MAX_ATTEMPTS) {
        // Reset to pending for retry
        await db
          .update(schema.tenants)
          .set({
            status: 'provisioning',
            provisioningError: result.output,
          })
          .where(eq(schema.tenants.id, tenant.id));
        console.log(`[Worker] Queued tenant ${tenant.id} for retry.`);
      } else {
        // Mark failed permanently
        await db
          .update(schema.tenants)
          .set({
            status: 'failed',
            provisioningError: result.output,
          })
          .where(eq(schema.tenants.id, tenant.id));
        console.log(`[Worker] Tenant ${tenant.id} has failed all provisioning attempts.`);
      }
    }
  } catch (error) {
    console.error('[Worker] Loop error:', error);
  }
}

// Helper to execute terminal commands
function runCommand(cmd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

// Check if active database tenants are missing their K8s deployment
async function syncTenantDeployments() {
  console.log('[Worker-Sync] Checking for missing tenant deployments in the Kubernetes cluster...');
  try {
    // 1. Verify kubectl connectivity and authentication
    try {
      await runCommand('kubectl get namespace kube-system');
    } catch (err: any) {
      console.warn(`[Worker-Sync] Kubernetes cluster is unreachable or kubectl is not configured: ${err.message}. Skipping deployment sync.`);
      return;
    }

    // 2. Fetch all existing namespaces starting with 'couple-'
    const stdout = await runCommand("kubectl get namespaces -o jsonpath='{.items[*].metadata.name}'");
    const namespaces = stdout.split(/\s+/).filter((ns) => ns.trim().startsWith('couple-'));
    const deployedTenantIds = new Set(namespaces.map((ns) => ns.trim().replace('couple-', '')));

    console.log(`[Worker-Sync] Found ${deployedTenantIds.size} tenant namespaces deployed in cluster:`, Array.from(deployedTenantIds));

    // 3. Query all non-deleted, non-provisioning tenants from global DB
    const tenantsToCheck = await db
      .select()
      .from(schema.tenants)
      .where(
        and(
          isNull(schema.tenants.deletedAt),
          ne(schema.tenants.status, 'provisioning')
        )
      );

    const missingTenants = tenantsToCheck.filter((t) => !deployedTenantIds.has(t.id));

    if (missingTenants.length === 0) {
      console.log('[Worker-Sync] All existing tenants are properly deployed.');
      return;
    }

    console.log(`[Worker-Sync] Found ${missingTenants.length} tenants missing from the cluster. Resetting to 'provisioning' to trigger redeployment...`);

    for (const tenant of missingTenants) {
      console.log(`[Worker-Sync] Queueing redeployment for tenant ${tenant.id} (previous status: ${tenant.status})`);
      await db
        .update(schema.tenants)
        .set({
          status: 'provisioning',
          provisioningAttempts: 0,
          provisioningError: 'Detected missing deployment in cluster (self-healing triggered)',
        })
        .where(eq(schema.tenants.id, tenant.id));
    }
    console.log('[Worker-Sync] Tenant deployment sync complete. The provisioning loop will now redeploy them.');
  } catch (error: any) {
    console.error('[Worker-Sync] Error syncing tenant deployments:', error);
  }
}

// Start worker loop
async function main() {
  console.log('[Worker] Relmonition Provisioning Worker started.');

  // Self-healing check on startup: redeploy any active tenants missing their namespace/pods
  await syncTenantDeployments();

  console.log(`[Worker] Polling database every ${POLL_INTERVAL_MS / 1000}s for new tenants...`);

  while (true) {
    await pollAndProcess();
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

main().catch((err) => {
  console.error('[Worker] Fatal error:', err);
  process.exit(1);
});
