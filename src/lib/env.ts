/**
 * Validasi konfigurasi environment.
 *
 * Dipanggil saat aplikasi start (lihat src/lib/auth.ts dan layout).
 * Tujuannya: GAGAL CEPAT di produksi bila ada konfigurasi berbahaya,
 * daripada diam-diam jalan dengan kunci contoh.
 */

import "server-only";

const DEV_SECRET_MARKER = "dev-secret-change-me";
const MIN_SECRET_LENGTH = 32;

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

let validated = false;

/** Validasi env. Aman dipanggil berulang (di-cache). */
export function validateEnv(): void {
  if (validated) return;

  const secret = process.env.AUTH_SECRET;
  const dbUrl = process.env.DATABASE_URL;
  const isProd = process.env.NODE_ENV === "production";

  if (!dbUrl) {
    throw new ConfigError("DATABASE_URL belum di-set. Salin .env.example ke .env.local.");
  }

  if (!secret) {
    throw new ConfigError("AUTH_SECRET belum di-set. Salin .env.example ke .env.local.");
  }

  // Di produksi, kunci contoh / terlalu pendek = BAHAYA (sesi bisa dipalsukan).
  if (isProd) {
    if (secret.includes(DEV_SECRET_MARKER)) {
      throw new ConfigError(
        "AUTH_SECRET masih memakai kunci contoh. Ganti dengan kunci acak sebelum deploy! " +
          "Buat dengan: node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\"",
      );
    }
    if (secret.length < MIN_SECRET_LENGTH) {
      throw new ConfigError(
        `AUTH_SECRET terlalu pendek (${secret.length} karakter). Minimal ${MIN_SECRET_LENGTH}.`,
      );
    }
  }

  validated = true;
}
