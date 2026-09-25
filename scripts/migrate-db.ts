/**
 * Migrasi tambahan: buat tabel master data & invoice.
 * Idempoten — aman dijalankan berulang.
 * Jalankan: npx tsx scripts/migrate-db.ts
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

const DDL = `
CREATE TABLE IF NOT EXISTS customers (
  id serial PRIMARY KEY,
  name varchar(255) NOT NULL,
  email varchar(255),
  phone varchar(50),
  address text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vendors (
  id serial PRIMARY KEY,
  name varchar(255) NOT NULL,
  email varchar(255),
  phone varchar(50),
  address text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id serial PRIMARY KEY,
  sku varchar(100) UNIQUE,
  name varchar(255) NOT NULL,
  price numeric(15,2) NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  track_stock boolean NOT NULL DEFAULT true,
  description text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_invoices (
  id serial PRIMARY KEY,
  customer_id integer NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  invoice_number varchar(100) NOT NULL UNIQUE,
  invoice_date date NOT NULL,
  due_date date,
  tax_percentage numeric(5,2) NOT NULL DEFAULT 0,
  tax_amount numeric(15,2) NOT NULL DEFAULT 0,
  total_amount numeric(15,2) NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT 'unpaid',
  notes text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS customer_invoices_customer_idx ON customer_invoices(customer_id);

CREATE TABLE IF NOT EXISTS customer_invoice_lines (
  id serial PRIMARY KEY,
  customer_invoice_id integer NOT NULL REFERENCES customer_invoices(id) ON DELETE CASCADE,
  product_id integer REFERENCES products(id) ON DELETE SET NULL,
  description varchar(255),
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(15,2) NOT NULL DEFAULT 0,
  subtotal numeric(15,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS customer_invoice_lines_invoice_idx ON customer_invoice_lines(customer_invoice_id);

CREATE TABLE IF NOT EXISTS supplier_invoices (
  id serial PRIMARY KEY,
  vendor_id integer NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  invoice_number varchar(100) NOT NULL UNIQUE,
  invoice_date date NOT NULL,
  due_date date,
  tax_percentage numeric(5,2) NOT NULL DEFAULT 0,
  tax_amount numeric(15,2) NOT NULL DEFAULT 0,
  total_amount numeric(15,2) NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT 'unpaid',
  notes text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supplier_invoices_vendor_idx ON supplier_invoices(vendor_id);

CREATE TABLE IF NOT EXISTS supplier_invoice_lines (
  id serial PRIMARY KEY,
  supplier_invoice_id integer NOT NULL REFERENCES supplier_invoices(id) ON DELETE CASCADE,
  product_id integer REFERENCES products(id) ON DELETE SET NULL,
  description varchar(255),
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(15,2) NOT NULL DEFAULT 0,
  subtotal numeric(15,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supplier_invoice_lines_invoice_idx ON supplier_invoice_lines(supplier_invoice_id);
`;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query(DDL);
  console.log("Tabel master data & invoice siap.");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
