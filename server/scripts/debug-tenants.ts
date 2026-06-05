import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const url = process.env.TURSO_CONNECTION_URL || process.env.TURSO_API_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.TURSO_API_TOKEN;

  if (!url) throw new Error('No DB URL');

  const client = createClient({ url, authToken });

  const result = await client.execute(`
    SELECT t.id, t.name, COUNT(tm.user_id) as member_count 
    FROM tenants t
    LEFT JOIN tenant_members tm ON t.id = tm.tenant_id
    GROUP BY t.id
  `);
  console.log('Tenants & Member Counts:', result.rows);
}

main().catch(console.error);
