import { embedText, batchEmbedTexts } from './embeddings-service';
import { RelationshipRAGEngine, RetrievedContext } from './retrieval-engine';
import { TenantDatabaseManager } from '../../tenant-manager';
import { getLLMProvider } from './providers/factory';
import { eq, or, and, lt, gt } from 'drizzle-orm';
import crypto from 'crypto';

const tenantManager = new TenantDatabaseManager();

export interface RAGResponse {
  answer: string;
  sources: Array<{ content: string; similarity: number; createdAt: Date }>;
  mode: 'retrieval' | 'exploration';
}

/**
 * Full RAG pipeline:
 *  1. Retrieve semantically relevant journal entries for this tenant
 *  2. Build a grounded prompt with the retrieved context
 *  3. Generate an AI response using the configured provider
 */
export async function queryRelationshipMemory(
  tenantId: string,
  query: string,
  mode: 'retrieval' | 'exploration' = 'retrieval',
): Promise<RAGResponse> {
  // Step 1: Get tenant DB client
  const { client } = await tenantManager.getDatabaseClient(tenantId);

  // Step 2: Semantic retrieval (STABLE: still uses Gemini embeddings)
  const retrievalStart = Date.now();
  const engine = new RelationshipRAGEngine(client);
  const context: RetrievedContext[] = await engine.retrieveContext(tenantId, query, mode);
  const retrievalDuration = Date.now() - retrievalStart;
  console.log(`[RAG Telemetry] Retrieval completed: ${retrievalDuration}ms (${context.length} relevant memories)`);

  // Step 3: Build grounded prompt
  // ... (keep logic as is)
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

  const prompt = `
---
COUPLE'S RELEVANT MEMORIES:
${contextBlock}
---

USER QUERY: ${query}

RESPONSE:`;

  // Step 4: Generate with Adaptable LLM
  console.log(`[RAG] Generating response for tenant ${tenantId} via ${mode} mode (Hybrid)`);
  const generationStart = Date.now();
  const provider = await getLLMProvider(tenantId);
  const answer = await provider.generateText(prompt, systemInstruction);
  const generationDuration = Date.now() - generationStart;
  console.log(`[RAG Telemetry] Generation completed: ${generationDuration}ms`);

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
 * Streaming version of the RAG pipeline.
 */
export async function* queryRelationshipMemoryStream(
  tenantId: string,
  query: string,
  mode: 'retrieval' | 'exploration' = 'retrieval',
  signal?: AbortSignal
): AsyncGenerator<string> {
  const { client } = await tenantManager.getDatabaseClient(tenantId);
  const engine = new RelationshipRAGEngine(client);
  const context: RetrievedContext[] = await engine.retrieveContext(tenantId, query, mode);

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

  const prompt = `
---
COUPLE'S RELEVANT MEMORIES:
${contextBlock}
---

USER QUERY: ${query}

RESPONSE:`;

  const provider = await getLLMProvider(tenantId);
  yield* provider.generateStream(prompt, systemInstruction, signal);
}

/**
 * Embed-on-write helper: call this whenever a journal entry is created.
 * Inserts the embedding into Turso so it can be retrieved in future RAG calls.
 * (STABLE: explicitly uses Gemini embeddings)
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
/**
 * Chunking and embedding engine for external chat logs.
 * Iterates through the raw file, creates overlapping chunks, and embeds them.
 */
export async function processChatUpload(
  tenantId: string,
  uploadId: string,
  content: string,
): Promise<void> {
  const { client } = await tenantManager.getDatabaseClient(tenantId);
  const schema = await import('../../db/schema');

  try {
    console.log(`[RAG] Processing chat upload ${uploadId} for tenant ${tenantId}`);
    
    // 1. Chunking logic (1200 chars, 200 overlap)
    const CHUNK_SIZE = 1200;
    const OVERLAP = 200;
    const chunks: string[] = [];
    
    let start = 0;
    while (start < content.length) {
      const end = Math.min(start + CHUNK_SIZE, content.length);
      chunks.push(content.substring(start, end));
      start += (CHUNK_SIZE - OVERLAP);
      if (start >= content.length) break;
    }

    console.log(`[RAG] Created ${chunks.length} chunks from upload ${uploadId}`);

    // 2. Embedding Phase (0% - 50%)
    const BATCH_SIZE = 100;
    const batches: string[][] = [];
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      batches.push(chunks.slice(i, i + BATCH_SIZE));
    }

    const allEmbeddings: { content: string; vector: number[] }[] = [];
    const CONCURRENCY = 3;

    for (let i = 0; i < batches.length; i += CONCURRENCY) {
      const activeBatches = batches.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        activeBatches.map(batchTexts => batchEmbedTexts(batchTexts))
      );

      results.forEach((vectors, batchIdx) => {
        const batchTexts = activeBatches[batchIdx];
        vectors.forEach((v, textIdx) => {
          if (v && v.length > 0) {
            allEmbeddings.push({ content: batchTexts[textIdx], vector: v });
          }
        });
      });

      const embedProgress = Math.min(Math.round(((i + activeBatches.length) / batches.length) * 50), 50);
      await client.update(schema.chatUploads)
        .set({ processingProgress: embedProgress })
        .where(eq(schema.chatUploads.id, uploadId));
    }

    console.log(`[RAG] Completed embedding generation for ${allEmbeddings.length} chunks.`);

    // 3. Storage Phase (50% - 100%)
    const INSERT_INCREMENT = 200; 

    for (let i = 0; i < allEmbeddings.length; i += INSERT_INCREMENT) {
      const slice = allEmbeddings.slice(i, i + INSERT_INCREMENT);
      await client.insert(schema.embeddings).values(
        slice.map(item => ({
          id: crypto.randomUUID(),
          chatUploadId: uploadId,
          tenantId,
          content: item.content,
          vector: JSON.stringify(item.vector),
          createdAt: new Date(),
        }))
      );

      const dbProgress = 50 + Math.min(Math.round(((i + slice.length) / (allEmbeddings.length || 1)) * 50), 49);
      await client.update(schema.chatUploads)
        .set({ processingProgress: dbProgress })
        .where(eq(schema.chatUploads.id, uploadId));
    }

    // 4. Finalise
    await client.update(schema.chatUploads)
      .set({ processed: true, processingProgress: 100 })
      .where(eq(schema.chatUploads.id, uploadId));

    console.log(`[RAG] Successfully processed upload ${uploadId}`);

    // 5. Trigger Historical Analysis for Dashboard (Background)
    const { analyzeHistoryFromChat } = await import('./metrics-service');
    analyzeHistoryFromChat(tenantId, content).catch(err => {
      console.error(`[RAG] Historical analysis background task failed:`, err);
    });
  } catch (err: any) {
    console.error(`[RAG ERROR] Critical failure in processChatUpload for ${uploadId}:`, err);
    // Optional: Update DB to mark as failed/error state
    await client.update(schema.chatUploads)
      .set({ processingProgress: 0 }) // Reset or handle error UI
      .where(eq(schema.chatUploads.id, uploadId));
  }
}

/**
 * Retroactively processes all successful existing chat uploads for a tenant
 * to ensure relationship history is fully populated.
 */
export async function backfillHistoryFromExistingUploads(tenantId: string): Promise<void> {
  console.log(`[RAG] Initiating historical backfill for tenant: ${tenantId}`);
  const { client: db } = await tenantManager.getDatabaseClient(tenantId);
  const schema = await import('../../db/schema');

  try {
    const existingUploads = await db.select()
      .from(schema.chatUploads)
      .where(eq(schema.chatUploads.tenantId, tenantId));

    if (existingUploads.length === 0) {
      console.log(`[RAG] No existing uploads found for tenant ${tenantId}.`);
      return;
    }

    console.log(`[RAG] Found ${existingUploads.length} existing uploads to analyze.`);
    const { analyzeHistoryFromChat } = await import('./metrics-service');

    // 1. Full Flush for Tenant (to clear ghost data and start fresh with new parser)
    await db.delete(schema.relationshipHealthHistory)
      .where(eq(schema.relationshipHealthHistory.tenantId, tenantId));
    console.log(`[RAG] Flushed existing history for tenant ${tenantId} to ensure clean sync.`);

    // 2. Process uploads
    for (const upload of existingUploads) {
      console.log(`[RAG] Analyzing historical context from upload: ${upload.fileName}`);
      await analyzeHistoryFromChat(tenantId, upload.fileContent);
    }

    console.log(`[RAG] Historical backfill complete for tenant ${tenantId}.`);
  } catch (err: any) {
    console.error(`[RAG ERROR] Historical backfill failed for tenant ${tenantId}:`, err);
  }
}
