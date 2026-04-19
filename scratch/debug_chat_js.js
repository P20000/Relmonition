
const { TenantDatabaseManager } = require('./server/dist/tenant-manager');
const schema = require('./server/dist/db/schema');
const { eq } = require('drizzle-orm');

// Wait, I might not have /dist. Let's check.
const tid = 'efead550-b2ec-44f2-a381-1e9401367f89';

async function check() {
  try {
    const tm = new TenantDatabaseManager();
    const { client } = await tm.getDatabaseClient(tid);
    const uploads = await client.select().from(schema.chatUploads).limit(1);
    if (uploads[0]) {
      console.log("FILE CONTENT START:");
      console.log(uploads[0].fileContent.substring(0, 1000));
    } else {
      console.log("No uploads found.");
    }
  } catch (e) {
    console.error(e);
  }
}
check();
