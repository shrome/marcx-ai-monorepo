import { Pool } from 'pg';
import * as schema from './schema';
import { drizzle } from 'drizzle-orm/node-postgres';
import dotenv from "dotenv";

dotenv.config({
  path: "../../.env",
});

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set');
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    _db = drizzle(pool, { schema });
  }

  return _db;
}

const db = getDb();
export { db };
