/**
 * Koneksi database — PostgreSQL asli via `pg` + Drizzle ORM.
 *
 * DATABASE_URL ada di .env.local. Skema (src/db/schema.ts) tidak berubah
 * bila pindah provider — hanya file ini yang perlu disesuaikan.
 */

import "server-only";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  __pool?: Pool;
  __db?: NodePgDatabase<typeof schema>;
};

function createDb() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });
  globalForDb.__pool = pool;
  return drizzle(pool, { schema });
}

export const db = globalForDb.__db ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__db = db;
}

export { schema };
