import { GoogleGenerativeAI } from '@google/generative-ai';
import { TenantDatabaseManager } from '../../tenant-manager';
import * as schema from '../../db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import crypto from 'crypto';
import { RelationshipRAGEngine } from './retrieval-engine';

const tenantManager = new TenantDatabaseManager();

let _genClient: GoogleGenerativeAI | null = null;
function getGenClient(): GoogleGenerativeAI {
  if (!_genClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('[MetricsService] GEMINI_API_KEY is not set.');
    _genClient = new GoogleGenerativeAI(apiKey);
  }
  return _genClient;
}

interface BehavioralAnalysis {
  score: number; // -1 to 1
  category: string; // 'conflict', 'appreciation', 'growth', 'routine'
  primaryEmotion: string;
  bidsCount: number;   // Gottman: attempts to connect
  repairsCount: number; // Gottman: attempts to fix conflict
  conflictScore: number; // 0-10 based on tension
}

/**
 * Processes a new journal entry to extract behavioral metrics, update tables, and trigger insights.
 */
export async function processJournalMetrics(
  tenantId: string,
  entryId: string,
  content: string,
  targetDate?: Date
): Promise<void> {
  console.log(`[Metrics] Processing behavioral metrics for entry ${entryId} in tenant ${tenantId}`);
  
  const { client: db } = await tenantManager.getDatabaseClient(tenantId);
  const genAI = getGenClient();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  // 1. Analyze Behaviors
  const analysis = await analyzeBehavioralMetrics(model, content);
  
  // 2. Update Journal Entry with Score/Category
  await db.update(schema.journalEntries)
    .set({ 
      sentimentScore: Math.round(analysis.score * 100), // Store as integer -100 to 100
      category: analysis.category 
    })
    .where(eq(schema.journalEntries.id, entryId));

  // 3. Update Daily Interaction Metrics
  await updateInteractionMetrics(db, tenantId, analysis, targetDate);

  // 4. Generate/Update AI Insight (Relationship Pulse)
  await updateRelationshipInsight(db, tenantId);
}

async function analyzeBehavioralMetrics(model: any, content: string): Promise<BehavioralAnalysis> {
  const prompt = `
    Analyze this relationship journal entry using the Gottman Method framework.
    Identify connections, repairs, and conflict indicators.
    
    Return a JSON object with:
    - score: float between -1.0 (conflict) and 1.0 (appreciation)
    - category: one of ['conflict', 'appreciation', 'growth', 'routine']
    - primaryEmotion: single word
    - bidsCount: integer count of "Bids for Connection" (attempts to initiate interaction/shared interest)
    - repairsCount: integer count of "Repair Attempts" (attempts to de-escalate, apologize, or use humor during tension)
    - conflictScore: integer 0-10 (level of criticism or stonewalling detected)

    Journal Entry:
    """
    ${content}
    """

    JSON:
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonStr = text.replace(/```json|```/g, '').trim();
    const data = JSON.parse(jsonStr);
    
    return {
      score: data.score ?? 0,
      category: data.category ?? 'routine',
      primaryEmotion: data.primaryEmotion ?? 'neutral',
      bidsCount: data.bidsCount ?? 0,
      repairsCount: data.repairsCount ?? 0,
      conflictScore: data.conflictScore ?? 0
    };
  } catch (error) {
    console.error("[Metrics] Behavioral analysis failed, using fallback:", error);
    return { score: 0, category: 'routine', primaryEmotion: 'neutral', bidsCount: 0, repairsCount: 0, conflictScore: 0 };
  }
}

async function updateInteractionMetrics(db: any, tenantId: string, analysis: BehavioralAnalysis, targetDate?: Date) {
  const metricDate = targetDate ? new Date(targetDate) : new Date();
  metricDate.setHours(0, 0, 0, 0);

  // Check if we have a row for today
  const existing = await db.select()
    .from(schema.interactionMetrics)
    .where(and(
      eq(schema.interactionMetrics.tenantId, tenantId),
      eq(schema.interactionMetrics.date, metricDate)
    ))
    .limit(1);

  if (existing.length > 0) {
    const row = existing[0];
    await db.update(schema.interactionMetrics)
      .set({
        positiveCount: analysis.score > 0 ? (row.positiveCount || 0) + 1 : row.positiveCount,
        negativeCount: analysis.score < 0 ? (row.negativeCount || 0) + 1 : row.negativeCount,
        bidsCount: (row.bidsCount || 0) + analysis.bidsCount,
        repairsCount: (row.repairsCount || 0) + analysis.repairsCount,
        conflictScore: Math.max(row.conflictScore || 0, analysis.conflictScore)
      })
      .where(eq(schema.interactionMetrics.id, row.id));
  } else {
    await db.insert(schema.interactionMetrics).values({
      id: crypto.randomUUID(),
      tenantId,
      date: metricDate,
      positiveCount: analysis.score > 0 ? 1 : 0,
      negativeCount: analysis.score < 0 ? 1 : 0,
      bidsCount: analysis.bidsCount,
      repairsCount: analysis.repairsCount,
      conflictScore: analysis.conflictScore,
    });
  }
}

async function updateRelationshipInsight(db: any, tenantId: string) {
  // Use RAG engine to get recent context and generate a summary insight
  const engine = new RelationshipRAGEngine(db);
  const context = await engine.retrieveContext(tenantId, "Summarize the recent relationship patterns, connection bids, and repair attempts.", 'exploration');
  
  if (context.length < 1) return;

  const model = getGenClient().getGenerativeModel({ model: 'gemini-2.0-flash' });
  const prompt = `
    You are a relationship expert. Based on these recent journal reflections, provide a 
    "Relationship Pulse" insight. 
    Focus on connection bids made and repair attempts noticed.
    Identify one positive pattern and one opportunity for even deeper connection.
    Keep it warm, empathetic, and under 3 sentences. Do NOT reveal individual journal content.

    MEMORIES:
    ${context.map(c => c.content).join('\n---\n')}

    INSIGHT:
  `;

  try {
    const result = await model.generateContent(prompt);
    const content = result.response.text();

    // Store as a new insight
    await db.insert(schema.aiInsights).values({
      id: crypto.randomUUID(),
      tenantId,
      type: 'relationship_pulse',
      content,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("[Metrics] Insight generation failed:", error);
  }
}
