import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const url = process.env.TURSO_CONNECTION_URL || process.env.TURSO_API_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.TURSO_API_TOKEN;
  const client = createClient({ url: url!, authToken: authToken! });

  const tenants = await client.execute('SELECT * FROM tenants');
  const members = await client.execute('SELECT * FROM tenant_members');
  const users = await client.execute('SELECT id, email FROM users');

  console.log('Tenants:', tenants.rows);
  console.log('Members:', members.rows);
  console.log('Users:', users.rows);
}

main().catch(console.error);
