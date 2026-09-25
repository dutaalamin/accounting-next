# Accounting (Next.js)

Versi **Next.js** dari aplikasi akuntansi — tanpa Laravel. Port setia dari
project `../accounting` (Laravel + Filament).

## Stack

| Bagian | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Bahasa | TypeScript |
| Database | PostgreSQL (driver `pg`) |
| ORM | Drizzle ORM |
| Styling | Tailwind CSS v4 |
| Auth | JWT di cookie HttpOnly (`jose`) + bcrypt |
| Test | Vitest |

## Fitur (tahap MVP)

- Login / logout dengan role (admin, staff)
- CRUD akun (Chart of Accounts)
- Input jurnal umum (double-entry) + validasi balance
- 4 laporan: Neraca, Laba Rugi, Arus Kas, Buku Besar

## Menjalankan

```bash
# 1. Pastikan PostgreSQL jalan (default port 5432)
#    DATABASE_URL ada di .env.local

# 2. Install dependency
npm install

# 3. Buat tabel + seed COA & admin
npm run db:setup

# 4. Jalankan
npm run dev          # http://localhost:3000
```

Login: `admin@admin.com` / `password`

## Perintah lain

```bash
npm test             # jalankan unit test logika akuntansi
npm run build        # build produksi
```

## Struktur

```
src/
  app/
    (auth)/login/        # halaman login + server action
    (app)/               # area butuh login (sidebar + header)
      dashboard/         # ringkasan posisi keuangan
      accounts/          # CRUD akun
      journals/          # input & riwayat jurnal
      reports/           # 4 laporan
  lib/
    accounting/
      balance.ts         # aturan saldo (satu sumber kebenaran)
      journal.ts         # validasi double-entry
      reports.ts         # perhitungan 4 laporan (fungsi murni)
    auth.ts              # sesi JWT
    queries.ts           # query database
  db/
    schema.ts            # skema Drizzle
    coa.ts               # Chart of Accounts
tests/
  accounting.test.ts     # test logika (port dari test Laravel)
scripts/
  setup-db.ts            # buat tabel + seed
```

## Catatan porting

Logika bisnis di `src/lib/accounting/` adalah **fungsi murni** — tidak
menyentuh database. Ini supaya:

1. Bisa diuji tanpa database (lihat `tests/accounting.test.ts`).
2. Angka yang dihasilkan identik dengan implementasi Laravel.

Aturan penting yang dipertahankan dari versi Laravel:

- Hanya jurnal `is_posted = true` dan tidak di-soft-delete yang dihitung.
- Neraca: **Laba Berjalan hanya tahun berjalan**, bukan kumulatif.
- Arus Kas: kas = akun aset berkode `111` / `112`.
- Jurnal wajib balance (total debit = total kredit).
