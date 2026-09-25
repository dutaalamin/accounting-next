# Panduan Deploy ke Vercel + Supabase

Panduan lengkap untuk memasang aplikasi di internet agar bisa diakses
banyak orang. Ikuti urutannya.

**Ringkasan:** Supabase = tempat database, Vercel = tempat aplikasi.
Keduanya punya paket gratis yang cukup untuk usaha kecil.

---

## Langkah 1 — Buat Database di Supabase

1. Buka **https://supabase.com** → daftar (bisa pakai akun GitHub/Google)
2. Klik **New project**
   - **Name**: `accounting`
   - **Database Password**: klik **Generate a password** lalu **SIMPAN password ini**
     (nanti dibutuhkan; kalau hilang harus reset)
   - **Region**: pilih **Singapore** (paling dekat dengan Indonesia)
3. Tunggu 1–2 menit sampai project selesai dibuat
4. Buka menu **Project Settings** (ikon gerigi) → **Database**
5. Cari bagian **Connection string** → pilih tab **URI**
6. Salin dua hal ini:
   - **Direct connection** (port `5432`) — dipakai untuk membuat tabel
   - **Session pooler** (port `5432`, host `...pooler.supabase.com`) — dipakai aplikasi

   Bentuknya seperti:
   ```
   postgresql://postgres.abcdefgh:RAHASIA@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
   ```
7. Ganti `[YOUR-PASSWORD]` dengan password dari langkah 2

> **Catatan:** pakai **Session pooler** (bukan Transaction pooler) karena
> lebih andal untuk aplikasi ini. Kalau paket gratis Supabase tidak
> menyediakan Session pooler, pakai **Direct connection** — tetap jalan.

---

## Langkah 2 — Buat Tabel & Akun Admin

Jalankan dari komputermu (folder project). Ganti `DATABASE_URL` dengan
connection string **Direct connection** dari langkah 1:

**Windows (PowerShell):**
```powershell
$env:DATABASE_URL="postgresql://postgres:RAHASIA@db.xxxx.supabase.co:5432/postgres"
npm run db:setup
```

**Mac / Linux:**
```bash
DATABASE_URL="postgresql://postgres:RAHASIA@db.xxxx.supabase.co:5432/postgres" npm run db:setup
```

Hasil yang diharapkan:
```
Membuat tabel...
Seed COA...
Seed admin...
  dibuat: admin@admin.com / password
Selesai. 15 akun tersedia.
```

> Perintah ini membuat tabel + 15 akun COA + akun admin.
> Aman dijalankan ulang (tidak akan menimpa data yang sudah ada).

---

## Langkah 3 — Deploy ke Vercel

1. Buka **https://vercel.com** → daftar (pakai akun GitHub)
2. **Cara termudah (lewat GitHub):**
   - Push folder project ini ke GitHub (repo baru, boleh private)
   - Di Vercel: **Add New → Project** → pilih repo tersebut → **Import**
3. **Cara lewat terminal** (kalau tidak mau pakai GitHub):
   ```bash
   npx vercel login
   npx vercel
   ```
   Ikuti pertanyaannya (Enter saja untuk semua pilihan default).

---

## Langkah 4 — Isi Environment Variables di Vercel

Di dashboard Vercel → project kamu → **Settings → Environment Variables**.
Tambahkan 3 variabel ini (pilih Environment: **Production, Preview, Development**):

| Nama | Nilai |
|---|---|
| `DATABASE_URL` | connection string **Session pooler** Supabase |
| `AUTH_SECRET` | kunci acak (lihat cara membuat di bawah) |
| `NODE_ENV` | `production` |

**Cara membuat AUTH_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

> **Penting:** `AUTH_SECRET` harus kunci BARU, jangan pakai yang di
> komputermu. Kalau masih kunci contoh, aplikasi akan menolak jalan
> (ini pengamanan sengaja).

Setelah variabel diisi, klik **Redeploy** agar berlaku.

---

## Langkah 5 — Ganti Password Admin

Setelah bisa login, **segera ganti password** (jangan biarkan `password`):

```bash
DATABASE_URL="connection-string-supabase" \
npx tsx scripts/manage-user.ts reset admin@admin.com "PasswordBaru123"
```

Lalu buat akun untuk tiap karyawan:
```bash
DATABASE_URL="..." \
npx tsx scripts/manage-user.ts add "Budi" budi@perusahaan.com "PasswordBudi123" staff
```

---

## Langkah 6 — Backup Rutin (WAJIB)

Data keuangan tidak boleh hilang. Supabase menyediakan backup otomatis
sesuai paket, TAPI lakukan juga backup mandiri:

```bash
DATABASE_URL="connection-string-supabase" \
npx tsx scripts/backup.ts backup
```

**Saran:** jalankan minimal seminggu sekali, dan simpan hasilnya di
Google Drive / hard disk eksternal. Backup yang disimpan di tempat yang
sama dengan datanya tidak menolong kalau terjadi bencana.

---

## Checklist Sebelum Dipakai Perusahaan

- [ ] Database Supabase sudah dibuat (region Singapore)
- [ ] Tabel & akun COA sudah dibuat (`npm run db:setup`)
- [ ] `AUTH_SECRET` di Vercel sudah diganti kunci acak baru
- [ ] Aplikasi bisa dibuka dari internet (HTTPS aktif otomatis di Vercel)
- [ ] Password admin sudah diganti
- [ ] Setiap karyawan punya akun sendiri (jangan berbagi akun!)
- [ ] Peran diatur: `admin` untuk pemilik, `staff` untuk karyawan
- [ ] Backup sudah dijalankan & hasilnya disimpan di tempat terpisah
- [ ] Sudah pernah uji restore (backup yang belum diuji = belum terbukti)
- [ ] Data uji coba sudah dibersihkan (`npm run db:reset`)

---

## Catatan Keamanan

**Sudah diterapkan di aplikasi:**
- Password di-hash bcrypt (tidak disimpan sebagai teks biasa)
- Sesi login JWT di cookie HttpOnly (tidak bisa dibaca JavaScript)
- Semua halaman butuh login
- Hapus data hanya bisa oleh admin
- Operasi tulis memakai transaksi database
- Validasi ketat: nomor invoice unik, stok tidak minus, jurnal wajib balance
- Koneksi database memakai SSL

**Yang perlu kamu jaga:**
- Jangan bagikan `AUTH_SECRET` atau `DATABASE_URL` ke siapa pun
- Jangan commit `.env.local` ke Git (sudah masuk `.gitignore`)
- Rutin backup

---

## Kalau Ada Masalah

| Gejala | Penyebab & solusi |
|---|---|
| Build gagal: "AUTH_SECRET masih kunci contoh" | Ganti `AUTH_SECRET` di Vercel dengan kunci acak baru |
| Halaman error: "relation does not exist" | Belum jalankan `npm run db:setup` |
| "DATABASE_URL belum di-set" | Variabel belum diisi di Vercel, atau belum Redeploy |
| Koneksi database timeout | Pakai **Session pooler** Supabase, bukan direct |
| Tidak bisa login | Reset password: `npx tsx scripts/manage-user.ts reset <email> <password>` |
