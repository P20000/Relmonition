import { GoogleGenerativeAI } from '@google/generative-ai';
import { callWithRetry } from './ai-utils';

// Singleton — one client for the whole process lifetime
let _client: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!_client) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;
    if (!apiKey) {
      throw new Error('[EmbeddingsService] GEMINI_API_KEY or LLM_API_KEY is not set in environment variables.');
    }
    _client = new GoogleGenerativeAI(apiKey);
  }
  return _client;
}

/**
 * Generate a 768-dimensional embedding for a piece of text using
 * Gemini text-embedding-004. Called both when writing journal entries
 * (embed-on-write) and at query time.
 */
export async function embedText(text: string): Promise<number[]> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: 'gemini-embedding-2-preview' });

  const result = await callWithRetry(() => model.embedContent({
    content: { role: 'user', parts: [{ text }] },
    outputDimensionality: 768
  } as any));
  return result.embedding.values;
}

/**
 * Generate embeddings for multiple pieces of text in a single batch.
 * Gemini supports up to 100 requests per batch.
 */
export async function batchEmbedTexts(texts: string[]): Promise<number[][]> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: 'gemini-embedding-2-preview' });

  const requests = texts.map(t => ({
    content: { role: 'user', parts: [{ text: t }] },
    outputDimensionality: 768
  } as any));
  const result = await callWithRetry(() => model.batchEmbedContents({ requests }));
  
  return result.embeddings.map(e => e.values);
}
