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

## Fitur

**Akuntansi inti**
- Login / logout dengan role (admin, staff)
- CRUD akun (Chart of Accounts)
- Input jurnal umum (double-entry) + validasi balance
- 4 laporan: Neraca, Laba Rugi, Arus Kas, Buku Besar

**Master data**
- Pelanggan, Pemasok, Produk & Layanan (dengan lacak stok)

**Penjualan & Pembelian**
- Tagihan pelanggan (invoice) — jurnal ter-posting otomatis
- Tagihan pemasok — jurnal ter-posting otomatis
- Halaman cetak invoice (siap simpan PDF via browser)

**Keamanan & Pengguna**
- Kelola pengguna (tambah, atur peran) — admin saja
- Ganti password sendiri (min. 8 karakter, huruf + angka)
- Aksi hapus data dibatasi hanya untuk admin
- Validasi konfigurasi saat start (menolak kunci contoh di produksi)
- Sesi JWT di cookie HttpOnly + password bcrypt

**Koreksi Data**
- Batalkan invoice: jurnal pembalik otomatis + stok dikembalikan
- Jejak audit tetap tersimpan (jurnal asli tidak dihapus)
- Validasi rentang tanggal laporan (ditukar otomatis + peringatan)

**Backup & Data**
- Backup & restore database (`scripts/backup.ts`)
- Ekspor CSV: akun, jurnal, invoice, produk, pelanggan, pemasok

**Ketahanan**
- Semua operasi tulis dalam transaksi DB (all-or-nothing)
- Validasi stok dengan row lock (anti stok minus saat bersamaan)
- Nomor invoice unik, pesan error jelas
- Error boundary + halaman 404

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
npm test             # jalankan unit test logika akuntansi (35 test)
npm run build        # build produksi
npm run db:migrate   # tambah tabel master & invoice
npm run db:seed      # seed data contoh (pelanggan, pemasok, produk)

npx tsx scripts/check-db.ts              # cek integritas data
npx tsx scripts/backup.ts backup         # backup database
npx tsx scripts/backup.ts restore <file> # pulihkan dari backup
npx tsx scripts/manage-user.ts list      # kelola pengguna via CLI

npm run db:reset                         # pratinjau: kosongkan data transaksi
npx tsx scripts/reset-data.ts --confirm  # jalankan (akun COA & user disimpan)
```

> **Untuk deploy ke Vercel + Supabase**, baca **[DEPLOY.md](./DEPLOY.md)** —
> langkah lengkap dari nol, checklist produksi, dan solusi kalau ada masalah.

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
      invoice.ts         # validasi & jurnal invoice (fungsi murni)
    auth.ts              # sesi JWT
    queries.ts           # query database
    invoice-service.ts   # buat invoice + posting jurnal (transaksional)
  db/
    schema.ts            # skema Drizzle (akun, jurnal, master, invoice)
    coa.ts               # Chart of Accounts
tests/
  accounting.test.ts     # test logika laporan & jurnal
  invoice.test.ts        # test logika invoice & posting
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
