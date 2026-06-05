import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const url = process.env.TURSO_CONNECTION_URL || process.env.TURSO_API_URL;
const authToken = process.env.TURSO_AUTH_TOKEN || process.env.TURSO_API_TOKEN;

async function cleanDatabase() {
  if (!url) {
    console.error("❌ No database URL found in environment variables.");
    process.exit(1);
  }

  console.log("🧼 Connecting to Turso database...");
  const client = createClient({ url, authToken });

  const tables = [
    'sessions',
    'user_preferences',
    'tenant_members',
    'journal_entries',
    'mood_logs',
    'interaction_metrics',
    'ai_insights',
    'embeddings',
    'chat_uploads',
    'ai_provider_configs',
    'coach_messages',
    'coach_conversations',
    'relationship_health_history',
    'partner_profiles',
    'compatibility_insights',
    'audit_logs',
    'users',
    'tenants'
  ];

  try {
    console.log("⚠️ Disabling foreign key constraints...");
    await client.execute("PRAGMA foreign_keys = OFF;");

    for (const table of tables) {
      console.log(`🧹 Deleting all data from table: ${table}...`);
      await client.execute(`DELETE FROM ${table};`);
    }

    console.log("🔒 Re-enabling foreign key constraints...");
    await client.execute("PRAGMA foreign_keys = ON;");

    console.log("🎉 Database cleaned successfully! All tables are now empty.");
  } catch (error) {
    console.error("❌ Error cleaning database:", error);
  } finally {
    process.exit(0);
  }
}

cleanDatabase().catch(console.error);
