import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// ----------------------------------------------------
// CORE IDENTITY LAYER
// ----------------------------------------------------
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  billingStatus: text('billing_status').default('free'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  token: text('token').notNull().unique(),
  userId: text('user_id').notNull().references(() => users.id),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const userPreferences = sqliteTable('user_preferences', {
  userId: text('user_id').primaryKey().references(() => users.id),
  darkMode: integer('dark_mode', { mode: 'boolean' }).default(true),
  notifications: integer('notifications', { mode: 'boolean' }).default(true),
  dataSharing: integer('data_sharing', { mode: 'boolean' }).default(false),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// ----------------------------------------------------
// MULTI-TENANT LAYER
// ----------------------------------------------------
export const tenants = sqliteTable('tenants', {
  id: text('id').primaryKey(),
  name: text('name'),
  connectionCode: text('connection_code').notNull().unique(),
  tenantDbUrl: text('tenant_db_url'), // For specific DB-level isolation
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// The join table between users and connection tenants
export const tenantMembers = sqliteTable('tenant_members', {
  userId: text('user_id').notNull(),
  tenantId: text('tenant_id').notNull(),
  role: text('role').notNull(),          // 'owner' | 'member'
  label: text('label'),                  // e.g. 'Partner 1'
  joinedAt: integer('joined_at', { mode: 'timestamp' }).notNull(),
});

// ----------------------------------------------------
// TENANT DATA MODELS
// ----------------------------------------------------

// 1. Existing Journal Table (Refined)
export const journalEntries = sqliteTable('journal_entries', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  userId: text('user_id').notNull(),      // Knowing who wrote what
  prompt: text('prompt'),                 // The question for the day
  content: text('content').notNull(),
  sentimentScore: integer('sentiment_score'), // -1 to 1 scale
  category: text('category'), // 'conflict', 'appreciation', 'repair'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// 2. New: Mood Logs (For "Mood Trend" graphs on the dashboard)
export const moodLogs = sqliteTable('mood_logs', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  moodValue: integer('mood_value').notNull(), // 1-10
  label: text('label'), // 'happy', 'stressed', 'anxious'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// 3. New: Interaction Metrics (For the "Gottman Connection Meter")
export const interactionMetrics = sqliteTable('interaction_metrics', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  positiveCount: integer('positive_count').default(0),
  negativeCount: integer('negative_count').default(0),
  date: integer('date', { mode: 'timestamp' }).notNull(), // Daily aggregate
});

// 4. New: AI Insights (Cache the AI output for fast dashboard loading)
export const aiInsights = sqliteTable('ai_insights', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  type: text('type'), // 'conflict_summary', 'growth_suggestion'
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const embeddings = sqliteTable('embeddings', {
  id: text('id').primaryKey(),
  entryId: text('entry_id').references(() => journalEntries.id),
  tenantId: text('tenant_id').notNull(),      // for tenant-scoped retrieval
  content: text('content').notNull(),         // original text for context window
  vector: text('vector').notNull(),           // JSON-serialised float[] from Gemini
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(), // for exploration mode ordering
});
