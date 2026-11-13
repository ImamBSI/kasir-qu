// Menyiapkan skema database Neon dan akun admin awal opsional.
// Jalankan: npm run db:seed
//
// - Idempotent: aman dijalankan berulang kali.
// - Skema dari db/schema.sql (IF NOT EXISTS).
// - Akun admin awal dibaca dari variabel SEED_ADMIN_*.

import pg from "pg";
import bcrypt from "bcryptjs";
import { existsSync, readFileSync } from "node:fs";

const { Client } = pg;

const BCRYPT_ROUNDS = 10;

function loadEnv() {
  // .env.local menimpa .env; environment nyata selalu menang.
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    for (const rawLine of readFileSync(file, "utf8").split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key] !== undefined) continue;
      let value = rawValue.trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

function buildClientConfig(connectionString) {
  return {
    connectionString,
    ssl: { rejectUnauthorized: true },
  };
}

function getSeedAdmin() {
  const admin = {
    name: process.env.SEED_ADMIN_NAME?.trim() ?? "",
    username: process.env.SEED_ADMIN_USERNAME?.trim() ?? "",
    password: process.env.SEED_ADMIN_PASSWORD ?? "",
  };
  const hasAnyValue = Object.values(admin).some(Boolean);
  if (!hasAnyValue) return null;

  if (!admin.name || !admin.username || !admin.password) {
    throw new Error(
      "SEED_ADMIN_NAME, SEED_ADMIN_USERNAME, dan SEED_ADMIN_PASSWORD harus diisi bersama.",
    );
  }
  if (admin.name.length > 100 || admin.username.length > 50) {
    throw new Error("Nama admin atau username terlalu panjang.");
  }
  if (
    Buffer.byteLength(admin.password, "utf8") < 12 ||
    Buffer.byteLength(admin.password, "utf8") > 72
  ) {
    throw new Error("Password admin harus 12-72 byte.");
  }

  return admin;
}

async function seedInitialAdmin(client, admin) {
  const passwordHash = await bcrypt.hash(admin.password, BCRYPT_ROUNDS);
  const result = await client.query(
    `INSERT INTO users (name, username, password_hash, role, is_active)
     VALUES ($1, $2, $3, 'SADM', TRUE)
     ON CONFLICT (username) DO NOTHING
     RETURNING id`,
    [admin.name, admin.username, passwordHash],
  );
  return result.rowCount === 1;
}

async function main() {
  loadEnv();

  const connectionString =
    process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!connectionString) {
    console.error("❌ DATABASE_URL tidak ditemukan. Isi di .env atau .env.local.");
    process.exitCode = 1;
    return;
  }

  let seedAdmin;
  try {
    seedAdmin = getSeedAdmin();
  } catch (error) {
    console.error("❌ Konfigurasi admin awal tidak valid:", error.message);
    process.exitCode = 1;
    return;
  }

  const client = new Client(buildClientConfig(connectionString));

  try {
    await client.connect();
    console.log("🔌 Terhubung ke database.");

    const schema = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");
    await client.query(schema);
    console.log(
      "📋 Skema siap (users, categories, products, units, sales, stock movements).",
    );

    await client.query("BEGIN");
    const adminCreated = seedAdmin
      ? await seedInitialAdmin(client, seedAdmin)
      : false;
    await client.query("COMMIT");

    if (!seedAdmin) {
      console.log(
        "👤 Admin awal dilewati. Isi SEED_ADMIN_* jika database belum memiliki akun.",
      );
    } else if (adminCreated) {
      console.log("👤 Akun admin awal berhasil dibuat.");
    } else {
      console.log("👤 Username admin sudah ada; akun yang ada tidak diubah.");
    }
    console.log("📦 Produk dummy tidak dimasukkan ke database.");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("❌ Seed gagal:", error.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
