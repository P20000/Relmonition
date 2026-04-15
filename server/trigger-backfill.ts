import 'dotenv/config';
import { backfillAllTenants } from './src/utils/backfill-metrics';

async function run() {
  console.log("🚀 Starting manual metrics backfill...");
  await backfillAllTenants();
  console.log("✅ Backfill complete!");
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
