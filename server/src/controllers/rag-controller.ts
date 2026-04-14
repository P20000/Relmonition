import { Request, Response } from 'express';
import { queryRelationshipMemory, embedAndStoreJournalEntry } from '../services/ai/rag-service';

/**
 * POST /api/v1/rag/query
 * Body: { coupleId: string, query: string, mode?: 'retrieval' | 'exploration' }
 *
 * Returns: { answer, sources, mode }
 */
export const ragQuery = async (req: Request, res: Response) => {
  try {
    const { coupleId, query, mode = 'retrieval' } = req.body;

    if (!coupleId || !query) {
      return res.status(400).json({ error: 'coupleId and query are required.' });
    }

    if (mode !== 'retrieval' && mode !== 'exploration') {
      return res.status(400).json({ error: 'mode must be "retrieval" or "exploration".' });
    }

    const result = await queryRelationshipMemory(coupleId, query, mode);
    res.json(result);
  } catch (error: any) {
    console.error('[RAG Controller] Error:', error);
    res.status(500).json({ error: 'RAG query failed.', details: error.message });
  }
};

/**
 * POST /api/v1/rag/embed
 * Body: { coupleId: string, entryId: string, content: string }
 *
 * Manually trigger embedding for a journal entry (also called internally on-write).
 */
export const ragEmbed = async (req: Request, res: Response) => {
  try {
    const { coupleId, entryId, content } = req.body;

    if (!coupleId || !entryId || !content) {
      return res.status(400).json({ error: 'coupleId, entryId, and content are required.' });
    }

    await embedAndStoreJournalEntry(coupleId, entryId, content);
    res.status(201).json({ message: 'Embedding stored successfully.', entryId });
  } catch (error: any) {
    console.error('[RAG Controller] Embed error:', error);
    res.status(500).json({ error: 'Embedding failed.', details: error.message });
  }
};
