import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const url = process.env.TURSO_CONNECTION_URL || process.env.TURSO_API_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.TURSO_API_TOKEN;

  if (!url) throw new Error('No DB URL');

  const client = createClient({ url, authToken });

  const result = await client.execute(`
    SELECT tm.id, tm.user_id, tm.tenant_id, u.id as u_id
    FROM tenant_members tm
    LEFT JOIN users u ON tm.user_id = u.id
    WHERE u.id IS NULL
  `);
  console.log('Dangling Tenant Members:', result.rows);
}

main().catch(console.error);
