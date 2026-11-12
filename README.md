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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

`password_hash` harus berisi hash bcrypt, bukan password teks biasa.

Salin `.env.example` menjadi `.env.local`, lalu isi:

- `NEON_DATABASE_URL`: connection string PostgreSQL Neon. Gunakan pooled
  connection string untuk deployment serverless.
- `AUTH_SESSION_SECRET`: secret acak minimal 32 byte. Buat dengan:

  ```powershell
  node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
  ```

Atur kedua variabel tersebut di Vercel untuk environment yang digunakan.

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
