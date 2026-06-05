import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const url = process.env.TURSO_CONNECTION_URL || process.env.TURSO_API_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.TURSO_API_TOKEN;

  if (!url) throw new Error('No DB URL');

  const client = createClient({ url, authToken });

  const result = await client.execute('SELECT tenant_id, COUNT(*) as count FROM tenant_members GROUP BY tenant_id');
  console.log('Tenant Members:', result.rows);
}

main().catch(console.error);
