import { TenantDatabaseManager } from '../tenant-manager';
import * as schema from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { processJournalMetrics } from '../services/ai/metrics-service';

const tenantManager = new TenantDatabaseManager();

/**
 * Backfills metrics for all existing journal entries for a given tenant.
 * Useful when the metrics system is first implemented or updated.
 */
export async function backfillTenantMetrics(tenantId: string) {
  console.log(`[Backfill] Starting metrics backfill for tenant: ${tenantId}`);
  
  const { client: db } = await tenantManager.getDatabaseClient(tenantId);
  
  // 1. Fetch all journal entries for this tenant (oldest first to build historical daily metrics correctly)
  const entries = await db.select()
    .from(schema.journalEntries)
    .where(eq(schema.journalEntries.tenantId, tenantId))
    .orderBy(schema.journalEntries.createdAt);

  console.log(`[Backfill] Found ${entries.length} entries to process.`);

  for (const entry of entries) {
    try {
      console.log(`[Backfill] Processing entry ${entry.id} (${entry.createdAt.toDateString()})...`);
      await processJournalMetrics(tenantId, entry.id, entry.content);
    } catch (err) {
      console.error(`[Backfill] Failed to process entry ${entry.id}:`, err);
    }
  }

  console.log(`[Backfill] Completed backfill for tenant: ${tenantId}`);
}

/**
 * Global backfill for all tenants.
 */
export async function backfillAllTenants() {
  const { client: globalDb } = tenantManager.getGlobalClient();
  const tenants = await globalDb.select().from(schema.tenants);
  
  console.log(`[Backfill] Starting global backfill for ${tenants.length} tenants.`);
  
  for (const t of tenants) {
    await backfillTenantMetrics(t.id);
  }
  
  console.log(`[Backfill] Global backfill complete.`);
}
