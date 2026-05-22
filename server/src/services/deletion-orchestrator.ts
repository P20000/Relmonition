import { TenantDatabaseManager } from '../tenant-manager';
import * as schema from '../db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

const tenantManager = new TenantDatabaseManager();

export class DeletionOrchestrator {
  /**
   * Orchestrates the complete deletion of a user account and handles tenant logic.
   * - If the user is the sole member of a tenant, the entire tenant is wiped.
   * - If the tenant has another member, only the user's isolated data is wiped.
   * - A WORM audit log is created.
   */
  async deleteUserAccount(userId: string, ip?: string, userAgent?: string): Promise<void> {
    const { client } = tenantManager.getGlobalClient();
    console.log(`[DeletionOrchestrator] Initiating account deletion for user: ${userId}`);

    // Step 1: Find all tenants the user belongs to
    const memberships = await client
      .select({ tenantId: schema.tenantMembers.tenantId })
      .from(schema.tenantMembers)
      .where(eq(schema.tenantMembers.userId, userId));

    for (const membership of memberships) {
      const tenantId = membership.tenantId;

      // Count members in this tenant
      const allMembers = await client
        .select({ id: schema.tenantMembers.id })
        .from(schema.tenantMembers)
        .where(eq(schema.tenantMembers.tenantId, tenantId));

      if (allMembers.length === 1) {
        // User is the ONLY member -> Nuke the entire tenant
        console.log(`[DeletionOrchestrator] User is sole member of tenant ${tenantId}. Executing full tenant wipe.`);
        await tenantManager.executeRightToBeForgotten(tenantId);
      } else {
        // Soft tenant wipe: Delete only the user's specific contributions
        console.log(`[DeletionOrchestrator] Tenant ${tenantId} has multiple members. Performing soft wipe for user.`);
        const { client: tenantClient } = await tenantManager.getDatabaseClient(tenantId);

        // Delete user's journal entries
        await tenantClient
          .delete(schema.journalEntries)
          .where(and(eq(schema.journalEntries.tenantId, tenantId), eq(schema.journalEntries.userId, userId)));
          
        // Delete user's chat uploads
        await tenantClient
          .delete(schema.chatUploads)
          .where(and(eq(schema.chatUploads.tenantId, tenantId), eq(schema.chatUploads.userId, userId)));
          
        // Delete user's coach conversations
        const conversations = await tenantClient
          .select({ id: schema.coachConversations.id })
          .from(schema.coachConversations)
          .where(and(eq(schema.coachConversations.tenantId, tenantId), eq(schema.coachConversations.userId, userId)));
          
        for (const conv of conversations) {
          await tenantClient.delete(schema.coachMessages).where(eq(schema.coachMessages.conversationId, conv.id));
        }
        await tenantClient
          .delete(schema.coachConversations)
          .where(and(eq(schema.coachConversations.tenantId, tenantId), eq(schema.coachConversations.userId, userId)));

        // Remove from tenantMembers
        await client
          .delete(schema.tenantMembers)
          .where(and(eq(schema.tenantMembers.tenantId, tenantId), eq(schema.tenantMembers.userId, userId)));
      }
    }

    // Step 2: Delete core identity data
    console.log(`[DeletionOrchestrator] Scrubbing core identity records for user: ${userId}`);
    await client.delete(schema.sessions).where(eq(schema.sessions.userId, userId));
    await client.delete(schema.userPreferences).where(eq(schema.userPreferences.userId, userId));
    await client.delete(schema.users).where(eq(schema.users.id, userId));

    // Step 3: WORM Audit Log
    console.log(`[DeletionOrchestrator] Writing to WORM audit log.`);
    await client.insert(schema.auditLogs).values({
      id: crypto.randomUUID(),
      userId: userId, // Keep reference for compliance
      action: 'ACCOUNT_DELETION',
      resource: 'User Identity & Associated Data',
      ip: ip || 'unknown',
      userAgent: userAgent || 'unknown',
      statusCode: 200,
      createdAt: new Date(),
    });

    console.log(`[DeletionOrchestrator] Account deletion completed successfully for user: ${userId}`);
  }
}
