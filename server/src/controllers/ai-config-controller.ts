import { Request, Response } from 'express';
import { TenantDatabaseManager } from '../tenant-manager';
import * as schema from '../db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import { clearProviderCache } from '../services/ai/providers/factory';
import { AuthorizedRequest } from '../middleware/authorize';
import { encrypt, decrypt } from '../utils/crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

const tenantManager = new TenantDatabaseManager();

// ─── Runtime Probe ───────────────────────────────────────────────────────────

/**
 * Validate an API key by making a lightweight probe request to the provider.
 * - Gemini: embed a trivial 1-token string
 * - OpenAI-compatible: list models (zero-cost endpoint)
 *
 * Throws with a descriptive message if the key/endpoint is invalid.
 */
async function probeApiKey(provider: string, apiKey: string, baseUrl?: string): Promise<void> {
  if (provider === 'gemini') {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-2-preview' });
    await model.embedContent({
      content: { role: 'user', parts: [{ text: 'test' }] },
      outputDimensionality: 768,
    } as any);
  } else {
    // OpenAI-compatible path (OpenAI, Groq, Together, DeepSeek, etc.)
    const openai = new OpenAI({
      apiKey,
      baseURL: baseUrl || 'https://api.openai.com/v1',
      timeout: 15000,
    });
    // models.list() is lightweight and universally supported by OpenAI-compat APIs
    await openai.models.list();
  }
}

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * GET /api/v1/tenant/:tenantId/ai-configs
 * Returns all saved AI configurations for a tenant.
 */
export async function getAIConfigs(req: Request, res: Response) {
  const tenantId = (req as AuthorizedRequest).tenantId!;
  try {
    const { client: db } = await tenantManager.getDatabaseClient(tenantId);
    
    const configs = await db.select()
      .from(schema.aiProviderConfigs)
      .where(eq(schema.aiProviderConfigs.tenantId, tenantId));
    
    // Decrypt and mask API keys for security display
    const maskedConfigs = configs.map(c => {
      const decryptedKey = decrypt(c.apiKey);
      return {
        ...c,
        apiKey: decryptedKey.length > 8 
          ? `${decryptedKey.slice(0, 4)}...${decryptedKey.slice(-4)}` 
          : "****"
      };
    });

    res.json(maskedConfigs);
  } catch (error) {
    console.error('[AIConfig] Error fetching configs:', error);
    res.status(500).json({ error: 'Failed to fetch AI configurations' });
  }
}

/**
 * POST /api/v1/tenant/:tenantId/ai-configs
 * Adds a new AI configuration after runtime-probing the API key.
 */
export async function createAIConfig(req: Request, res: Response) {
  const tenantId = (req as AuthorizedRequest).tenantId!;
  const { label, provider, apiKey, baseUrl, modelName } = req.body;

  if (!label || !provider || !apiKey || !modelName) {
    return res.status(400).json({ error: 'Label, provider, apiKey, and modelName are required.' });
  }

  // Sanitize inputs
  const trimmedLabel = String(label).trim();
  const trimmedProvider = String(provider).trim().toLowerCase();
  const trimmedModelName = String(modelName).trim();
  const trimmedBaseUrl = baseUrl ? String(baseUrl).trim() : undefined;

  if (!trimmedLabel || !trimmedModelName) {
    return res.status(400).json({ error: 'Label and modelName must be non-empty strings.' });
  }

  // ── Runtime Probe: verify the key actually works before saving ──
  try {
    await probeApiKey(trimmedProvider, apiKey, trimmedBaseUrl);
  } catch (probeError: any) {
    console.warn(`[AIConfig] API key probe failed for tenant ${tenantId}:`, probeError.message);
    return res.status(400).json({
      error: 'API key validation failed',
      details: probeError.message || 'The provided API key or endpoint could not be reached.',
    });
  }

  // ── Probe passed — persist the config ──
  try {
    const { client: db } = await tenantManager.getDatabaseClient(tenantId);
    
    const newConfig = {
      id: crypto.randomUUID(),
      tenantId,
      label: trimmedLabel,
      provider: trimmedProvider,
      apiKey: encrypt(apiKey), // Encrypt at rest using AES-256-GCM
      baseUrl: trimmedBaseUrl,
      modelName: trimmedModelName,
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
  const tenantId = (req as AuthorizedRequest).tenantId!;
  const configId = req.params.configId as string;

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
  const tenantId = (req as AuthorizedRequest).tenantId!;
  const configId = req.params.configId as string;

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
