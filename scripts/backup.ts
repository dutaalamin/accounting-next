/**
 * Backup & restore database.
 *
 *   npx tsx scripts/backup.ts backup            -> simpan ke backups/backup-<waktu>.json
 *   npx tsx scripts/backup.ts list              -> daftar file backup
 *   npx tsx scripts/backup.ts restore <file>    -> pulihkan dari file backup
 *
 * Backup berisi SELURUH data (akun, jurnal, invoice, master, user) dalam JSON,
 * jadi tidak bergantung pada tool pg_dump yang mungkin belum terpasang.
 */

import { Pool } from "pg";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

function loadEnv() {
  if (!existsSync(".env.local")) return;
  for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    if (!process.env[key]) process.env[key] = line.slice(eq + 1).trim();
  }
}

/** Urutan penting: tabel yang direferensikan harus ada lebih dulu. */
const TABLES = [
  "users",
  "accounts",
  "customers",
  "vendors",
  "products",
  "journal_entries",
  "journal_entry_lines",
  "customer_invoices",
  "customer_invoice_lines",
  "supplier_invoices",
  "supplier_invoice_lines",
];

const BACKUP_DIR = "backups";

async function backup(pool: Pool) {
  const data: Record<string, unknown[]> = {};
  let total = 0;

  for (const t of TABLES) {
    const r = await pool.query(`SELECT * FROM ${t}`);
    data[t] = r.rows;
    total += r.rows.length;
  }

  if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const file = join(BACKUP_DIR, `backup-${stamp}.json`);
  writeFileSync(file, JSON.stringify({ createdAt: new Date().toISOString(), data }, null, 2));

  console.log(`Backup selesai: ${file}`);
  console.log(`  ${total} baris dari ${TABLES.length} tabel.`);
}

async function list() {
  if (!existsSync(BACKUP_DIR)) {
    console.log("Belum ada folder backups/.");
    return;
  }
  const files = readdirSync(BACKUP_DIR).filter((f) => f.endsWith(".json")).sort().reverse();
  if (files.length === 0) {
    console.log("Belum ada file backup.");
    return;
  }
  console.log(`\n${files.length} file backup (terbaru dulu):\n`);
  for (const f of files) console.log(`  ${f}`);
  console.log();
}

async function restore(pool: Pool, file: string) {
  if (!existsSync(file)) {
    console.error(`File tidak ditemukan: ${file}`);
    process.exit(1);
  }
  const parsed = JSON.parse(readFileSync(file, "utf8"));
  const data = parsed.data as Record<string, Record<string, unknown>[]>;

  console.log("PERINGATAN: restore akan MENGGANTI seluruh data yang ada sekarang.");
  console.log(`File: ${file} (dibuat ${parsed.createdAt})`);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Kosongkan dulu (urutan terbalik karena foreign key).
    for (const t of [...TABLES].reverse()) {
      await client.query(`DELETE FROM ${t}`);
    }
    // Isi ulang.
    for (const t of TABLES) {
      const rows = data[t] ?? [];
      for (const row of rows) {
        const cols = Object.keys(row);
        const vals = cols.map((_, i) => `$${i + 1}`);
        await client.query(
          `INSERT INTO ${t} (${cols.map((c) => `"${c}"`).join(",")}) VALUES (${vals.join(",")})`,
          cols.map((c) => row[c]),
        );
      }
      // Selaraskan sequence id agar insert berikutnya tidak bentrok.
      if (rows.length > 0) {
        await client.query(
          `SELECT setval(pg_get_serial_sequence('${t}', 'id'), COALESCE((SELECT MAX(id) FROM ${t}), 1))`,
        );
      }
      console.log(`  ${t}: ${rows.length} baris dipulihkan`);
    }
    await client.query("COMMIT");
    console.log("Restore selesai.");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Restore gagal, data lama tidak berubah:", e);
    process.exit(1);
  } finally {
    client.release();
  }
}

async function main() {
  loadEnv();
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const [cmd, arg] = process.argv.slice(2);

  if (cmd === "list") {
    await list();
  } else if (cmd === "restore") {
    if (!arg) {
      console.error("Pakai: restore <file-backup>");
      process.exit(1);
    }
    await restore(pool, arg);
  } else {
    await backup(pool);
  }

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
