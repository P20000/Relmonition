import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';

// Load env from the server directory .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const url = process.env.TURSO_CONNECTION_URL || process.env.TURSO_API_URL || process.env.TURSO_API_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.TURSO_API_TOKEN || process.env.TURSO_API_TOKEN;

  if (!url) throw new Error('No DB URL found in environment');

  const client = createClient({ url, authToken });

  console.log('Adding status column to tenants table...');
  try {
    await client.execute("ALTER TABLE tenants ADD COLUMN status text DEFAULT 'active'");
    console.log('Successfully added status column');
  } catch (e: any) {
    if (e.message.includes('duplicate column name')) {
      console.log('status column already exists');
    } else {
      console.error(e);
    }
  }

  console.log('Adding provisioning_error column to tenants table...');
  try {
    await client.execute('ALTER TABLE tenants ADD COLUMN provisioning_error text');
    console.log('Successfully added provisioning_error column');
  } catch (e: any) {
    if (e.message.includes('duplicate column name')) {
      console.log('provisioning_error column already exists');
    } else {
      console.error(e);
    }
  }

  console.log('Adding provisioning_attempts column to tenants table...');
  try {
    await client.execute('ALTER TABLE tenants ADD COLUMN provisioning_attempts integer DEFAULT 0');
    console.log('Successfully added provisioning_attempts column');
  } catch (e: any) {
    if (e.message.includes('duplicate column name')) {
      console.log('provisioning_attempts column already exists');
    } else {
      console.error(e);
    }
  }
}

main().catch(console.error);
