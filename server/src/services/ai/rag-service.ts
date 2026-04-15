import { embedText } from './embeddings-service';
import { RelationshipRAGEngine, RetrievedContext } from './retrieval-engine';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TenantDatabaseManager } from '../../tenant-manager';
import crypto from 'crypto';

const tenantManager = new TenantDatabaseManager();

let _genClient: GoogleGenerativeAI | null = null;
function getGenClient(): GoogleGenerativeAI {
  if (!_genClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('[RAGService] GEMINI_API_KEY is not set.');
    _genClient = new GoogleGenerativeAI(apiKey);
  }
  return _genClient;
}

export interface RAGResponse {
  answer: string;
  sources: Array<{ content: string; similarity: number; createdAt: Date }>;
  mode: 'retrieval' | 'exploration';
}

/**
 * Full RAG pipeline:
 *  1. Retrieve semantically relevant journal entries for this tenant
 *  2. Build a grounded prompt with the retrieved context
 *  3. Generate a Gemini response
 */
export async function queryRelationshipMemory(
  tenantId: string,
  query: string,
  mode: 'retrieval' | 'exploration' = 'retrieval',
): Promise<RAGResponse> {
  // Step 1: Get tenant DB client
  const { client } = await tenantManager.getDatabaseClient(tenantId);

  // Step 2: Semantic retrieval
  const engine = new RelationshipRAGEngine(client);
  const context: RetrievedContext[] = await engine.retrieveContext(tenantId, query, mode);

  // Step 3: Build grounded prompt
  const contextBlock = context.length > 0
    ? context
        .map((c, i) => `[Memory ${i + 1}] (similarity: ${c.similarity.toFixed(3)})\n${c.content}`)
        .join('\n\n')
    : 'No relevant past entries found.';

  const systemInstruction = mode === 'retrieval'
    ? `You are a compassionate relationship AI assistant for the app Relmonition. 
       You are answering a specific question using the couple's journal entries as grounding context.
       Be concise, empathetic, and clinically grounded. Do NOT make up information not present in the memories.
       If the context doesn't contain enough information, say so honestly.`
    : `You are a compassionate relationship AI assistant for the app Relmonition.
       You are generating an exploratory insight or weekly summary using the couple's journal history.
       Identify patterns, growth areas, and recurring themes. Be warm, non-judgmental, and constructive.
       Ground your response in the provided memories.`;

  const prompt = `${systemInstruction}

---
COUPLE'S RELEVANT MEMORIES:
${contextBlock}
---

USER QUERY: ${query}

RESPONSE:`;

  // Step 4: Generate with Gemini
  console.log(`[RAG] Generating response for tenant ${tenantId}, ${context.length} context chunks`);
  const model = getGenClient().getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(prompt);
  const answer = result.response.text();

  return {
    answer,
    sources: context.map(c => ({
      content: c.content,
      similarity: c.similarity,
      createdAt: c.createdAt,
    })),
    mode,
  };
}

/**
 * Embed-on-write helper: call this whenever a journal entry is created.
 * Inserts the embedding into Turso so it can be retrieved in future RAG calls.
 */
export async function embedAndStoreJournalEntry(
  tenantId: string,
  entryId: string,
  content: string,
): Promise<void> {
  console.log(`[RAG] Embedding journal entry ${entryId} for tenant ${tenantId}`);
  const { client } = await tenantManager.getDatabaseClient(tenantId);

  const vector = await embedText(content);

  await client.insert((await import('../../db/schema')).embeddings).values({
    id: crypto.randomUUID(),
    entryId,
    tenantId,
    content,
    vector: JSON.stringify(vector),
    createdAt: new Date(),
  });

  console.log(`[RAG] Stored embedding for entry ${entryId} (${vector.length} dims)`);
}
