import { randomUUID } from "node:crypto";
import { getAuthenticatedUser } from "@/lib/session";
import {
  getProductImageSignedUrl,
  uploadProductImage,
} from "@/lib/objectStorage";
import {
  createObjectStorageImageReference,
  getObjectStorageImageKey,
} from "@/utils/productImage";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const MAX_MULTIPART_SIZE = MAX_IMAGE_SIZE + 64 * 1024;

type ImageFormat = {
  contentType: "image/jpeg" | "image/png" | "image/webp";
  extension: "jpg" | "png" | "webp";
};

function detectImageFormat(buffer: Buffer): ImageFormat | null {
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

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { error: "Silakan login kembali." },
      { status: 401 },
    );
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_SIZE) {
    return NextResponse.json(
      { error: "Ukuran gambar maksimal 2 MB." },
      { status: 413 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Data upload tidak valid." },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "File gambar tidak ditemukan." },
      { status: 400 },
    );
  }
  if (file.size === 0 || file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json(
      { error: "Ukuran gambar harus lebih dari 0 dan maksimal 2 MB." },
      { status: 413 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const format = detectImageFormat(buffer);
  if (!format || (file.type && file.type !== format.contentType)) {
    return NextResponse.json(
      { error: "Pilih file JPG, PNG, atau WebP yang valid." },
      { status: 415 },
    );
  }

  const key = `products/${randomUUID()}.${format.extension}`;
  try {
    await uploadProductImage(key, buffer, format.contentType);
  } catch (error) {
    console.error("[product-image-upload]", error);
    return NextResponse.json(
      { error: "Gagal mengunggah foto produk ke object storage." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    image: createObjectStorageImageReference(key),
  });
}

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { error: "Silakan login kembali." },
      { status: 401 },
    );
  }

  const key = new URL(request.url).searchParams.get("key");
  if (!key || !getObjectStorageImageKey(`neon-s3:${key}`)) {
    return NextResponse.json(
      { error: "Foto tidak ditemukan." },
      { status: 404 },
    );
  }

  try {
    const url = await getProductImageSignedUrl(key);
    return new Response(null, {
      status: 302,
      headers: {
        Location: url,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[product-image-read]", error);
    return NextResponse.json(
      { error: "Gagal membuka foto produk." },
      { status: 502 },
    );
  }
}
