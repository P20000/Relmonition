import { TenantDatabaseManager } from '../tenant-manager';
import * as schema from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config();

const tenantManager = new TenantDatabaseManager();

async function checkData() {
  const { client: globalClient } = tenantManager.getGlobalClient();
  const tenants = await globalClient.select().from(schema.tenants);

  if (tenants.length === 0) {
    console.log("No tenants found.");
    return;
  }
  
  const tenantId = tenants[0].id; // Just check the first tenant
  console.log(`Checking data for tenant: ${tenants[0].name || tenantId}`);

  const { client: db } = await tenantManager.getDatabaseClient(tenantId);

  // Get Journal Entries
  console.log("--- Journal Entries ---");
  const journals = await db.select().from(schema.journalEntries)
    .where(eq(schema.journalEntries.tenantId, tenantId))
    .orderBy(desc(schema.journalEntries.date))
    .limit(10);
  
  journals.forEach(j => {
    console.log(`Date: ${j.date}, Mood: ${j.sentimentScore}, Bids/Repairs indirectly stored.. Content: ${j.content.slice(0, 50)}...`);
  });

  // Get Interaction Metrics
  console.log("\n--- Interaction Metrics (For interaction trends plot) ---");
  const metrics = await db.select().from(schema.interactionMetrics)
    .where(eq(schema.interactionMetrics.tenantId, tenantId))
    .orderBy(desc(schema.interactionMetrics.date))
    .limit(10);
    
  metrics.forEach(m => {
    console.log(`Date: ${m.date}, Bids: ${m.bidsCount}, Repairs: ${m.repairsCount}, Pos/Neg: ${m.positiveCount}/${m.negativeCount}, Entries: ${m.totalEntries}`);
  });

  process.exit(0);
}

checkData().catch(console.error);
