# KasirQu

KasirQu adalah aplikasi kasir berbasis Next.js.

## Menyiapkan akses aplikasi

Halaman dashboard dan semua halaman di `/pages/*` hanya dapat dibuka oleh
pengguna yang berhasil login dan memiliki `is_active = TRUE`. Status akun
diperiksa kembali dari database pada setiap permintaan halaman yang dilindungi.
Sesi memakai cookie `HttpOnly`, bertanda tangan, dan berlaku selama 8 jam.

Login menggunakan tabel PostgreSQL Neon berikut:

```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(10) NOT NULL CHECK (role IN ('SADM', 'ADM', 'STF')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  session_version INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

`npm run db:seed` menambahkan `session_version` jika tabel `users` sudah ada.
Reset password menaikkan versi tersebut sehingga sesi lama langsung tidak berlaku.

`password_hash` harus berisi hash bcrypt, bukan password teks biasa.

Salin `.env.example` menjadi `.env.local`, lalu isi:

- `NEON_DATABASE_URL`: connection string PostgreSQL Neon. Gunakan pooled
  connection string untuk deployment serverless.
- `AUTH_SESSION_SECRET`: secret acak minimal 32 byte. Buat dengan:

  ```powershell
  node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
  ```

Atur kedua variabel tersebut di Vercel untuk environment yang digunakan.

Untuk membuat akun admin pertama saat menjalankan `npm run db:seed`, isi
`SEED_ADMIN_NAME`, `SEED_ADMIN_USERNAME`, dan `SEED_ADMIN_PASSWORD` secara lokal
di `.env.local`. Password admin tidak disimpan di source code; akun yang sudah
ada tidak akan diubah saat seed dijalankan ulang.

Pengguna dengan role `SADM` dapat mengelola akun di `/pages/users`: membuat
akun `SADM`, `ADM`, atau `STF`, mengubah nama/username/role, mereset password,
serta mengaktifkan atau menonaktifkan akun. Akun tidak dihapus agar relasi
transaksi tetap terjaga. Setiap perubahan memerlukan otorisasi `SADM` di server.

Jalankan `npm run db:seed` sekali untuk membuat/memperbarui tabel database.
Perintah ini tidak memasukkan produk atau transaksi dummy; produk operasional
ditambahkan melalui halaman Gudang.

Foto produk yang diunggah di halaman Gudang disimpan di Neon Object Storage
(API S3-compatible); database hanya menyimpan referensi objeknya. Buat bucket
`gambar`, lalu isi variabel berikut di `.env.local` dan Vercel:

- `AWS_ENDPOINT_URL_S3`: endpoint S3-compatible dari Neon.
- `AWS_REGION`: region dari konfigurasi Neon (default lokal `us-east-1`).
- `AWS_ACCESS_KEY_ID` dan `AWS_SECRET_ACCESS_KEY`: access key object storage.
- `NEON_OBJECT_STORAGE_BUCKET`: nama bucket (`gambar` untuk proyek ini).

Jangan commit access key atau file `.env.local`. Upload hanya menerima JPG, PNG,
dan WebP hingga 2 MB. Objek dibaca menggunakan URL bertanda tangan yang berlaku
selama satu jam.

Jika database sudah berisi foto unggahan lama dalam bentuk Data URL, jalankan
`npm run db:migrate-product-images` sekali setelah konfigurasi storage di atas
lengkap. Script hanya memindahkan foto JPG, PNG, dan WebP hingga 2 MB; foto
produk bawaan di `public/images` tidak dipindahkan.

File JSON di `src/data` dipertahankan sebagai dataset analisis saja. Aplikasi
tidak menggunakannya sebagai sumber produk, transaksi, dashboard, atau laporan.

## Menjalankan lokal

```bash
npm install
npm run dev
```

Validasi sebelum deploy:

```bash
npm run lint
npm run build
```
