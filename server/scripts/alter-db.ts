import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const url = process.env.TURSO_CONNECTION_URL || process.env.TURSO_API_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.TURSO_API_TOKEN;

  if (!url) throw new Error('No DB URL');

  const client = createClient({ url, authToken });

  console.log('Adding partner_departed column to tenants table...');
  try {
    await client.execute('ALTER TABLE tenants ADD COLUMN partner_departed integer DEFAULT 0');
    console.log('Successfully added partner_departed column');
  } catch (e: any) {
    if (e.message.includes('duplicate column name')) {
      console.log('Column already exists');
    } else {
      console.error(e);
    }
  }
}

main().catch(console.error);
