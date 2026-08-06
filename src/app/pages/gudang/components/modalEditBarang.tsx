"use client";

import { useState } from "react";
import { X, Package } from "lucide-react";
import type { Product, ProductUnit } from "@/types";
import { formatCurrency } from "@/utils/format";

interface ModalEditBarangProps {
  product: Product;
  onClose: () => void;
  onSave: (productId: number, updatedUnits: ProductUnit[], updatedStock: number) => void;
}

export default function ModalEditBarang({ product, onClose, onSave }: ModalEditBarangProps) {
  const [stockAdditions, setStockAdditions] = useState<Record<string, number>>(
    product.units.reduce((acc, unit) => ({ ...acc, [unit.satuan]: 0 }), {})
  );
  const [prices, setPrices] = useState<Record<string, number>>(
    product.units.reduce((acc, unit) => ({ ...acc, [unit.satuan]: unit.price }), {})
  );

  const getStockForUnit = (unit: ProductUnit) => {
    return Math.floor(product.stock_pcs / unit.isi_dalam_satuan_dasar);
  };

  const handleStockChange = (satuan: string, value: string) => {
    setStockAdditions((prev) => ({
      ...prev,
      [satuan]: parseInt(value, 10) || 0,
    }));
  };

  const handlePriceChange = (satuan: string, value: string) => {
    setPrices((prev) => ({
      ...prev,
      [satuan]: parseInt(value, 10) || 0,
    }));
  };

  const handleSave = () => {
    const updatedUnits = product.units.map((unit) => ({
      ...unit,
      price: prices[unit.satuan] ?? unit.price,
    }));

    const totalAddedPcs = product.units.reduce(
      (sum, unit) => sum + (stockAdditions[unit.satuan] ?? 0) * unit.isi_dalam_satuan_dasar,
      0
    );

    const updatedStock = product.stock_pcs + totalAddedPcs;

    onSave(product.id, updatedUnits, updatedStock);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Update Stok & Harga Produk
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Product Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
              <Package className="size-5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{product.name}</p>
              <p className="text-xs text-gray-500">SKU: {product.sku}</p>
            </div>
          </div>

          {/* UPDATE STOK BARU */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 bg-blue-700 rounded-sm flex items-center justify-center">
                <Package className="size-2.5 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Update Stok Baru
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {product.units.map((unit) => (
                <div key={unit.satuan}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tambah {unit.satuan}
                  </label>
                  <input
                    type="number"
                    value={stockAdditions[unit.satuan] ?? 0}
                    onChange={(e) => handleStockChange(unit.satuan, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Stok saat ini: {getStockForUnit(unit)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* PENYESUAIAN HARGA */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 bg-blue-700 rounded-sm flex items-center justify-center">
                <span className="text-[8px] text-white font-bold">Rp</span>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Penyesuaian Harga (Rp)
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {product.units.map((unit) => (
                <div key={unit.satuan}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Harga per {unit.satuan}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                      Rp
                    </span>
                    <input
                      type="number"
                      value={prices[unit.satuan] ?? unit.price}
                      onChange={(e) => handlePriceChange(unit.satuan, e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
          >
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  );
}
