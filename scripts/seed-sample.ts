/**
 * Seed data contoh untuk uji coba.
 * Idempoten — hanya menambah bila datanya belum ada.
 * Jalankan: npx tsx scripts/seed-sample.ts
 */

import { Pool } from "pg";
import { readFileSync, existsSync } from "node:fs";

if (existsSync(".env.local")) {
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
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // Pelanggan
  const customers = [
    ["PT Maju Jaya", "budi@majujaya.com", "081234567890", "Jl. Sudirman No. 1, Jakarta"],
    ["CV Karya Abadi", "info@karyaabadi.com", "081298765432", "Jl. Gatot Subroto No. 5, Bandung"],
  ];
  for (const [name, email, phone, address] of customers) {
    await pool.query(
      `INSERT INTO customers (name, email, phone, address)
       SELECT $1::varchar,$2::varchar,$3::varchar,$4::text
       WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = $1::varchar)`,
      [name, email, phone, address],
    );
  }

  // Pemasok
  const vendors = [
    ["CV Sumber Material", "sales@sumbermaterial.com", "081311112222", "Jl. Industri No. 5, Bekasi"],
  ];
  for (const [name, email, phone, address] of vendors) {
    await pool.query(
      `INSERT INTO vendors (name, email, phone, address)
       SELECT $1::varchar,$2::varchar,$3::varchar,$4::text
       WHERE NOT EXISTS (SELECT 1 FROM vendors WHERE name = $1::varchar)`,
      [name, email, phone, address],
    );
  }

  // Produk
  const products = [
    ["BRG-001", "Semen 40kg", 65000, 100, true],
    ["BRG-002", "Besi Beton 10mm", 85000, 50, true],
    ["JSA-001", "Jasa Pemasangan", 500000, 0, false],
  ];
  for (const [sku, name, price, stock, trackStock] of products) {
    await pool.query(
      `INSERT INTO products (sku, name, price, stock, track_stock)
       SELECT $1::varchar,$2::varchar,$3::numeric,$4::integer,$5::boolean
       WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = $1::varchar)`,
      [sku, name, price, stock, trackStock],
    );
  }

  const c = await pool.query(`SELECT count(*)::int n FROM customers`);
  const v = await pool.query(`SELECT count(*)::int n FROM vendors`);
  const p = await pool.query(`SELECT count(*)::int n FROM products`);
  console.log(`Seed selesai: ${c.rows[0].n} pelanggan, ${v.rows[0].n} pemasok, ${p.rows[0].n} produk.`);

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
