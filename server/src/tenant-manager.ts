import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as dbSchema from './db/schema';
import { eq } from 'drizzle-orm';

export class TenantDatabaseManager {
  private globalClient: ReturnType<typeof drizzle> | null = null;
  private globalDbUrl: string = '';
  private globalDbToken: string = '';
  
  // Cache for dedicated tenant clients to avoid re-instantiating constantly
  private dedicatedClients: Map<string, ReturnType<typeof drizzle>> = new Map();

  constructor() {}

  /**
   * Gets the Global Database client (where users, auth, and tenants mapping exist)
   */
  getGlobalClient(): { dbUrl: string; client: ReturnType<typeof drizzle> } {
    if (!this.globalClient) {
      this.globalDbUrl = process.env.TURSO_CONNECTION_URL || process.env.TURSO_API_URL || '';
      this.globalDbToken = process.env.TURSO_AUTH_TOKEN || process.env.TURSO_API_TOKEN || '';

      if (!this.globalDbUrl) {
          throw new Error("Cannot connect to DB: Missing database URL configuration in env");
      }

      console.log(`[Database] Initializing Global Drizzle client`);
      const client = createClient({
        url: this.globalDbUrl,
        authToken: this.globalDbToken,
      });

      this.globalClient = drizzle(client, { schema: dbSchema });
    }
    return { dbUrl: this.globalDbUrl, client: this.globalClient };
  }

  /**
   * Gets the database client specifically for a tenant context.
   * Resolves whether to use the global row-level DB fallback or an isolated Turso DB.
   */
  async getDatabaseClient(tenantId: string): Promise<{
    dbUrl: string;
    client: ReturnType<typeof drizzle>;
  }> {
    const { client: globalClient, dbUrl: globalDbUrl } = this.getGlobalClient();

    // 1. Lookup tenant metadata
    const tenantRecords = await globalClient
      .select({ tenantDbUrl: dbSchema.tenants.tenantDbUrl })
      .from(dbSchema.tenants)
      .where(eq(dbSchema.tenants.id, tenantId))
      .limit(1);

    const tenantDbUrl = tenantRecords[0]?.tenantDbUrl;

    // 2. Context switch: Isolated Tenant DB vs Row-Level Global DB
    if (tenantDbUrl) {
      console.log(`[Database] Context Switch: Isolated DB for tenant ${tenantId}`);
      
      if (this.dedicatedClients.has(tenantId)) {
        return { dbUrl: tenantDbUrl, client: this.dedicatedClients.get(tenantId)! };
      }

      const client = createClient({
        url: tenantDbUrl,
        authToken: this.globalDbToken, // Assuming same org wide token for child DBs, or fetch specific token
      });
      const dedicatedClient = drizzle(client, { schema: dbSchema });
      this.dedicatedClients.set(tenantId, dedicatedClient);
      
      return { dbUrl: tenantDbUrl, client: dedicatedClient };
    }

    // Fallback: Hybrid Migration State (Row-Level logic on Global DB)
    console.log(`[Database] Context Switch: Row-Level Global DB for tenant ${tenantId}`);
    return {
      dbUrl: globalDbUrl,
      client: globalClient,
    };
  }

  async deleteTursoDatabase(tenantId: string): Promise<void> {
    console.log(`[Turso] Deleting shared DB records for tenant: ${tenantId}`);
    const { client } = await this.getDatabaseClient(tenantId);
    
    // Cascading delete for row-level isolation
    await client.delete(dbSchema.journalEntries).where(eq(dbSchema.journalEntries.tenantId, tenantId));
    await client.delete(dbSchema.moodLogs).where(eq(dbSchema.moodLogs.tenantId, tenantId));
    await client.delete(dbSchema.interactionMetrics).where(eq(dbSchema.interactionMetrics.tenantId, tenantId));
    await client.delete(dbSchema.aiInsights).where(eq(dbSchema.aiInsights.tenantId, tenantId));
    await client.delete(dbSchema.embeddings).where(eq(dbSchema.embeddings.tenantId, tenantId));
    
    // Remove tenant mappings
    const globalClient = this.getGlobalClient().client;
    await globalClient.delete(dbSchema.tenantMembers).where(eq(dbSchema.tenantMembers.tenantId, tenantId));
    await globalClient.delete(dbSchema.tenants).where(eq(dbSchema.tenants.id, tenantId));
  }

  async executeRightToBeForgotten(tenantId: string): Promise<void> {
    console.log(`[Compliance] Initiating cascading delete for tenant: ${tenantId}`);
    
    // Cascading deletion across Data Stores
    await Promise.all([
      this.deleteTursoDatabase(tenantId),
    ]);
  }
}

