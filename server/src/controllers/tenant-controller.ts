import { Request, Response } from 'express';
import { TenantDatabaseManager } from '../tenant-manager';
import * as schema from '../db/schema';
import { eq, desc } from 'drizzle-orm';

const tenantManager = new TenantDatabaseManager();

// Helper to get DB instance
const getDb = async (tenantId: string) => {
  const { client } = await tenantManager.provisionCoupleDatabase(tenantId, 'ap-south-1');
  return client;
};

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const db = await getDb(tenantId);

    const [lastMood, insights, interaction] = await Promise.all([
      db.select().from(schema.moodLogs).where(eq(schema.moodLogs.coupleId, tenantId)).orderBy(desc(schema.moodLogs.createdAt)).limit(1),
      db.select().from(schema.aiInsights).where(eq(schema.aiInsights.coupleId, tenantId)).orderBy(desc(schema.aiInsights.createdAt)).limit(3),
      db.select().from(schema.interactionMetrics).where(eq(schema.interactionMetrics.coupleId, tenantId)).orderBy(desc(schema.interactionMetrics.date)).limit(7),
    ]);

    res.json({
      lastMood: lastMood[0] || null,
      insights,
      recentInteractions: interaction,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to retrieve dashboard data' });
  }
};

export const getTenantData = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    res.json({ message: `Data for tenant ${tenantId}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve tenant data' });
  }
};
