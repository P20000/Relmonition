import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function wipeDatabase() {
    const url = process.env.TURSO_API_URL || process.env.TURSO_CONNECTION_URL;
    const authToken = process.env.TURSO_API_TOKEN || process.env.TURSO_AUTH_TOKEN;

    if (!url) {
        console.error("No database URL provided.");
        process.exit(1);
    }

    const client = createClient({ url, authToken });

    console.log("Fetching all tables...");
    const tablesResult = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    const tables = tablesResult.rows.map((row) => row.name as string);

    for (const table of tables) {
        console.log(`Dropping table ${table}...`);
        await client.execute(`DROP TABLE IF EXISTS ${table}`);
    }

    console.log("Database wiped successfully!");
    process.exit(0);
}

wipeDatabase().catch(console.error);
