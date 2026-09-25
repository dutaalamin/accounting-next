# Panduan Deploy ke Cloud (Produksi)

Panduan ini untuk memasang aplikasi di internet agar bisa diakses banyak
orang (sesuai kebutuhan perusahaan). Ikuti urutannya.

---

## 1. Siapkan Database PostgreSQL

Butuh PostgreSQL yang bisa diakses dari internet. Pilihan populer:

| Penyedia | Catatan |
|---|---|
| **Neon** (neon.tech) | Ada paket gratis, cocok untuk mulai. Serverless. |
| **Supabase** | Paket gratis, ada dashboard. |
| **Railway / Render** | Mudah, bisa sekalian host aplikasi. |

Setelah dibuat, kamu akan dapat **connection string** seperti:

```
postgresql://user:password@host/dbname?sslmode=require
```

> **Catatan penting:** tambahkan `?sslmode=require` di akhir untuk koneksi aman.

---

## 2. Siapkan Environment Variables

Di dashboard hosting (Vercel/Railway), isi variabel berikut:

| Variabel | Nilai |
|---|---|
| `DATABASE_URL` | connection string dari langkah 1 |
| `AUTH_SECRET` | kunci acak — **wajib dibuat baru, jangan pakai yang lama** |
| `NODE_ENV` | `production` |

**Cara membuat AUTH_SECRET baru:**

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

> Aplikasi akan **menolak start** kalau `AUTH_SECRET` masih kunci contoh
> atau kurang dari 32 karakter. Ini pengamanan sengaja.

---

## 3. Deploy

### Pilihan A — Vercel (paling mudah)

```bash
npm install -g vercel
vercel
```

Ikuti instruksinya, lalu set environment variables di dashboard Vercel:
**Settings → Environment Variables**.

### Pilihan B — Railway / Render

Hubungkan repo GitHub-mu, lalu set environment variables yang sama.

---

## 4. Siapkan Tabel & Data Awal

Setelah deploy pertama, jalankan dari komputermu (dengan `DATABASE_URL`
diarahkan ke database produksi):

```bash
# Buat semua tabel
npm run db:migrate

# Buat akun COA + admin
npm run db:setup

# (opsional) data contoh
npm run db:seed
```

**PENTING:** segera ganti password admin setelah login pertama!

```bash
npx tsx scripts/manage-user.ts reset admin@admin.com "PasswordBaru123"
```

---

## 5. Backup Otomatis (WAJIB)

Data keuangan tidak boleh hilang. Lakukan backup berkala:

```bash
# Backup manual
npx tsx scripts/backup.ts backup

# Lihat daftar backup
npx tsx scripts/backup.ts list

# Pulihkan bila perlu
npx tsx scripts/backup.ts restore backups/backup-XXXX.json
```

**Saran:** jalankan backup setiap hari (bisa lewat Task Scheduler Windows /
cron di Linux), dan **simpan salinannya di tempat lain** (Google Drive,
Dropbox, atau hard disk eksternal). Backup di komputer yang sama tidak
menolong kalau komputernya rusak.

---

## 6. Checklist Sebelum Dipakai Perusahaan

- [ ] `AUTH_SECRET` sudah diganti dengan kunci acak baru
- [ ] Password admin sudah diganti (bukan `password`)
- [ ] Setiap karyawan punya akun sendiri (jangan berbagi akun!)
- [ ] Peran diatur: admin untuk pemilik, staff untuk karyawan
- [ ] Backup otomatis sudah berjalan & disimpan di tempat terpisah
- [ ] Sudah uji restore sekali (backup yang belum pernah diuji = belum terbukti)
- [ ] Alamat aplikasi sudah HTTPS (otomatis di Vercel/Railway)
- [ ] Data uji coba sudah dibersihkan sebelum input data asli

---

## Catatan Keamanan

Yang sudah diterapkan di aplikasi:

- Password di-hash dengan bcrypt (tidak disimpan sebagai teks biasa)
- Sesi login memakai JWT di cookie HttpOnly (tidak bisa dibaca JavaScript)
- Semua halaman butuh login
- Hapus data (akun, pelanggan, produk, invoice) hanya bisa oleh admin
- Operasi tulis memakai transaksi database (tidak ada data setengah jadi)
- Validasi ketat: nomor invoice unik, stok tidak boleh minus, jurnal wajib balance

Yang perlu kamu jaga sendiri:

- Jangan bagikan `AUTH_SECRET` atau `DATABASE_URL` ke siapa pun
- Jangan commit file `.env.local` ke Git (sudah masuk `.gitignore`)
- Rutin backup
