import { Request, Response } from 'express';
import { TenantDatabaseManager } from '../tenant-manager';
import * as schema from '../db/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import crypto from 'crypto';
import { embedAndStoreJournalEntry } from '../services/ai/rag-service';
import { processJournalMetrics } from '../services/ai/metrics-service';
import { checkAndSyncProfiles } from '../services/ai/profile-service';

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
    const tenantId = req.query.tenantId as string;
    const userId = req.query.userId as string;

    if (!tenantId || !userId) {
      return res.status(400).json({ error: 'tenantId and userId are required' });
    }

    const { client: globalClient } = tenantManager.getGlobalClient();
    
    // Fetch members to find user and partner names
    const members = await globalClient
      .select({
        userId: schema.tenantMembers.userId,
        label: schema.tenantMembers.label,
        userName: schema.users.name
      })
      .from(schema.tenantMembers)
      .leftJoin(schema.users, eq(schema.tenantMembers.userId, schema.users.id))
      .where(eq(schema.tenantMembers.tenantId, tenantId));

    const currentUser = members.find(m => m.userId === userId);
    const partner = members.find(m => m.userId !== userId);

    const userName = currentUser?.userName || currentUser?.label || 'there';
    const partnerName = partner?.userName || partner?.label || 'your partner';

    res.json({ 
      userName, 
      partnerName,
      date: new Date().toISOString() 
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get journal header', details: error.message });
  }
};

export const createEntry = async (req: Request, res: Response) => {
  try {
    const { tenantId, userId, content, date, category } = req.body;
    const db = await getDb(tenantId);

    if (!date) {
        return res.status(400).json({ error: 'Date is required (YYYY-MM-DD)' });
    }

    // Check if an entry already exists for this user on this specific date
    const existingEntries = await db
      .select()
      .from(schema.journalEntries)
      .where(
        and(
          eq(schema.journalEntries.tenantId, tenantId),
          eq(schema.journalEntries.userId, userId),
          eq(schema.journalEntries.date, date)
        )
      );
    
    let entryId: string;
    if (existingEntries.length > 0) {
      const existingEntry = existingEntries[0];
      entryId = existingEntry.id;
      const updatedContent = `${existingEntry.content}\n\n${content}`;

      await db.update(schema.journalEntries)
        .set({ content: updatedContent })
        .where(eq(schema.journalEntries.id, entryId));
    } else {
      entryId = crypto.randomUUID();
      await db.insert(schema.journalEntries).values({
        id: entryId,
        tenantId,
        userId,
        prompt: null, // Prompt is no longer stored per user request
        content,
        date,
        category: category || 'general',
        createdAt: new Date(),
      });
    }

    // Fire-and-forget background processing
    embedAndStoreJournalEntry(tenantId, entryId, content).catch(err => {
        console.error(`[Journal] Failed to embed entry ${entryId}:`, err);
    });

    processJournalMetrics(tenantId, entryId, content, new Date(date)).catch(err => {
        console.error(`[Journal] Failed to process metrics for ${entryId}:`, err);
    });
    
    checkAndSyncProfiles(tenantId).catch(err => {
        console.error(`[Journal] Failed to check/sync profiles:`, err);
    });

    res.status(existingEntries.length > 0 ? 200 : 201).json({ 
      message: existingEntries.length > 0 ? 'Entry updated' : 'Entry created', 
      entryId 
    });
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
