
import { Request, Response } from 'express';
import { TenantDatabaseManager } from '../tenant-manager';
import * as schema from '../db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import { clearProviderCache } from '../services/ai/providers/factory';

const tenantManager = new TenantDatabaseManager();

/**
 * GET /api/v1/tenant/:tenantId/ai-configs
 * Returns all saved AI configurations for a tenant.
 */
export async function getAIConfigs(req: Request, res: Response) {
  const { tenantId } = req.params;
  try {
    const { client: db } = await tenantManager.getDatabaseClient(tenantId);
    
    const configs = await db.select()
      .from(schema.aiProviderConfigs)
      .where(eq(schema.aiProviderConfigs.tenantId, tenantId));
    
    // Mask API keys for security
    const maskedConfigs = configs.map(c => ({
      ...c,
      apiKey: c.apiKey.length > 8 
        ? `${c.apiKey.slice(0, 4)}...${c.apiKey.slice(-4)}` 
        : "****"
    }));

    res.json(maskedConfigs);
  } catch (error) {
    console.error('[AIConfig] Error fetching configs:', error);
    res.status(500).json({ error: 'Failed to fetch AI configurations' });
  }
}

/**
 * POST /api/v1/tenant/:tenantId/ai-configs
 * Adds a new AI configuration.
 */
export async function createAIConfig(req: Request, res: Response) {
  const { tenantId } = req.params;
  const { label, provider, apiKey, baseUrl, modelName } = req.body;

  if (!label || !provider || !apiKey || !modelName) {
    return res.status(400).json({ error: 'Label, provider, apiKey, and modelName are required.' });
  }

  try {
    const { client: db } = await tenantManager.getDatabaseClient(tenantId);
    
    const newConfig = {
      id: crypto.randomUUID(),
      tenantId,
      label,
      provider,
      apiKey, // Stored as plain text for now, but masked in GET
      baseUrl,
      modelName,
      isActive: false,
      createdAt: new Date(),
    };

    await db.insert(schema.aiProviderConfigs).values(newConfig);
    res.status(201).json({ message: 'AI Configuration created', configId: newConfig.id });
  } catch (error) {
    console.error('[AIConfig] Error creating config:', error);
    res.status(500).json({ error: 'Failed to create AI configuration' });
  }
}

/**
 * PUT /api/v1/tenant/:tenantId/ai-configs/:configId/activate
 * Sets a configuration as active and deactivates others for the tenant.
 */
export async function activateAIConfig(req: Request, res: Response) {
  const { tenantId, configId } = req.params;

  try {
    const { client: db } = await tenantManager.getDatabaseClient(tenantId);
    
    // 1. Deactivate all for this tenant
    await db.update(schema.aiProviderConfigs)
      .set({ isActive: false })
      .where(eq(schema.aiProviderConfigs.tenantId, tenantId));
    
    // 2. Activate the target one
    await db.update(schema.aiProviderConfigs)
      .set({ isActive: true })
      .where(and(
        eq(schema.aiProviderConfigs.id, configId),
        eq(schema.aiProviderConfigs.tenantId, tenantId)
      ));

    // Clear factory cache so it fetches the new active config
    clearProviderCache(tenantId);

    res.json({ message: 'Configuration activated' });
  } catch (error) {
    console.error('[AIConfig] Error activating config:', error);
    res.status(500).json({ error: 'Failed to activate configuration' });
  }
}

/**
 * DELETE /api/v1/tenant/:tenantId/ai-configs/:configId
 */
export async function deleteAIConfig(req: Request, res: Response) {
  const { tenantId, configId } = req.params;

  try {
    const { client: db } = await tenantManager.getDatabaseClient(tenantId);
    
    await db.delete(schema.aiProviderConfigs)
      .where(and(
        eq(schema.aiProviderConfigs.id, configId),
        eq(schema.aiProviderConfigs.tenantId, tenantId)
      ));

    clearProviderCache(tenantId);

    res.json({ message: 'Configuration deleted' });
  } catch (error) {
    console.error('[AIConfig] Error deleting config:', error);
    res.status(500).json({ error: 'Failed to delete configuration' });
  }
}
