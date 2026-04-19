
import { TenantDatabaseManager } from './server/src/tenant-manager';
import * as schema from './server/src/db/schema';
import { eq } from 'drizzle-orm';

const tid = 'efead550-b2ec-44f2-a381-1e9401367f89';
const tm = new TenantDatabaseManager();

async function check() {
  const { client } = await tm.getDatabaseClient(tid);
  const uploads = await client.select().from(schema.chatUploads).limit(1);
  if (uploads[0]) {
    console.log("FILE CONTENT START:");
    console.log(uploads[0].fileContent.substring(0, 1000));
  } else {
    console.log("No uploads found.");
  }
  process.exit(0);
}

check();
