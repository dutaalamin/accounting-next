/**
 * Setup database: buat tabel + seed data awal.
 * Jalankan: npx tsx scripts/setup-db.ts
 *
 * Idempoten — aman dijalankan berulang kali.
 * Membaca DATABASE_URL dari .env.local.
 */

import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { COA } from "../src/db/coa";

// Muat .env.local secara manual (tanpa dependency tambahan).
import { readFileSync, existsSync } from "node:fs";
if (existsSync(".env.local")) {
  for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

const DDL = `
CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  name varchar(255) NOT NULL,
  email varchar(255) NOT NULL UNIQUE,
  password varchar(255) NOT NULL,
  role varchar(20) NOT NULL DEFAULT 'staff',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS accounts (
  id serial PRIMARY KEY,
  code varchar(50) NOT NULL UNIQUE,
  name varchar(255) NOT NULL,
  type varchar(20) NOT NULL,
  initial_balance numeric(15,2) NOT NULL DEFAULT 0,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS accounts_type_idx ON accounts(type);

CREATE TABLE IF NOT EXISTS journal_entries (
  id serial PRIMARY KEY,
  reference_number varchar(255) NOT NULL,
  date date NOT NULL,
  description text,
  source_type varchar(50),
  source_id integer,
  is_posted boolean NOT NULL DEFAULT false,
  posted_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS journal_entries_date_idx ON journal_entries(date);
CREATE INDEX IF NOT EXISTS journal_entries_source_idx ON journal_entries(source_type, source_id);

CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id serial PRIMARY KEY,
  journal_entry_id integer NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id integer NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  debit numeric(15,2) NOT NULL DEFAULT 0,
  credit numeric(15,2) NOT NULL DEFAULT 0,
  description varchar(255),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS journal_lines_account_idx ON journal_entry_lines(account_id);
CREATE INDEX IF NOT EXISTS journal_lines_entry_idx ON journal_entry_lines(journal_entry_id);
`;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  console.log("Membuat tabel...");
  await pool.query(DDL);

  console.log("Seed COA...");
  for (const a of COA) {
    await pool.query(
      `INSERT INTO accounts (code, name, type) VALUES ($1, $2, $3)
       ON CONFLICT (code) DO NOTHING`,
      [a.code, a.name, a.type],
    );
  }

  console.log("Seed admin...");
  const email = "admin@admin.com";
  const exists = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
  if (exists.rows.length === 0) {
    const hash = await bcrypt.hash("password", 10);
    await pool.query(
      `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)`,
      ["Admin", email, hash, "admin"],
    );
    console.log(`  dibuat: ${email} / password`);
  } else {
    console.log("  admin sudah ada, dilewati");
  }

  const accCount = await pool.query(`SELECT count(*)::int AS n FROM accounts`);
  console.log(`Selesai. ${accCount.rows[0].n} akun tersedia.`);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
