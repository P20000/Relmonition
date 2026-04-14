import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load variables from .env
dotenv.config();

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_API_URL!,
    authToken: process.env.TURSO_API_TOKEN!,
  },
});