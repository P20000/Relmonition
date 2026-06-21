import { drizzle } from 'drizzle-orm/libsql';
import { eq, and, sql } from 'drizzle-orm';
import * as schema from '../../db/schema';
import { embedText } from './embeddings-service';

export interface RetrievedContext {
  entryId: string | null;
  chatUploadId: string | null;
  content: string;
  similarity: number;
  createdAt: Date;
  journalDate: string | null;
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
    const queryVectorStr = JSON.stringify(queryVector);
    const limitVal = mode === 'retrieval' ? 5 : 15;

    // 2. Query nearest neighbors directly using database-side similarity.
    // Cosine distance = 1.0 - Cosine similarity.
    // So similarity = 1.0 - vector_distance_cos(vector, vector(?))
    const results = await this.db.all<{
      entryId: string | null;
      chatUploadId: string | null;
      content: string;
      similarity: number;
      createdAt: number | string | Date;
      journalDate: string | null;
    }>(sql`
      SELECT 
        e.entry_id as entryId,
        e.chat_upload_id as chatUploadId,
        e.content as content,
        (1.0 - vector_distance_cos(e.vector, vector(${queryVectorStr}))) as similarity,
        e.created_at as createdAt,
        j.date as journalDate
      FROM embeddings e
      LEFT JOIN journal_entries j ON e.entry_id = j.id
      WHERE e.tenant_id = ${tenantId}
      ORDER BY vector_distance_cos(e.vector, vector(${queryVectorStr})) ASC
      LIMIT ${limitVal}
    `);

    const mapped: RetrievedContext[] = results.map((row) => {
      const createdAtVal = typeof row.createdAt === 'number'
        ? new Date(row.createdAt)
        : new Date(row.createdAt);

      return {
        entryId: row.entryId || null,
        chatUploadId: row.chatUploadId || null,
        content: String(row.content),
        similarity: Number(row.similarity),
        createdAt: createdAtVal,
        journalDate: row.journalDate || null,
      };
    });

    if (mode === 'exploration') {
      // Re-sort chronologically to give the AI temporal context for trend detection
      mapped.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }

    return mapped;
  }
}

