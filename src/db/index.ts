/**
 * Koneksi database — PostgreSQL via `pg` + Drizzle ORM.
 *
 * Mendukung dua lingkungan:
 *  - Lokal   : PostgreSQL di komputer (tanpa SSL)
 *  - Cloud   : Neon / Supabase / Railway (WAJIB SSL, koneksi dibatasi)
 *
 * Skema (src/db/schema.ts) tidak berubah bila pindah provider — hanya
 * konfigurasi di file ini.
 */

import "server-only";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  __pool?: Pool;
  __db?: NodePgDatabase<typeof schema>;
};

/** Apakah URL mengarah ke database lokal? */
function isLocal(connectionString: string): boolean {
  return /@(localhost|127\.0\.0\.1|\[::1\])/.test(connectionString);
}

function createDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL belum di-set. Salin .env.example menjadi .env.local, " +
        "atau isi variabel ini di dashboard hosting.",
    );
  }

  const local = isLocal(connectionString);

  const pool = new Pool({
    connectionString,
    // Neon & penyedia cloud lain butuh SSL. Untuk localhost tidak perlu.
    // `rejectUnauthorized: false` dipakai karena sertifikat penyedia
    // managed sering tidak terpasang di lingkungan serverless.
    ssl: local ? undefined : { rejectUnauthorized: false },
    // Serverless (Vercel) membuat banyak instance fungsi; batasi jumlah
    // koneksi per instance supaya tidak menghabiskan kuota database.
    max: local ? 10 : 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 15_000,
  });

  globalForDb.__pool = pool;
  return drizzle(pool, { schema });
}

export const db = globalForDb.__db ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__db = db;
}

export { schema };
