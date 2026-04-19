
import { TenantDatabaseManager } from '../../tenant-manager';
import * as schema from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import { RelationshipRAGEngine } from './retrieval-engine';
import { getLLMProvider } from './providers/factory';

const tenantManager = new TenantDatabaseManager();

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
  console.log(`[Metrics] Processing behavioral metrics for entry ${entryId} in tenant ${tenantId} (Hybrid Mode)`);
  
  const { client: db } = await tenantManager.getDatabaseClient(tenantId);
  const provider = await getLLMProvider(tenantId);

  // 1. Analyze Behaviors
  const analysis = await analyzeBehavioralMetrics(provider, content);
  
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

async function analyzeBehavioralMetrics(provider: any, content: string): Promise<BehavioralAnalysis> {
  const systemInstruction = "You are a relationship metrics analyzer using the Gottman Method.";
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
    const text = await provider.generateText(prompt, systemInstruction);
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

  const provider = await getLLMProvider(tenantId);
  const systemInstruction = "You are a relationship expert.";
  const prompt = `
    Based on these recent journal reflections, provide a 
    "Relationship Pulse" insight. 
    Focus on connection bids made and repair attempts noticed.
    Identify one positive pattern and one opportunity for even deeper connection.
    Keep it warm, empathetic, and under 3 sentences. Do NOT reveal individual journal content.

    MEMORIES:
    ${context.map(c => c.content).join('\n---\n')}

    INSIGHT:
  `;

  try {
    const content = await provider.generateText(prompt, systemInstruction);

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

/**
 * Analyzes deep historical data from a chat log to populate the relationship history chart.
 */
export async function analyzeHistoryFromChat(
  tenantId: string,
  content: string
): Promise<void> {
  console.log(`[Metrics] Starting deep historical analysis for tenant ${tenantId}`);
  const { client: db } = await tenantManager.getDatabaseClient(tenantId);
  const provider = await getLLMProvider(tenantId);

  // 1. Group by Week
  const weeklyBuckets = extractWeeklyWindows(content);
  console.log(`[Metrics] Identified ${weeklyBuckets.size} weeks of history.`);

  // 2. Process each week
  for (const [weekDate, lines] of weeklyBuckets.entries()) {
    const chatSnippet = lines.join('\n');
    if (chatSnippet.length < 50) continue;

    console.log(`[Metrics] Analyzing week: ${weekDate}`);
    
    // 3. Smart Skip: Check if this week is already analyzed to save Gemini quota
    const existing = await db.select().from(schema.relationshipHealthHistory)
      .where(and(
        eq(schema.relationshipHealthHistory.tenantId, tenantId),
        eq(schema.relationshipHealthHistory.date, weekDate)
      ))
      .limit(1);

    if (existing.length > 0 && existing[0].score !== 50 && existing[0].summary !== 'Analysis pending.') {
      console.log(`[Metrics] Skipping already analyzed week: ${weekDate}`);
      continue;
    }

    // 4. Analyze with Rate-Limit Pacing
    try {
      const analysis = await analyzeHistoricalWeek(provider, chatSnippet);
      
      // 5. Update DB
      await db.insert(schema.relationshipHealthHistory).values({
        id: crypto.randomUUID(),
        tenantId,
        date: weekDate,
        score: analysis.score,
        partner1Mood: analysis.partner1Mood,
        partner2Mood: analysis.partner2Mood,
        summary: analysis.summary,
        createdAt: new Date(),
      }).onConflictDoUpdate({
        target: [schema.relationshipHealthHistory.tenantId, schema.relationshipHealthHistory.date],
        set: {
          score: analysis.score,
          partner1Mood: analysis.partner1Mood,
          partner2Mood: analysis.partner2Mood,
          summary: analysis.summary,
        }
      });
    } catch (err: any) {
      console.warn(`[Metrics] Failed to analyze week ${weekDate}, skipping after rate limit or error.`, err.message);
    }

    // Add a conservative pacing delay (4 seconds) to stay well under Gemini Free Tier limits (15 RPM)
    await new Promise(resolve => setTimeout(resolve, 4000));
  }
  
  console.log(`[Metrics] Historical analysis complete for tenant ${tenantId}`);
}

function extractWeeklyWindows(chatContent: string): Map<string, string[]> {
  const weeks = new Map<string, string[]>();
  const lines = chatContent.split('\n');
  
  // Stricter regex to ensure we match at the start of a line
  const dateRegex = /^(?:\[)?(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;

  const now = new Date();
  const minDate = new Date('2015-01-01');

  // Format tracking: -1 for unknown, 0 for MM/DD, 1 for DD/MM
  let formatType = -1; 

  for (const line of lines) {
    const match = line.trim().match(dateRegex);
    if (match) {
      try {
        const seg1 = parseInt(match[1]);
        const seg2 = parseInt(match[2]);
        const year = match[3];

        // Auto-detect format if not yet known
        if (formatType === -1) {
          if (seg1 > 12) formatType = 1; // Must be DD/MM
          else if (seg2 > 12) formatType = 0; // Must be MM/DD
        }

        // Construct date string based on detected or default (US) format
        const dateStr = formatType === 1 
          ? `${match[2]}/${match[1]}/${year}` // Convert DD/MM to MM/DD for JS Date
          : `${match[1]}/${match[2]}/${year}`;

        const parsedDate = new Date(dateStr);
        
        // Sanity Check: Must be valid and within range
        if (isNaN(parsedDate.getTime()) || parsedDate < minDate || parsedDate > now) {
          continue;
        }

        // Immutable calculation of Sunday
        const day = parsedDate.getDay();
        const diff = parsedDate.getDate() - day;
        const sunday = new Date(parsedDate);
        sunday.setDate(diff); // Use a clone to avoid mutating original parsedDate for filter safety
        sunday.setHours(0, 0, 0, 0);
        
        const weekKey = sunday.toISOString().split('T')[0];
        
        if (!weeks.has(weekKey)) weeks.set(weekKey, []);
        if (weeks.get(weekKey)!.length < 40) {
          weeks.get(weekKey)!.push(line);
        }
      } catch (e) { /* skip */ }
    }
  }
  return weeks;
}

async function analyzeHistoricalWeek(provider: any, chatSnippet: string): Promise<{
  score: number;
  partner1Mood: string;
  partner2Mood: string;
  summary: string;
}> {
  const systemInstruction = "You are a professional relationship behavioral analyst specializing in granular sentiment detection.";
  const prompt = `
    Analyze this one-week snippet of a couple's chat history.
    Detect the emotional atmosphere and the "Relational Health Score".
    
    CRITICAL INSTRUCTION:
    Be highly granular and specific with the "score" (0-100). 
    - 50 is NEUTRAL. 
    - Avoid returning exactly 50 unless the week is truly unremarkable.
    - Use scores like 68, 72, 45, 38 to show nuance.
    - Higher score (70+) = high positive affect, mutual support, playfulness.
    - Lower score (<50) = tension, stonewalling, or high stress lack of connection.
    
    Return a JSON object:
    {
      "score": integer (0-100),
      "partner1Mood": "word",
      "partner2Mood": "word",
      "summary": "Max 12 words highlighting the specific dynamic of THIS week"
    }
    
    CHAT SNIPPET:
    """
    ${chatSnippet}
    """
    
    JSON:
  `;

  try {
    const text = await provider.generateText(prompt, systemInstruction);
    const jsonStr = text.replace(/```json|```/g, '').trim();
    const data = JSON.parse(jsonStr);
    
    return {
      score: data.score ?? 50,
      partner1Mood: data.partner1Mood ?? 'neutral',
      partner2Mood: data.partner2Mood ?? 'neutral',
      summary: data.summary ?? 'A stable week of connection.'
    };
  } catch (error) {
    return { score: 50, partner1Mood: 'neutral', partner2Mood: 'neutral', summary: 'Analysis pending.' };
  }
}
