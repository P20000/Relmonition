import { Request, Response } from 'express';
import { TenantDatabaseManager } from '../tenant-manager';
import * as schema from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import crypto from 'crypto';
import { embedAndStoreJournalEntry } from '../services/ai/rag-service';
import { processJournalMetrics } from '../services/ai/metrics-service';

const tenantManager = new TenantDatabaseManager();

const getDb = async (tenantId: string) => {
  const { client } = await tenantManager.getDatabaseClient(tenantId);
  return client;
};

// Static prompts for now - in production these would come from a DB or AI
const DAILY_PROMPTS = [
  "What small moment from today made you feel most connected to your partner?",
  "What are you most grateful for about your partner today?",
  "Describe a moment when you felt truly heard by your partner.",
  "What's one thing your partner did recently that made you feel supported?",
  "If you could relive one moment from this week with your partner, what would it be?"
];

export const getDailyPrompt = async (req: Request, res: Response) => {
  try {
    // Return prompt based on date
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const prompt = DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length];
    res.json({ prompt, date: new Date().toISOString() });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get daily prompt' });
  }
};

export const createEntry = async (req: Request, res: Response) => {
  try {
    const { tenantId, userId, content, prompt, category } = req.body;
    const db = await getDb(tenantId);

    const entryId = crypto.randomUUID();

    await db.insert(schema.journalEntries).values({
      id: entryId,
      tenantId,
      userId,
      prompt: prompt || null,
      content,
      category: category || 'general',
      createdAt: new Date(),
    });

    // Fire-and-forget background processing
    embedAndStoreJournalEntry(tenantId, entryId, prompt ? `${prompt}\n\n${content}` : content).catch(err => {
        console.error(`[Journal] Failed to embed entry ${entryId}:`, err);
    });

    processJournalMetrics(tenantId, entryId, content).catch(err => {
        console.error(`[Journal] Failed to process metrics for ${entryId}:`, err);
    });

    res.status(201).json({ message: 'Entry created', entryId });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create entry', details: error.message });
  }
};

export const getEntries = async (req: Request, res: Response) => {
  try {
    const tenantId = String(req.params.tenantId);
    const userId = req.query.userId ? String(req.query.userId) : undefined;
    const db = await getDb(tenantId);

    let query = db
      .select()
      .from(schema.journalEntries)
      .where(eq(schema.journalEntries.tenantId, tenantId))
      .orderBy(desc(schema.journalEntries.createdAt));

    if (userId) {
      // @ts-ignore - Adding dynamic filter
      query = db
        .select()
        .from(schema.journalEntries)
        .where(
          and(
            eq(schema.journalEntries.tenantId, tenantId),
            eq(schema.journalEntries.userId, userId)
          )
        )
        .orderBy(desc(schema.journalEntries.createdAt));
    }

    const entries = await query.limit(20);

    res.json(entries);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch entries', details: error.message });
  }
};
