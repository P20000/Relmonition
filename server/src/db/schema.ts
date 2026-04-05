import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const journalEntries = sqliteTable('journal_entries', {
  id: text('id').primaryKey(),
  coupleId: text('couple_id').notNull(),
  content: text('content').notNull(),
  sentimentScore: integer('sentiment_score'), // -1 to 1 scale
  category: text('category'), // 'conflict', 'appreciation', 'repair'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const embeddings = sqliteTable('embeddings', {
  id: text('id').primaryKey(),
  entryId: text('entry_id').references(() => journalEntries.id),
  vector: text('vector'), // Stored as JSON string or binary
});
