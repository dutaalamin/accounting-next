/**
 * Cek integritas database: pastikan tidak ada jurnal yang tidak balance.
 * Jalankan: npx tsx scripts/check-db.ts
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

async function main() {
  loadEnv();
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const counts = await pool.query(`
    SELECT
      (SELECT count(*)::int FROM customer_invoices WHERE deleted_at IS NULL) AS cust_inv,
      (SELECT count(*)::int FROM supplier_invoices WHERE deleted_at IS NULL) AS supp_inv,
      (SELECT count(*)::int FROM journal_entries WHERE deleted_at IS NULL) AS journals,
      (SELECT count(*)::int FROM accounts WHERE deleted_at IS NULL) AS accounts
  `);
  const c = counts.rows[0];
  console.log(
    `Akun: ${c.accounts} | Invoice pelanggan: ${c.cust_inv} | Invoice pemasok: ${c.supp_inv} | Jurnal: ${c.journals}`,
  );

  // Cek tiap jurnal balance
  const unbalanced = await pool.query(`
    SELECT e.id, e.reference_number,
           SUM(l.debit)::numeric AS debit, SUM(l.credit)::numeric AS credit
    FROM journal_entries e
    JOIN journal_entry_lines l ON l.journal_entry_id = e.id
    WHERE e.deleted_at IS NULL
    GROUP BY e.id, e.reference_number
    HAVING ABS(SUM(l.debit) - SUM(l.credit)) >= 0.01
  `);

  if (unbalanced.rows.length === 0) {
    console.log("OK: semua jurnal BALANCE (debit = kredit).");
  } else {
    console.log(`PERINGATAN: ${unbalanced.rows.length} jurnal tidak balance:`);
    for (const r of unbalanced.rows) {
      console.log(`  #${r.id} ${r.reference_number}: debit=${r.debit} kredit=${r.credit}`);
    }
  }

  // Cek stok negatif
  const negStock = await pool.query(
    "SELECT id, name, stock FROM products WHERE track_stock = true AND stock < 0",
  );
  if (negStock.rows.length === 0) {
    console.log("OK: tidak ada stok negatif.");
  } else {
    console.log(`PERINGATAN: ${negStock.rows.length} produk stok negatif:`);
    for (const r of negStock.rows) console.log(`  ${r.name}: ${r.stock}`);
  }

  // Cek baris jurnal yatim (tanpa akun valid)
  const orphan = await pool.query(`
    SELECT count(*)::int n FROM journal_entry_lines l
    LEFT JOIN accounts a ON a.id = l.account_id
    WHERE a.id IS NULL
  `);
  console.log(orphan.rows[0].n === 0 ? "OK: tidak ada baris jurnal yatim." : `PERINGATAN: ${orphan.rows[0].n} baris yatim.`);

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
