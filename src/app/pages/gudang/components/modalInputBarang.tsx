"use client";

import { useState } from "react";
import { X } from "lucide-react";
import ImageUpload from "./imageUpload";

interface ModalInputBarangProps {
  categories: string[];
  onClose: () => void;
  onSave: (product: {
    name: string;
    category: string;
    cost_price: number;
    image: string;
    units: { satuan: string; price: number; isi_dalam_satuan_dasar: number }[];
  }) => void;
}

const inputClass =
  "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const priceClass =
  "w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

export default function ModalInputBarang({
  categories,
  onClose,
  onSave,
}: ModalInputBarangProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState("");
  const [pcsPrice, setPcsPrice] = useState(0);
  const [rcgPrice, setRcgPrice] = useState(0);
  const [rcgIsi, setRcgIsi] = useState(0);
  const [dusPrice, setDusPrice] = useState(0);
  const [dusIsi, setDusIsi] = useState(0);
  const [costInput, setCostInput] = useState(0);

  const hasDus = dusIsi > 0;
  const costPerPcs = hasDus ? Math.round(costInput / dusIsi) : costInput;
  const canSave = name.trim().length > 0 && category.trim().length > 0 && pcsPrice > 0;

  const handleSave = () => {
    if (!canSave) return;

    const units = [{ satuan: "Pcs", price: pcsPrice, isi_dalam_satuan_dasar: 1 }];
    if (rcgPrice > 0 && rcgIsi > 0) {
      units.push({
        satuan: "Rcg",
        price: rcgPrice,
        isi_dalam_satuan_dasar: rcgIsi,
      });
    }
    if (dusPrice > 0 && dusIsi > 0) {
      units.push({
        satuan: "Dus",
        price: dusPrice,
        isi_dalam_satuan_dasar: dusIsi,
      });
    }

    onSave({
      name: name.trim(),
      category: category.trim(),
      cost_price: costPerPcs,
      image,
      units,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-lg shadow-xl w-full max-w-lg max-h-[92dvh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">
            Tambah Produk Baru
          </h2>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Nama Produk */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Produk
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Minyak Goreng Bimoli 2L"
              className={inputClass}
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategori
            </label>
            <input
              type="text"
              list="product-category-options"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ketik atau pilih kategori"
              className={inputClass}
            />
            <datalist id="product-category-options">
              {categories
                .filter((cat) => cat !== "Semua")
                .map((cat) => (
                  <option key={cat} value={cat} />
                ))}
            </datalist>
            <p className="mt-1 text-xs text-gray-500">
              Kategori baru otomatis masuk daftar filter setelah produk disimpan.
            </p>
          </div>

          {/* Foto */}
          <ImageUpload value={image} onChange={setImage} />

          {/* Harga & Konversi Satuan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Harga & Konversi Satuan
            </label>
            <div className="space-y-3">
              {/* PCS */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  PCS (DASAR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                    Rp
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={pcsPrice || ""}
                    onChange={(e) =>
                      setPcsPrice(parseInt(e.target.value, 10) || 0)
                    }
                    placeholder="0"
                    className={priceClass}
                  />
                </div>
              </div>

              {/* RCG */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  RCG
                </label>
                <div className="relative mb-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                    Rp
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={rcgPrice || ""}
                    onChange={(e) =>
                      setRcgPrice(parseInt(e.target.value, 10) || 0)
                    }
                    placeholder="Harga per Renceng"
                    className={priceClass}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    ISI PER RENCENG
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={rcgIsi || ""}
                    onChange={(e) =>
                      setRcgIsi(parseInt(e.target.value, 10) || 0)
                    }
                    placeholder="0"
                    className={inputClass.replace("w-full", "flex-1")}
                  />
                  <span className="text-xs text-gray-500">pcs</span>
                </div>
              </div>

              {/* DUS */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  DUS
                </label>
                <div className="relative mb-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                    Rp
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={dusPrice || ""}
                    onChange={(e) =>
                      setDusPrice(parseInt(e.target.value, 10) || 0)
                    }
                    placeholder="Harga per Dus"
                    className={priceClass}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    ISI PER DUS
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={dusIsi || ""}
                    onChange={(e) =>
                      setDusIsi(parseInt(e.target.value, 10) || 0)
                    }
                    placeholder="0"
                    className={inputClass.replace("w-full", "flex-1")}
                  />
                  <span className="text-xs text-gray-500">pcs</span>
                </div>
              </div>
            </div>
          </div>

          {/* Harga Beli */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {hasDus ? "HARGA BELI PER DUS (MODAL)" : "HARGA BELI PER PCS (MODAL)"}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                Rp
              </span>
              <input
                type="number"
                inputMode="numeric"
                value={costInput || ""}
                onChange={(e) =>
                  setCostInput(parseInt(e.target.value, 10) || 0)
                }
                placeholder="0"
                className={priceClass}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {hasDus
                ? `Modal per pcs: ${costInput > 0 ? `Rp ${Math.round(costInput / dusIsi).toLocaleString("id-ID")}` : "—"} (isi ${dusIsi} pcs/dus)`
                : "Isi per dus belum diisi, jadi modal dihitung per pcs."}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3 p-4 border-t border-gray-200 shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-3 sm:py-2 text-gray-700 text-sm font-medium hover:text-gray-900 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="w-full sm:w-auto px-5 py-3 sm:py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          >
            Simpan Produk
          </button>
        </div>
      </div>
    </div>
  );
}
