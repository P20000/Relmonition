import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { callWithRetry } from './ai-utils';
import { TenantDatabaseManager } from '../../tenant-manager';
import * as schema from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { decrypt } from '../../utils/crypto';

// ─── Types ───────────────────────────────────────────────────────────────────

interface EmbeddingClient {
  type: 'gemini' | 'openai-compat';
  client: GoogleGenerativeAI | OpenAI;
}

// ─── Tenant-Aware Client Cache ───────────────────────────────────────────────

const SYSTEM_KEY = '__system__';
const _clientCache = new Map<string, EmbeddingClient>();
const tenantManager = new TenantDatabaseManager();

/**
 * Resolve the correct embedding client for a tenant.
 *
 * Resolution order:
 *  1. Cached client for this tenantId
 *  2. Active BYOK config from the tenant's DB  (Gemini native or OpenAI-compat)
 *  3. System environment variable fallback     (always Gemini)
 */
async function getEmbeddingClient(tenantId?: string): Promise<EmbeddingClient> {
  const cacheKey = tenantId || SYSTEM_KEY;

  // 1. Return from cache if available
  if (_clientCache.has(cacheKey)) {
    return _clientCache.get(cacheKey)!;
  }

  // 2. If we have a tenantId, try to resolve a BYOK config
  if (tenantId) {
    try {
      const { client: db } = await tenantManager.getDatabaseClient(tenantId);
      const [activeConfig] = await db.select()
        .from(schema.aiProviderConfigs)
        .where(and(
          eq(schema.aiProviderConfigs.tenantId, tenantId),
          eq(schema.aiProviderConfigs.isActive, true)
        ))
        .limit(1);

      if (activeConfig) {
        const decryptedKey = decrypt(activeConfig.apiKey);

        if (activeConfig.provider === 'gemini') {
          const entry: EmbeddingClient = {
            type: 'gemini',
            client: new GoogleGenerativeAI(decryptedKey),
          };
          _clientCache.set(cacheKey, entry);
          console.log(`[EmbeddingsService] Using BYOK Gemini key for tenant ${tenantId}`);
          return entry;
        } else {
          // OpenAI-compatible path (OpenAI, Groq, Together, DeepSeek, etc.)
          const entry: EmbeddingClient = {
            type: 'openai-compat',
            client: new OpenAI({
              apiKey: decryptedKey,
              baseURL: activeConfig.baseUrl || 'https://api.openai.com/v1',
              timeout: 30000,
            }),
          };
          _clientCache.set(cacheKey, entry);
          console.log(`[EmbeddingsService] Using BYOK OpenAI-compat key for tenant ${tenantId} (provider: ${activeConfig.provider})`);
          return entry;
        }
      }
    } catch (error) {
      console.warn(`[EmbeddingsService] Error resolving BYOK config for tenant ${tenantId}, falling back to system key:`, error);
    }
  }

  // 3. Fallback: system environment Gemini client
  if (_clientCache.has(SYSTEM_KEY)) {
    return _clientCache.get(SYSTEM_KEY)!;
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new Error('[EmbeddingsService] GEMINI_API_KEY or LLM_API_KEY is not set in environment variables.');
  }

  const entry: EmbeddingClient = {
    type: 'gemini',
    client: new GoogleGenerativeAI(apiKey),
  };
  _clientCache.set(SYSTEM_KEY, entry);
  return entry;
}

// ─── Embedding Functions ─────────────────────────────────────────────────────

/**
 * Generate a 768-dimensional embedding for a piece of text.
 * Routes to the correct provider based on the tenant's active BYOK config.
 */
export async function embedText(text: string, tenantId?: string): Promise<number[]> {
  const { type, client } = await getEmbeddingClient(tenantId);

  if (type === 'gemini') {
    const gemini = client as GoogleGenerativeAI;
    const model = gemini.getGenerativeModel({ model: 'gemini-embedding-2-preview' });
    const result = await callWithRetry(() => model.embedContent({
      content: { role: 'user', parts: [{ text }] },
      outputDimensionality: 768
    } as any));
    return result.embedding.values;
  } else {
    // OpenAI-compatible path
    const openai = client as OpenAI;
    const result = await callWithRetry(() => openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: 768,
    }));
    return result.data[0].embedding;
  }
}

/**
 * Generate embeddings for multiple pieces of text in a single batch.
 * Routes to the correct provider based on the tenant's active BYOK config.
 */
export async function batchEmbedTexts(texts: string[], tenantId?: string): Promise<number[][]> {
  const { type, client } = await getEmbeddingClient(tenantId);

  if (type === 'gemini') {
    const gemini = client as GoogleGenerativeAI;
    const model = gemini.getGenerativeModel({ model: 'gemini-embedding-2-preview' });
    const requests = texts.map(t => ({
      content: { role: 'user', parts: [{ text: t }] },
      outputDimensionality: 768
    } as any));
    const result = await callWithRetry(() => model.batchEmbedContents({ requests }));
    return result.embeddings.map(e => e.values);
  } else {
    // OpenAI-compatible batch: send all inputs in one request
    const openai = client as OpenAI;
    const result = await callWithRetry(() => openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
      dimensions: 768,
    }));
    // OpenAI returns embeddings in the same order as the input array
    return result.data.map(d => d.embedding);
  }
}

// ─── Cache Management ────────────────────────────────────────────────────────

/**
 * Evict the cached embedding client for a tenant.
 * Called when BYOK configs are activated, deactivated, or deleted.
 */
export function clearEmbeddingsCache(tenantId: string) {
  _clientCache.delete(tenantId);
}
