
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '../src/db/schema';
import { embedText } from '../src/services/ai/embeddings-service';
import crypto from 'node:crypto';
import process from 'node:process';

const client = createClient({
  url: process.env.TURSO_API_URL!,
  authToken: process.env.TURSO_API_TOKEN!,
});

const db = drizzle(client, { schema });

async function run() {
  console.log("🚀 Starting Embedding migration to 3072-dims...");

  // 1. Get all journal entries
  const entries = await db.select().from(schema.journalEntries);
  console.log(`Found ${entries.length} journal entries to re-embed.`);

  // 2. Clear current embeddings (optional, but avoids duplicates if some were already 3072)
  // Actually, let's just wipe and start fresh for consistency.
  // Note: Drizzle delete without where requires a specifically created statement or just use raw if needed.
  // We'll just delete everything.
  await client.execute("DELETE FROM embeddings");
  console.log("🧹 Cleared old embeddings.");

  // 3. Re-embed each entry
  for (const entry of entries) {
    try {
      console.log(`Embedding entry ${entry.id.substring(0, 8)}...`);
      const vector = await embedText(entry.content);
      
      await db.insert(schema.embeddings).values({
        id: crypto.randomUUID(),
        entryId: entry.id,
        tenantId: entry.tenantId,
        content: entry.content,
        vector: JSON.stringify(vector),
        createdAt: new Date()
      });
      
      // Small sleep to avoid rate limiting if there are many entries
      await new Promise(r => setTimeout(r, 200));
    } catch (err: any) {
      console.error(`❌ Failed to embed entry ${entry.id}:`, err.message);
    }
  }

  console.log("✅ Embedding migration complete!");
  process.exit(0);
}

run().catch(err => {
  console.error("error", err);
  process.exit(1);
});
