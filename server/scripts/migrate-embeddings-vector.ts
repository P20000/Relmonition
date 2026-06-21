import 'dotenv/config';
import { drizzle } from 'drizzle-orm/libsql';
import { eq } from 'drizzle-orm';
import { createClient } from '@libsql/client';
import * as schema from '../src/db/schema';
import { embedText, batchEmbedTexts } from '../src/services/ai/embeddings-service';
import crypto from 'node:crypto';
import process from 'node:process';

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL || process.env.TURSO_API_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN || process.env.TURSO_API_TOKEN!,
});

const db = drizzle(client, { schema });

async function run() {
  console.log("🚀 Starting Embedding migration to F32_BLOB(768) with native vector index...");

  // 1. Drop existing embeddings table to recreate it with the correct type
  console.log("🧹 Dropping old embeddings table...");
  await client.execute("DROP TABLE IF EXISTS embeddings;");

  // 2. Create the new embeddings table with F32_BLOB(768) type
  console.log("🏗️ Creating new embeddings table with F32_BLOB(768)...");
  await client.execute(`
    CREATE TABLE embeddings (
      id TEXT PRIMARY KEY,
      entry_id TEXT REFERENCES journal_entries(id) ON DELETE CASCADE,
      chat_upload_id TEXT REFERENCES chat_uploads(id) ON DELETE CASCADE,
      tenant_id TEXT NOT NULL,
      content TEXT NOT NULL,
      vector F32_BLOB(768) NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  // 3. Create the native LibSQL vector index using metric=cosine
  console.log("⚡ Creating native LibSQL vector index (metric=cosine)...");
  await client.execute(`
    CREATE INDEX IF NOT EXISTS embeddings_vector_idx ON embeddings (libsql_vector_idx(vector, 'metric=cosine'));
  `);

  // 4. Re-embed journal entries
  const entries = await db.select().from(schema.journalEntries);
  console.log(`Found ${entries.length} journal entries to re-embed.`);

  for (const entry of entries) {
    try {
      console.log(`Embedding journal entry ${entry.id.substring(0, 8)}...`);
      const vector = await embedText(entry.content, entry.tenantId);
      
      await db.insert(schema.embeddings).values({
        id: crypto.randomUUID(),
        entryId: entry.id,
        tenantId: entry.tenantId,
        content: entry.content,
        vector: vector, // Drizzle customType handles Buffer/binary conversion
        createdAt: new Date()
      });
      
      await new Promise(r => setTimeout(r, 200));
    } catch (err: any) {
      console.error(`❌ Failed to embed journal entry ${entry.id}:`, err);
    }
  }

  // 5. Re-embed chat uploads
  const uploads = await db.select().from(schema.chatUploads).where(eq(schema.chatUploads.processed, true));
  console.log(`Found ${uploads.length} processed chat uploads to re-embed.`);

  for (const upload of uploads) {
    try {
      console.log(`Embedding chat upload ${upload.id.substring(0, 8)} (${upload.fileName})...`);
      
      const content = upload.fileContent;
      const CHUNK_SIZE = 1200;
      const OVERLAP = 200;
      const chunks: string[] = [];
      
      let start = 0;
      while (start < content.length) {
        const end = Math.min(start + CHUNK_SIZE, content.length);
        chunks.push(content.substring(start, end));
        start += (CHUNK_SIZE - OVERLAP);
        if (start >= content.length) break;
      }

      console.log(`  Created ${chunks.length} chunks to embed.`);

      const BATCH_SIZE = 100;
      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const chunkBatch = chunks.slice(i, i + BATCH_SIZE);
        const vectors = await batchEmbedTexts(chunkBatch, upload.tenantId);

        const valuesToInsert = chunkBatch.map((text, idx) => ({
          id: crypto.randomUUID(),
          chatUploadId: upload.id,
          tenantId: upload.tenantId,
          content: text,
          vector: vectors[idx],
          createdAt: new Date()
        })).filter(item => item.vector && item.vector.length > 0);

        if (valuesToInsert.length > 0) {
          await db.insert(schema.embeddings).values(valuesToInsert);
        }
      }

      console.log(`✅ Chat upload ${upload.id.substring(0, 8)} successfully re-embedded.`);
    } catch (err: any) {
      console.error(`❌ Failed to embed chat upload ${upload.id}:`, err);
    }
  }

  console.log("✅ Embedding migration to native vector format complete!");
  process.exit(0);
}

run().catch(err => {
  console.error("error", err);
  process.exit(1);
});
