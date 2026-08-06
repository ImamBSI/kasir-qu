"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface ModalInputBarangProps {
  categories: string[];
  onClose: () => void;
  onSave: (product: {
    name: string;
    category: string;
    units: { satuan: string; price: number; isi_dalam_satuan_dasar: number }[];
  }) => void;
}

export default function ModalInputBarang({ categories, onClose, onSave }: ModalInputBarangProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [pcsPrice, setPcsPrice] = useState(0);
  const [rcgPrice, setRcgPrice] = useState(0);
  const [rcgIsi, setRcgIsi] = useState(0);
  const [dusPrice, setDusPrice] = useState(0);
  const [dusIsi, setDusIsi] = useState(0);

  const handleSave = () => {
    const units = [{ satuan: "Pcs", price: pcsPrice, isi_dalam_satuan_dasar: 1 }];
    if (rcgPrice > 0 && rcgIsi > 0) {
      units.push({ satuan: "Rcg", price: rcgPrice, isi_dalam_satuan_dasar: rcgIsi });
    }
    if (dusPrice > 0 && dusIsi > 0) {
      units.push({ satuan: "Dus", price: dusPrice, isi_dalam_satuan_dasar: dusIsi });
    }

    onSave({ name, category, units });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Tambah Produk Baru</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
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
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategori
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Pilih Kategori</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

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
                    value={pcsPrice || ""}
                    onChange={(e) => setPcsPrice(parseInt(e.target.value, 10) || 0)}
                    placeholder="0"
                    className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    value={rcgPrice || ""}
                    onChange={(e) => setRcgPrice(parseInt(e.target.value, 10) || 0)}
                    placeholder="Harga per Renceng"
                    className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 whitespace-nowrap">ISI PER RENCENG</span>
                  <input
                    type="number"
                    value={rcgIsi || ""}
                    onChange={(e) => setRcgIsi(parseInt(e.target.value, 10) || 0)}
                    placeholder="0"
                    className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    value={dusPrice || ""}
                    onChange={(e) => setDusPrice(parseInt(e.target.value, 10) || 0)}
                    placeholder="Harga per Dus"
                    className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 whitespace-nowrap">ISI PER DUS</span>
                  <input
                    type="number"
                    value={dusIsi || ""}
                    onChange={(e) => setDusIsi(parseInt(e.target.value, 10) || 0)}
                    placeholder="0"
                    className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-xs text-gray-500">pcs</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-gray-700 text-sm font-medium hover:text-gray-900 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
          >
            Simpan Produk
          </button>
        </div>
      </div>
    </div>
  );
}
