import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env and add your Neon connection string.');
}

// WebSocket driver is selected so order creation and stock updates can use DB transactions.
const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });
