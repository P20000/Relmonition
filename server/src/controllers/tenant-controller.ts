import { Request, Response } from 'express';
import { TenantDatabaseManager } from '../tenant-manager';
import * as schema from '../db/schema';
import { eq, desc } from 'drizzle-orm';

const tenantManager = new TenantDatabaseManager();

// Helper to get DB instance
const getDb = async (tenantId: string) => {
  const { client } = await tenantManager.getDatabaseClient(tenantId);
  return client;
};

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    // Force tenantId to be a string
    const tid = Array.isArray(req.params.tenantId) ? req.params.tenantId[0] : req.params.tenantId;
    
    if (!tid) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const db = await getDb(tid);

    const [lastMood, insights, interaction] = await Promise.all([
      db.select().from(schema.moodLogs).where(eq(schema.moodLogs.coupleId, tid)).orderBy(desc(schema.moodLogs.createdAt)).limit(1),
      db.select().from(schema.aiInsights).where(eq(schema.aiInsights.coupleId, tid)).orderBy(desc(schema.aiInsights.createdAt)).limit(3),
      db.select().from(schema.interactionMetrics).where(eq(schema.interactionMetrics.coupleId, tid)).orderBy(desc(schema.interactionMetrics.date)).limit(7),
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
      stack: error.stack 
    });
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
