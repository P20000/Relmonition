import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { tenants } from '../src/db/schema';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const url = process.env.TURSO_CONNECTION_URL || process.env.TURSO_API_URL || '';
const authToken = process.env.TURSO_AUTH_TOKEN || process.env.TURSO_API_TOKEN || '';

async function main() {
  if (!url || !authToken) {
    console.error("Error: TURSO_CONNECTION_URL and TURSO_AUTH_TOKEN must be set in the environment.");
    process.exit(1);
  }
  console.log("Connecting to Turso...");
  const client = createClient({ url, authToken });
  const db = drizzle(client);
  try {
    const result = await db.select().from(tenants);
    console.log("Tenants found:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Drizzle query failed:", err);
  }
  process.exit(0);
}

main();
