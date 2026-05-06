import { Request, Response } from 'express';
import { TenantDatabaseManager } from '../tenant-manager';
import * as schema from '../db/schema';
import { eq, desc, asc, and, sql, gte, lte } from 'drizzle-orm';
import crypto from 'crypto';

const tenantManager = new TenantDatabaseManager();

// Helper to get DB instance — always forces a string from params
const getDb = async (tenantId: string) => {
  const { client } = await tenantManager.getDatabaseClient(tenantId);
  return client;
};

// Generates a 6-character alphanumeric code
const generateConnectionCode = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

// ─── Create / Join ───────────────────────────────────────────────────────────

export const createTenant = async (req: Request, res: Response) => {
  try {
    const { userId, tenantName, label } = req.body as {
      userId: string;
      tenantName: string;
      label?: string;
    };
    const { client } = tenantManager.getGlobalClient();

    const tenantId = crypto.randomUUID();
    const connectionCode = generateConnectionCode();

    await client.insert(schema.tenants).values({
      id: tenantId,
      name: tenantName || null,
      connectionCode,
      createdAt: new Date(),
    });

    await client.insert(schema.tenantMembers).values({
      userId,
      tenantId,
      role: 'owner',
      label: label || 'Self',
      joinedAt: new Date(),
    });

    res.status(201).json({ message: 'Tenant created', tenantId, connectionCode });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create tenant', details: error.message });
  }
};

export const joinTenant = async (req: Request, res: Response) => {
  try {
    const { userId, connectionCode, label } = req.body as {
      userId: string;
      connectionCode: string;
      label?: string;
    };
    const { client } = tenantManager.getGlobalClient();

    const tenants = await client
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.connectionCode, connectionCode))
      .limit(1);

    if (tenants.length === 0) {
      return res.status(404).json({ error: 'Invalid connection code' });
    }

    const tenantId = tenants[0].id;

    await client.insert(schema.tenantMembers).values({
      userId,
      tenantId,
      role: 'member',
      label: label || 'Partner',
      joinedAt: new Date(),
    });

    res.json({ message: 'Successfully joined tenant', tenantId });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to join tenant', details: error.message });
  }
};

// ─── Dashboard ───────────────────────────────────────────────────────────────

import { generateDynamicGreeting } from '../services/ai/greeting-service';
import {
  calculateGottmanRatio,
  calculateHealthScore,
  calculateTrend
} from '../utils/dashboard-calculator';

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    const tid = String(req.params.tenantId);
    const userId = req.query.userId ? String(req.query.userId) : null;

    if (!tid) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { client: globalClient } = tenantManager.getGlobalClient();
    const db = await getDb(tid);

    // Fetch user name for greeting if userId is provided
    let userName = 'there';
    if (userId) {
      const u = await globalClient.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
      if (u[0]) {
        userName = u[0].name || u[0].email.split('@')[0];
      }
    }

    const endUTC = new Date();
    const startUTC = new Date(endUTC.getTime() - 14 * 24 * 60 * 60 * 1000); // 14 days for trend

    const [moods, insights, interaction, greeting, history, journals] = await Promise.all([
      db.select()
        .from(schema.moodLogs)
        .where(
          and(
            eq(schema.moodLogs.tenantId, tid),
            gte(schema.moodLogs.createdAt, startUTC),
            lte(schema.moodLogs.createdAt, endUTC)
          )
        )
        .orderBy(desc(schema.moodLogs.createdAt)),
      db.select().from(schema.aiInsights).where(eq(schema.aiInsights.tenantId, tid)).orderBy(desc(schema.aiInsights.createdAt)).limit(3),
      db.select().from(schema.interactionMetrics).where(eq(schema.interactionMetrics.tenantId, tid)).orderBy(desc(schema.interactionMetrics.date)).limit(14),
      generateDynamicGreeting(userName, tid),
      db.select().from(schema.relationshipHealthHistory).where(eq(schema.relationshipHealthHistory.tenantId, tid)).orderBy(desc(schema.relationshipHealthHistory.date)).limit(200),
      db.select().from(schema.journalEntries).where(eq(schema.journalEntries.tenantId, tid)).orderBy(desc(schema.journalEntries.date)).limit(50)
    ]);

    // --- Smart Sync Logic ---
    // 1. Journal Backfill (Metrics & Pulse)
    // Trigger if no data OR if we detect old data format (totalEntries is missing)
    const needsInitialBackfill = insights.length === 0 && interaction.length === 0;
    const needsFormatUpdate = interaction.length > 0 && interaction.some((i: any) => i.totalEntries === null || i.totalEntries === 0);

    if (needsInitialBackfill || needsFormatUpdate) {
      const journalCount = await db.select({ count: sql<number>`count(*)` }).from(schema.journalEntries).where(eq(schema.journalEntries.tenantId, tid));
      if (journalCount[0]?.count > 0) {
        console.log(`[SmartSync] Triggering ${needsFormatUpdate ? 'migration' : 'initial'} metrics backfill for tenant ${tid}`);
        import('../utils/backfill-metrics').then(m => m.backfillTenantMetrics(tid)).catch(err => {
          console.error(`[SmartSync] Backfill trigger failed:`, err);
        });
      }
    }

    // 2. Chat History Backfill (Relationship History Chart)
    if (history.length === 0) {
      const chatCount = await db.select({ count: sql<number>`count(*)` }).from(schema.chatUploads).where(eq(schema.chatUploads.tenantId, tid));
      if (chatCount[0]?.count > 0) {
        console.log(`[SmartSync] Triggering historical backfill for tenant ${tid}`);
        import('../services/ai/rag-service').then(m => m.backfillHistoryFromExistingUploads(tid)).catch(err => {
          console.error(`[SmartSync] History backfill trigger failed:`, err);
        });
      }
    }

    // Compute metrics
    const gottmanResult = calculateGottmanRatio(interaction as any);
    const healthScore = calculateHealthScore(interaction as any, moods as any);
    const trendResult = calculateTrend(interaction as any, moods as any);

    res.json({
      lastMood: moods[0] || null,
      recentMoods: moods,
      insights,
      recentInteractions: interaction,
      journals,
      greeting,
      history,
      computedMetrics: {
        gottmanRatio: gottmanResult.ratio,
        sampleWarning: gottmanResult.sampleWarning,
        healthScore: healthScore,
        trend: trendResult.trend,
        trendStatus: trendResult.trendStatus
      }
    });
  } catch (error: any) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      error: 'Failed to retrieve dashboard data',
      details: error.message,
      stack: error.stack,
    });
  }
};

// ─── Single Tenant ────────────────────────────────────────────────────────────

export const getTenantData = async (req: Request, res: Response) => {
  try {
    const tenantId = String(req.params.tenantId);
    res.json({ message: `Data for tenant ${tenantId}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve tenant data' });
  }
};

// ─── User's Tenants ───────────────────────────────────────────────────────────

/**
 * GET /api/v1/tenant/user/:userId
 * Returns all tenants a user belongs to, including members for each.
 */
export const getUserTenants = async (req: Request, res: Response) => {
  try {
    const userId = String(req.params.userId);
    const { client } = tenantManager.getGlobalClient();

    const memberships = await client
      .select()
      .from(schema.tenantMembers)
      .where(eq(schema.tenantMembers.userId, userId));

    if (memberships.length === 0) {
      return res.json([]);
    }

    const results = await Promise.all(
      memberships.map(async (membership) => {
        const tenantId = String(membership.tenantId);

        const tenantRecord = await client
          .select()
          .from(schema.tenants)
          .where(eq(schema.tenants.id, tenantId))
          .limit(1);

        if (!tenantRecord[0]) return null;

        const members = await client
          .select()
          .from(schema.tenantMembers)
          .where(eq(schema.tenantMembers.tenantId, tenantId));

        return {
          ...tenantRecord[0],
          role: membership.role,
          members: members.map((m) => ({
            id: String(m.userId),
            role: m.role,
            relationship_label: m.label,
          })),
        };
      })
    );

    res.json(results.filter(Boolean));
  } catch (error: any) {
    console.error('getUserTenants error:', error);
    res.status(500).json({ 
      error: 'Failed to get user tenants', 
      details: error.message,
      cause: error.cause?.message || error.cause
    });
  }
};

// ─── Regenerate Code ──────────────────────────────────────────────────────────

/**
 * POST /api/v1/tenant/:tenantId/regenerate-code
 * Owner only: regenerates the connection code for a tenant.
 */
export const regenerateConnectionCode = async (req: Request, res: Response) => {
  try {
    const tenantId = String(req.params.tenantId);
    const userId = String(req.body.userId);
    const { client } = tenantManager.getGlobalClient();

    const membership = await client
      .select()
      .from(schema.tenantMembers)
      .where(and(eq(schema.tenantMembers.tenantId, tenantId), eq(schema.tenantMembers.userId, userId)))
      .limit(1);

    if (!membership[0] || membership[0].role !== 'owner') {
      return res.status(403).json({ error: 'Only the owner can regenerate the connection code' });
    }

    const newCode = generateConnectionCode();
    await client
      .update(schema.tenants)
      .set({ connectionCode: newCode })
      .where(eq(schema.tenants.id, tenantId));

    res.json({ connectionCode: newCode });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to regenerate code', details: error.message });
  }
};

// ─── Leave Tenant ─────────────────────────────────────────────────────────────

/**
 * DELETE /api/v1/tenant/:tenantId/leave
 * A member (non-owner) removes themselves from a tenant.
 */
export const leaveTenant = async (req: Request, res: Response) => {
  try {
    const tenantId = String(req.params.tenantId);
    const userId = String(req.body.userId);
    const { client } = tenantManager.getGlobalClient();

    await client
      .delete(schema.tenantMembers)
      .where(and(eq(schema.tenantMembers.tenantId, tenantId), eq(schema.tenantMembers.userId, userId)));

    res.json({ message: 'Left tenant successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to leave tenant', details: error.message });
  }
};

// ─── Delete Tenant ────────────────────────────────────────────────────────────

/**
 * DELETE /api/v1/tenant/:tenantId
 * Owner only: permanently deletes the tenant and all its data.
 */
export const deleteTenant = async (req: Request, res: Response) => {
  try {
    const tenantId = String(req.params.tenantId);
    const userId = String(req.body.userId);
    const { client } = tenantManager.getGlobalClient();

    const membership = await client
      .select()
      .from(schema.tenantMembers)
      .where(and(eq(schema.tenantMembers.tenantId, tenantId), eq(schema.tenantMembers.userId, userId)))
      .limit(1);

    if (!membership[0] || membership[0].role !== 'owner') {
      return res.status(403).json({ error: 'Only the owner can delete this relationship' });
    }

    await tenantManager.executeRightToBeForgotten(tenantId);

    res.json({ message: 'Tenant deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete tenant', details: error.message });
  }
};
