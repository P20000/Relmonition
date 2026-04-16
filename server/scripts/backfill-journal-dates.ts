import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as dotenv from 'dotenv';
import * as schema from '../src/db/schema';
import { eq, isNull, sql } from 'drizzle-orm';

dotenv.config();

const DB_URL  = process.env.TURSO_API_URL  || '';
const DB_TOKEN = process.env.TURSO_API_TOKEN || '';

if (!DB_URL) {
  console.error('❌  TURSO_API_URL not set in .env');
  process.exit(1);
}

const client = createClient({ url: DB_URL, authToken: DB_TOKEN });
const db = drizzle(client, { schema });

async function backfill() {
  console.log('🔍  Fetching journal entries for backfill...');
  
  // Get all entries. We check for the default value we used earlier as well as NULLs
  const entries = await db.select().from(schema.journalEntries);
  
  console.log(`📊  Found ${entries.length} entries. Processing...`);

  let updatedCount = 0;
  for (const entry of entries) {
    const rawCreatedAt = (entry as any).createdAt;
    
    let dateObj: Date;
    if (typeof rawCreatedAt === 'number') {
        // Handle Unix timestamp
        // If it's < 10,000,000,000, it's seconds
        if (rawCreatedAt < 10000000000) {
            dateObj = new Date(rawCreatedAt * 1000);
        } else {
            dateObj = new Date(rawCreatedAt);
        }
    } else {
        dateObj = new Date(rawCreatedAt);
    }

    if (isNaN(dateObj.getTime())) {
        console.warn(`⚠️  Invalid date for entry ${entry.id}:`, rawCreatedAt);
        continue;
    }

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const localDateStr = `${year}-${month}-${day}`;

    console.log(`📝  ID: ${entry.id.substring(0,8)} | createdAt: ${rawCreatedAt} | current date: ${entry.date} | target date: ${localDateStr}`);

    // Only update if the date is different from the current one (to be safe)
    if (entry.date !== localDateStr) {
        await db.update(schema.journalEntries)
            .set({ date: localDateStr })
            .where(eq(schema.journalEntries.id, entry.id));
        updatedCount++;
    }
  }

  console.log(`✅  Backfill complete! Updated ${updatedCount} entries.`);
  process.exit(0);
}

backfill().catch(err => {
  console.error('❌  Backfill failed:', err);
  process.exit(1);
});
