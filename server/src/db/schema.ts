import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// 1. Existing Journal Table (Refined)
export const journalEntries = sqliteTable('journal_entries', {
  id: text('id').primaryKey(),
  coupleId: text('couple_id').notNull(),
  content: text('content').notNull(),
  sentimentScore: integer('sentiment_score'), // -1 to 1 scale
  category: text('category'), // 'conflict', 'appreciation', 'repair'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// 2. New: Mood Logs (For "Mood Trend" graphs on the dashboard)
export const moodLogs = sqliteTable('mood_logs', {
  id: text('id').primaryKey(),
  coupleId: text('couple_id').notNull(),
  moodValue: integer('mood_value').notNull(), // 1-10
  label: text('label'), // 'happy', 'stressed', 'anxious'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// 3. New: Interaction Metrics (For the "Gottman Connection Meter")
export const interactionMetrics = sqliteTable('interaction_metrics', {
  id: text('id').primaryKey(),
  coupleId: text('couple_id').notNull(),
  positiveCount: integer('positive_count').default(0),
  negativeCount: integer('negative_count').default(0),
  date: integer('date', { mode: 'timestamp' }).notNull(), // Daily aggregate
});

// 4. New: AI Insights (Cache the AI output for fast dashboard loading)
export const aiInsights = sqliteTable('ai_insights', {
  id: text('id').primaryKey(),
  coupleId: text('couple_id').notNull(),
  type: text('type'), // 'conflict_summary', 'growth_suggestion'
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const embeddings = sqliteTable('embeddings', {
  id: text('id').primaryKey(),
  entryId: text('entry_id').references(() => journalEntries.id),
  vector: text('vector'), // Stored as JSON string
});
