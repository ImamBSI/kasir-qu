"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
}

const MAX_SIZE_MB = 2;

export default function ImageUpload({ value, onChange }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file?: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Pilih file gambar (JPG, PNG, atau WebP).");
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Ukuran gambar maksimal ${MAX_SIZE_MB} MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onChange(String(reader.result));
      setError(null);
    };
    reader.onerror = () => setError("Gagal membaca gambar. Coba lagi.");
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Foto Produk
      </label>
      <div className="flex items-center gap-3">
        <div className="size-20 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          <img
            src={value || "/images/placeholder.svg"}
            alt="Pratinjau foto produk"
            className="size-full object-cover"
          />
        </div>
        <div className="flex flex-col items-start gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ImagePlus className="size-4" />
            {value ? "Ganti foto" : "Pilih foto"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
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
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <p className={`mt-1 text-xs ${error ? "text-red-600" : "text-gray-500"}`}>
        {error ?? "JPG/PNG/WebP, maksimal 2 MB."}
      </p>
    </div>
  );
}
