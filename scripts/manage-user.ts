/**
 * Kelola user dari command line.
 *
 *   npx tsx scripts/manage-user.ts list
 *   npx tsx scripts/manage-user.ts reset <email> <password-baru>
 *   npx tsx scripts/manage-user.ts role <email> admin|staff
 *   npx tsx scripts/manage-user.ts add <nama> <email> <password> <admin|staff>
 */

import { Pool } from "pg";
import bcrypt from "bcryptjs";
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

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "Password minimal 8 karakter.";
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return "Password harus mengandung huruf dan angka.";
  return null;
}

async function main() {
  loadEnv();
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const [cmd, a1, a2, a3, a4] = process.argv.slice(2);

  if (!cmd || cmd === "list") {
    const r = await pool.query("SELECT id, name, email, role FROM users ORDER BY role, name");
    console.log(`\n${r.rows.length} pengguna:\n`);
    for (const u of r.rows) {
      console.log(`  [${u.role.padEnd(5)}] ${u.email.padEnd(30)} ${u.name}`);
    }
    console.log();
    await pool.end();
    return;
  }

  if (cmd === "reset") {
    const [email, password] = [a1, a2];
    if (!email || !password) {
      console.error("Pakai: reset <email> <password-baru>");
      process.exit(1);
    }
    const pwErr = validatePassword(password);
    if (pwErr) {
      console.error(pwErr);
      process.exit(1);
    }
    const hash = await bcrypt.hash(password, 10);
    const r = await pool.query("UPDATE users SET password=$1, updated_at=now() WHERE email=$2", [
      hash,
      email.toLowerCase(),
    ]);
    console.log(r.rowCount === 1 ? `Password ${email} berhasil direset.` : `User ${email} tidak ditemukan.`);
    await pool.end();
    return;
  }

  if (cmd === "role") {
    const [email, role] = [a1, a2];
    if (!email || !role || !["admin", "staff"].includes(role)) {
      console.error("Pakai: role <email> admin|staff");
      process.exit(1);
    }
    // Cegah admin terakhir diturunkan.
    if (role === "staff") {
      const admins = await pool.query("SELECT count(*)::int n FROM users WHERE role='admin'");
      const target = await pool.query("SELECT role FROM users WHERE email=$1", [email.toLowerCase()]);
      if (target.rows[0]?.role === "admin" && admins.rows[0].n <= 1) {
        console.error("Tidak bisa menurunkan admin terakhir.");
        process.exit(1);
      }
    }
    const r = await pool.query("UPDATE users SET role=$1, updated_at=now() WHERE email=$2", [
      role,
      email.toLowerCase(),
    ]);
    console.log(r.rowCount === 1 ? `${email} sekarang ${role}.` : `User ${email} tidak ditemukan.`);
    await pool.end();
    return;
  }

  if (cmd === "add") {
    const [name, email, password, role] = [a1, a2, a3, a4];
    if (!name || !email || !password || !role) {
      console.error("Pakai: add <nama> <email> <password> <admin|staff>");
      process.exit(1);
    }
    const pwErr = validatePassword(password);
    if (pwErr) {
      console.error(pwErr);
      process.exit(1);
    }
    const hash = await bcrypt.hash(password, 10);
    try {
      await pool.query("INSERT INTO users (name, email, password, role) VALUES ($1,$2,$3,$4)", [
        name,
        email.toLowerCase(),
        hash,
        role,
      ]);
      console.log(`User ${email} berhasil dibuat sebagai ${role}.`);
    } catch {
      console.error(`Email ${email} sudah terdaftar.`);
    }
    await pool.end();
    return;
  }

  console.error("Perintah tidak dikenal. Pakai: list | reset | role | add");
  await pool.end();
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
