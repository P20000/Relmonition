
const { createClient } = require('@libsql/client');
const path = require('path');
require('dotenv').config({ path: '/media/pranavissam/files and data/programming/mega projects/Relmonition/server/.env' });

async function checkData() {
  const url = process.env.TURSO_CONNECTION_URL || 'file:/media/pranavissam/files and data/programming/mega projects/Relmonition/server/local.db';
  const client = createClient({ url });
  
  try {
    const res = await client.execute("SELECT * FROM relationship_health_history ORDER BY date ASC LIMIT 100");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    client.close();
  }
}

checkData();
