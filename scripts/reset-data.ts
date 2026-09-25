/**
 * Reset data untuk mulai dari nol.
 *
 *   npx tsx scripts/reset-data.ts            -> lihat pratinjau (tidak menghapus)
 *   npx tsx scripts/reset-data.ts --confirm  -> jalankan penghapusan
 *
 * YANG DIHAPUS  : semua transaksi & master data (jurnal, invoice, pelanggan,
 *                 pemasok, produk) — data uji coba / data lama.
 * YANG DISIMPAN : akun COA (kerangka standar akuntansi) dan akun pengguna
 *                 (supaya tetap bisa login).
 *
 * Opsi:
 *   --keep-accounts   ikut hapus akun COA juga (hati-hati!)
 *   --keep-users      ikut hapus semua pengguna (kamu akan terkunci!)
 */

import { Pool } from "pg";
import { readFileSync, existsSync } from "node:fs";

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

/** Urutan aman untuk DELETE (anak dulu, induk belakangan). */
const TRANSACTION_TABLES = [
  "journal_entry_lines",
  "journal_entries",
  "customer_invoice_lines",
  "customer_invoices",
  "supplier_invoice_lines",
  "supplier_invoices",
  "products",
  "customers",
  "vendors",
];

async function main() {
  loadEnv();
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const args = process.argv.slice(2);
  const confirm = args.includes("--confirm");
  const wipeAccounts = args.includes("--keep-accounts");
  const wipeUsers = args.includes("--keep-users");

  const tables = [...TRANSACTION_TABLES];
  if (wipeAccounts) tables.push("accounts");
  if (wipeUsers) tables.push("users");

  // Hitung isi sekarang
  console.log("\n=== ISI DATABASE SEKARANG ===");
  for (const t of tables) {
    const r = await pool.query(`SELECT count(*)::int n FROM ${t}`);
    console.log(`  ${t.padEnd(26)} ${r.rows[0].n} baris`);
  }

  if (!confirm) {
    console.log("\n=== PRATINJAU (belum ada yang dihapus) ===");
    console.log("Yang akan DIKOSONGKAN:");
    for (const t of tables) console.log(`  - ${t}`);
    console.log("\nYang DIPERTAHANKAN:");
    if (!wipeAccounts) console.log("  - accounts (kerangka COA standar)");
    if (!wipeUsers) console.log("  - users (akun login)");
    console.log("\nJalankan ulang dengan --confirm untuk benar-benar menghapus:");
    console.log("  npx tsx scripts/reset-data.ts --confirm\n");
    await pool.end();
    return;
  }

  console.log("\n=== MENGHAPUS ===");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const t of tables) {
      const r = await client.query(`DELETE FROM ${t}`);
      console.log(`  ${t.padEnd(26)} ${r.rowCount} baris dihapus`);
      // Selaraskan sequence agar id berikutnya tidak bentrok.
      if (!["journal_entry_lines", "customer_invoice_lines", "supplier_invoice_lines"].includes(t)) {
        await client.query(
          `SELECT setval(pg_get_serial_sequence('${t}', 'id'), 1, false)`,
        );
      }
    }
    await client.query("COMMIT");
    console.log("\nSelesai. Database siap diisi dari nol.\n");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Gagal, data tidak berubah:", e);
    process.exit(1);
  } finally {
    client.release();
  }

  // Verifikasi akhir
  const acc = await pool.query("SELECT count(*)::int n FROM accounts");
  const usr = await pool.query("SELECT count(*)::int n FROM users");
  const jr = await pool.query("SELECT count(*)::int n FROM journal_entries");
  console.log("=== HASIL ===");
  console.log(`  akun COA    : ${acc.rows[0].n}`);
  console.log(`  pengguna    : ${usr.rows[0].n}`);
  console.log(`  jurnal      : ${jr.rows[0].n}`);

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
