import { Request, Response } from 'express';
import { TenantDatabaseManager } from '../tenant-manager';
import * as schema from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { generatePersonalityProfiles } from '../services/ai/profile-service';

const tenantManager = new TenantDatabaseManager();

// GET /api/v1/profiles/:tenantId
export const getProfiles = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;
    const { client: db } = await tenantManager.getDatabaseClient(tenantId);
    
    const profiles = await db.select().from(schema.partnerProfiles).where(eq(schema.partnerProfiles.tenantId, tenantId));
    const compatibility = await db.select().from(schema.compatibilityInsights).where(eq(schema.compatibilityInsights.tenantId, tenantId)).limit(1);
    
    // Attach user names to profiles from global db
    const { client: globalDb } = tenantManager.getGlobalClient();
    
    const enrichedProfiles = await Promise.all(profiles.map(async (p) => {
      const user = await globalDb.select({ name: schema.users.name, email: schema.users.email })
        .from(schema.users)
        .where(eq(schema.users.id, p.userId))
        .limit(1);

      const safeParse = (str: string | null) => {
        if (!str) return [];
        try {
          return JSON.parse(str);
        } catch (e) {
          console.error(`[ProfileController] JSON parse error for field:`, e);
          return [];
        }
      };

      return {
        ...p,
        traits: safeParse(p.traits),
        likes: safeParse(p.likes),
        dislikes: safeParse(p.dislikes),
        triggersAndTraumas: safeParse(p.triggersAndTraumas),
        userName: user[0]?.name || user[0]?.email || 'Partner'
      };
    }));

    res.json({
      profiles: enrichedProfiles,
      compatibility: (compatibility.length > 0 && compatibility[0]) ? {
        ...compatibility[0],
        growthOpportunities: (typeof compatibility[0].growthOpportunities === 'string') 
          ? JSON.parse(compatibility[0].growthOpportunities) 
          : []
      } : null
    });
  } catch (error: any) {
    console.error('[ProfileController] Failed to get profiles. Error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve personality profiles',
      details: error.message,
      stack: error.stack
    });
  }
};

// POST /api/v1/profiles/:tenantId/generate
export const triggerProfileGeneration = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;
    // Non-blocking trigger
    generatePersonalityProfiles(tenantId).catch(console.error);
    res.json({ message: 'Profile generation started in background' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to trigger profile generation' });
  }
};

// PATCH /api/v1/profiles/:tenantId/:userId/likes
export const updateLikesDislikes = async (req: Request, res: Response) => {
  try {
    const { tenantId, userId } = req.params;
    const { type, action, item } = req.body; // type: 'like' | 'dislike', action: 'add' | 'remove', item: string
    
    const { client: db } = await tenantManager.getDatabaseClient(tenantId);
    
    const profile = await db.select().from(schema.partnerProfiles).where(and(eq(schema.partnerProfiles.tenantId, tenantId), eq(schema.partnerProfiles.userId, userId))).limit(1);
    
    if (profile.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    const p = profile[0];
    let items = type === 'like' ? JSON.parse(p.likes) : JSON.parse(p.dislikes);
    
    if (action === 'add') {
      if (!items.includes(item)) items.push(item);
    } else if (action === 'remove') {
      items = items.filter((i: string) => i !== item);
    }
    
    if (type === 'like') {
      await db.update(schema.partnerProfiles).set({ likes: JSON.stringify(items) }).where(eq(schema.partnerProfiles.id, p.id));
    } else {
      await db.update(schema.partnerProfiles).set({ dislikes: JSON.stringify(items) }).where(eq(schema.partnerProfiles.id, p.id));
    }
    
    res.json({ message: 'Updated successfully', items });
  } catch (error: any) {
    console.error('Failed to update likes/dislikes:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
};
