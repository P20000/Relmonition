import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';

// Load env from the server directory .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const url = process.env.TURSO_CONNECTION_URL || process.env.TURSO_API_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.TURSO_API_TOKEN;

  if (!url) throw new Error('No DB URL found in environment');

  const client = createClient({ url, authToken });

  console.log('Adding tenant_db_token column to tenants table...');
  try {
    await client.execute('ALTER TABLE tenants ADD COLUMN tenant_db_token text');
    console.log('Successfully added tenant_db_token column');
  } catch (e: any) {
    if (e.message.includes('duplicate column name') || e.message.includes('already exists')) {
      console.log('tenant_db_token column already exists');
    } else {
      console.error(e);
    }
  }
}

main().catch(console.error);
