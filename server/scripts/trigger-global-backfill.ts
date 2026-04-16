import * as dotenv from 'dotenv';
import { backfillAllTenants } from '../src/utils/backfill-metrics';

dotenv.config();

async function run() {
    console.log('🚀 Starting Global Metrics Backfill...');
    await backfillAllTenants();
    console.log('🏁 Global Metrics Backfill Finished!');
    process.exit(0);
}

run().catch(err => {
    console.error('❌ Global Backfill failed:', err);
    process.exit(1);
});
