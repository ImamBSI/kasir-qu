"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { getProductImageUrl } from "@/utils/productImage";

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
}

const MAX_SIZE_MB = 2;

export default function ImageUpload({ value, onChange }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file?: File) => {
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Pilih file gambar (JPG, PNG, atau WebP).");
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Ukuran gambar maksimal ${MAX_SIZE_MB} MB.`);
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/images", {
        method: "POST",
        body: formData,
      });
      const result: unknown = await response.json();
      if (
        !response.ok ||
        typeof result !== "object" ||
        result === null ||
        !("image" in result) ||
        typeof result.image !== "string"
      ) {
        const message =
          typeof result === "object" &&
          result !== null &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "Gagal mengunggah gambar. Coba lagi.";
        throw new Error(message);
      }

      onChange(result.image);
      setError(null);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Gagal mengunggah gambar. Coba lagi.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Foto Produk
      </label>
      <div className="flex items-center gap-3">
        <div className="size-20 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          <img
            src={getProductImageUrl(value)}
            alt="Pratinjau foto produk"
            className="size-full object-cover"
          />
        </div>
        <div className="flex flex-col items-start gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ImagePlus className="size-4" />
            {uploading ? "Mengunggah..." : value ? "Ganti foto" : "Pilih foto"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600"
            >
              <Trash2 className="size-3.5" />
              Hapus foto
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={uploading}
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <p className={`mt-1 text-xs ${error ? "text-red-600" : "text-gray-500"}`}>
        {error ?? "JPG/PNG/WebP, maksimal 2 MB."}
      </p>
    </div>
  );
}
