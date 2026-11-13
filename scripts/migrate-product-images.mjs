import { randomUUID } from "node:crypto";
import { Client } from "pg";
import dotenv from "dotenv";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const IMAGE_REFERENCE_PREFIX = "neon-s3:";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} belum diatur.`);
  return value;
}

function detectImageFormat(buffer) {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { contentType: "image/jpeg", extension: "jpg" };
  }
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    )
  ) {
    return { contentType: "image/png", extension: "png" };
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return { contentType: "image/webp", extension: "webp" };
  }
  return null;
}

function decodeImageDataUrl(value) {
  const match = value.match(
    /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/,
  );
  if (!match) throw new Error("format Data URL tidak didukung.");

  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length === 0 || buffer.length > MAX_IMAGE_SIZE) {
    throw new Error("ukuran gambar tidak valid atau melebihi 2 MB.");
  }

  const format = detectImageFormat(buffer);
  if (!format || format.contentType !== match[1]) {
    throw new Error("isi gambar tidak cocok dengan format Data URL.");
  }

  return { buffer, format };
}

async function main() {
  const connectionString = requiredEnv("NEON_DATABASE_URL");
  const bucket = requiredEnv("NEON_OBJECT_STORAGE_BUCKET");
  const s3 = new S3Client({
    endpoint: requiredEnv("AWS_ENDPOINT_URL_S3"),
    region: process.env.AWS_REGION || "us-east-1",
    forcePathStyle: true,
    credentials: {
      accessKeyId: requiredEnv("AWS_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnv("AWS_SECRET_ACCESS_KEY"),
    },
  });
  const db = new Client({
    connectionString,
    ssl: { rejectUnauthorized: true },
  });

  let migrated = 0;
  let failed = 0;

  try {
    await db.connect();
    const result = await db.query(
      `SELECT id::text, image
       FROM products
       WHERE image LIKE 'data:image/%'`,
    );

    for (const row of result.rows) {
      let key;
      try {
        const { buffer, format } = decodeImageDataUrl(row.image);
        key = `products/${randomUUID()}.${format.extension}`;
        await s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: buffer,
            ContentType: format.contentType,
            CacheControl: "private, max-age=3600",
          }),
        );

        const update = await db.query(
          `UPDATE products
           SET image = $2, updated_at = now()
           WHERE id = $1 AND image = $3`,
          [row.id, `${IMAGE_REFERENCE_PREFIX}${key}`, row.image],
        );
        if (update.rowCount !== 1) {
          await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
          console.log(`Produk ${row.id} berubah saat migrasi; dilewati.`);
          continue;
        }

        migrated += 1;
      } catch (error) {
        failed += 1;
        console.error(
          `Gagal memigrasikan gambar produk ${row.id}:`,
          error instanceof Error ? error.message : error,
        );
        if (key) {
          try {
            await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
          } catch (cleanupError) {
            console.error(
              `Gagal membersihkan objek sementara ${key}:`,
              cleanupError,
            );
          }
        }
      }
    }

    console.log(`${migrated} gambar berhasil dipindahkan; ${failed} gagal.`);
    if (failed > 0) process.exitCode = 1;
  } finally {
    await db.end();
    s3.destroy();
  }
}

main().catch((error) => {
  console.error("Migrasi gambar gagal:", error);
  process.exitCode = 1;
});
