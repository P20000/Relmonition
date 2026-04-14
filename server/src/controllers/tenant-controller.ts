import { Request, Response } from 'express';
import { TenantDatabaseManager } from '../tenant-manager';
import * as schema from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
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

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    const tid = String(req.params.tenantId);

    if (!tid) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const db = await getDb(tid);

    const [lastMood, insights, interaction] = await Promise.all([
      db.select().from(schema.moodLogs).where(eq(schema.moodLogs.tenantId, tid)).orderBy(desc(schema.moodLogs.createdAt)).limit(1),
      db.select().from(schema.aiInsights).where(eq(schema.aiInsights.tenantId, tid)).orderBy(desc(schema.aiInsights.createdAt)).limit(3),
      db.select().from(schema.interactionMetrics).where(eq(schema.interactionMetrics.tenantId, tid)).orderBy(desc(schema.interactionMetrics.date)).limit(7),
    ]);

    res.json({
      lastMood: lastMood[0] || null,
      insights,
      recentInteractions: interaction,
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
    res.status(500).json({ error: 'Failed to get user tenants', details: error.message });
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
