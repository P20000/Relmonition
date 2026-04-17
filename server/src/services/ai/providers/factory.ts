
import { AIProvider } from "./provider-interface";
import { GeminiProvider } from "./gemini-provider";
import { OpenAIProvider } from "./openai-provider";
import { TenantDatabaseManager } from "../../../tenant-manager";
import * as schema from "../../../db/schema";
import { eq, and } from "drizzle-orm";

const tenantManager = new TenantDatabaseManager();

// Cache of providers by tenantId to avoid excessive DB/SDK instantiation
const _providerCache: Record<string, AIProvider> = {};

export async function getLLMProvider(tenantId?: string): Promise<AIProvider> {
  // 1. If we have a tenantId, check for a CUSTOM database-backed config
  if (tenantId) {
    if (_providerCache[tenantId]) return _providerCache[tenantId];

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
        console.log(`[LLM Factory] Using DB config "${activeConfig.label}" for tenant ${tenantId}`);
        const provider = activeConfig.provider === "gemini"
          ? new GeminiProvider(activeConfig.apiKey, activeConfig.modelName)
          : new OpenAIProvider(activeConfig.apiKey, activeConfig.modelName, activeConfig.baseUrl || undefined);
        
        _providerCache[tenantId] = provider;
        return provider;
      }
    } catch (error) {
      console.warn(`[LLM Factory] Error checking DB config for tenant ${tenantId}, falling back to ENV:`, error);
    }
  }

  // 2. Fallback to ENV variables (Global System Key)
  const fallbackKey = "system_default";
  if (_providerCache[fallbackKey]) return _providerCache[fallbackKey];

  const providerType = process.env.LLM_PROVIDER || "gemini";
  const apiKey = process.env.LLM_API_KEY || process.env.GEMINI_API_KEY;
  const modelName = process.env.LLM_MODEL || (providerType === "gemini" ? "gemini-2.5-flash" : "gpt-4o");
  const baseURL = process.env.LLM_BASE_URL;

  if (!apiKey) {
    throw new Error(`[LLM Factory] API key not found in ENV for provider: ${providerType}`);
  }

  const provider = providerType === "gemini"
    ? new GeminiProvider(apiKey, modelName)
    : new OpenAIProvider(apiKey, modelName, baseURL || undefined);

  _providerCache[fallbackKey] = provider;
  return provider;
}

/**
 * Clear the cache for a specific tenant (called when keys are updated/switched).
 */
export function clearProviderCache(tenantId: string) {
  delete _providerCache[tenantId];
}
