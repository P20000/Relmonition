import { drizzle } from 'drizzle-orm/libsql';
import { eq, and } from 'drizzle-orm';
import * as schema from '../../db/schema';
import { embedText, cosineSimilarity } from './embeddings-service';

export interface RetrievedContext {
  entryId: string | null;
  chatUploadId: string | null;
  content: string;
  similarity: number;
  createdAt: Date;
}

export class RelationshipRAGEngine {
  private db: ReturnType<typeof drizzle>;

  constructor(dbClient: ReturnType<typeof drizzle>) {
    this.db = dbClient;
  }

  /**
   * Semantic retrieval over this tenant's journal embeddings.
   *
   * Modes:
   *  - 'retrieval'   → top-5 by cosine similarity (precise Q&A grounding)
   *  - 'exploration' → top-15 by similarity then temporally spread
   *                    (weekly summaries, trend detection)
   */
  async retrieveContext(
    tenantId: string,
    query: string,
    mode: 'retrieval' | 'exploration' = 'retrieval',
  ): Promise<RetrievedContext[]> {
    console.log(`[RAG] Embedding query for tenant ${tenantId} in ${mode} mode`);

    // 1. Embed the incoming query
    const queryVector = await embedText(query);

    // 2. Pull all stored embeddings for this tenant
    const storedEmbeddings = await this.db
      .select()
      .from(schema.embeddings)
      .where(eq(schema.embeddings.tenantId, tenantId));

    if (storedEmbeddings.length === 0) {
      console.log(`[RAG] No embeddings found for tenant ${tenantId}`);
      return [];
    }

    // 3. Rank by cosine similarity in-process (fast for couple-scale volumes)
    const ranked = storedEmbeddings
      .map((row) => {
        let storedVector: number[];
        try {
          storedVector = JSON.parse(row.vector);
        } catch {
          console.warn(`[RAG] Skipping malformed vector for entry ${row.entryId}`);
          return null;
        }

        return {
          entryId: row.entryId,
          chatUploadId: row.chatUploadId,
          content: row.content,
          similarity: cosineSimilarity(queryVector, storedVector),
          createdAt: row.createdAt,
        };
      })
      .filter((r): r is RetrievedContext => r !== null)
      .sort((a, b) => b.similarity - a.similarity);

    // 4. Apply mode-specific slicing
    if (mode === 'retrieval') {
      // Pure top-5 semantic precision
      return ranked.slice(0, 5);
    }

    // Exploration: top-15, then re-sort chronologically to give the AI
    // temporal context for trend detection
    return ranked
      .slice(0, 15)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
}
