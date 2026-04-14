import { GoogleGenerativeAI } from '@google/generative-ai';

// Singleton — one client for the whole process lifetime
let _client: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!_client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('[EmbeddingsService] GEMINI_API_KEY is not set in environment variables.');
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
  const model = client.getGenerativeModel({ model: 'gemini-embedding-001' });

  const result = await model.embedContent(text);
  return result.embedding.values;
}

/**
 * Cosine similarity between two equal-length float vectors.
 * Returns a value in [-1, 1]; higher == more similar.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}
