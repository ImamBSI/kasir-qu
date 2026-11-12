"use client";

import { useState } from "react";
import { X, Package } from "lucide-react";
import type { Product, ProductUnit } from "@/types";
import { formatCurrency } from "@/utils/format";
import ImageUpload from "./imageUpload";

interface ModalEditBarangProps {
  product: Product;
  onClose: () => void;
  onSave: (
    productId: number,
    updatedUnits: ProductUnit[],
    image: string,
    costPrice: number,
    costUnit: string,
  ) => void;
  onAddStock: (productId: number, quantity: number, satuan: string) => void;
}

const defaultFieldClass =
  "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const priceFieldClass =
  "w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

export default function ModalEditBarang({
  product,
  onClose,
  onSave,
  onAddStock,
}: ModalEditBarangProps) {
  const [image, setImage] = useState(product.image);
  const [prices, setPrices] = useState<Record<string, number>>(
    product.units.reduce(
      (acc, unit) => ({ ...acc, [unit.satuan]: unit.price }),
      {},
    ),
  );
  const [costs, setCosts] = useState<Record<string, number>>(
    product.units.reduce((acc, unit) => {
      let initialCost = unit.cost_price ?? 0;

      if (unit.cost_price == null) {
        if (product.cost_unit === unit.satuan) {
          initialCost = product.cost_price ?? 0;
        } else if (!product.cost_unit || product.cost_unit === "Pcs") {
          initialCost = (product.cost_price ?? 0) * unit.isi_dalam_satuan_dasar;
        }
      }

      return { ...acc, [unit.satuan]: initialCost };
    }, {}),
  );

  const defaultStockUnit =
    product.units.find((u) => u.satuan === "Dus")?.satuan ??
    product.units.find((u) => u.satuan === "Rcg")?.satuan ??
    product.units[0]?.satuan ??
    "Pcs";
  const [stockUnit, setStockUnit] = useState(defaultStockUnit);
  const [stockQty, setStockQty] = useState(0);
  const [stockMessage, setStockMessage] = useState("");

  const selectedUnit =
    product.units.find((u) => u.satuan === stockUnit) ?? product.units[0];
  const selectedIsi = selectedUnit?.isi_dalam_satuan_dasar ?? 1;
  const projectedStock =
    product.stock_pcs + (stockQty > 0 ? Math.round(stockQty * selectedIsi) : 0);

  const handlePriceChange = (satuan: string, value: string) => {
    setPrices((prev) => ({
      ...prev,
      [satuan]: parseInt(value, 10) || 0,
    }));
  };

  const handleCostChange = (satuan: string, value: string) => {
    setCosts((prev) => ({
      ...prev,
      [satuan]: parseInt(value, 10) || 0,
    }));
  };

  const handleAddStock = () => {
    if (!selectedUnit || stockQty <= 0) return;

    const addedPcs = Math.round(stockQty * selectedIsi);
    onAddStock(product.id, stockQty, selectedUnit.satuan);
    setStockMessage(
      `Berhasil menambah ${stockQty} ${selectedUnit.satuan} (+${addedPcs} pcs).`,
    );
    setStockQty(0);
  };

  const handleSave = () => {
    const updatedUnits = product.units.map((unit) => ({
      ...unit,
      price: prices[unit.satuan] ?? unit.price,
      cost_price: costs[unit.satuan] ?? unit.cost_price ?? 0,
    }));

    const primaryUnit =
      product.units.find((unit) => unit.satuan === "Dus") ??
      product.units.find((unit) => unit.satuan === "Rcg") ??
      product.units[0];

    onSave(
      product.id,
      updatedUnits,
      image,
      primaryUnit ? (costs[primaryUnit.satuan] ?? 0) : 0,
      primaryUnit?.satuan ?? "Pcs",
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="bg-white rounded-t-2xl sm:rounded-lg shadow-xl w-full max-w-2xl max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">
            Update Stok, Harga Jual & Modal
          </h2>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-5">
          {/* Product Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="size-10 shrink-0 overflow-hidden rounded bg-gray-200">
              <img
                src={image || "/images/placeholder.svg"}
                alt={product.name}
                className="size-full object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {product.name}
              </p>
              <p className="text-xs text-gray-500">SKU: {product.sku}</p>
            </div>
          </div>

          {/* TAMBAH STOK MASUK */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 bg-blue-700 rounded-sm flex items-center justify-center">
                <Package className="size-2.5 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Tambah Stok Masuk
              </h3>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Jumlah
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={stockQty || ""}
                  onChange={(e) => {
                    setStockQty(parseInt(e.target.value, 10) || 0);
                    setStockMessage("");
                  }}
                  placeholder="0"
                  className={defaultFieldClass}
                />
              </div>

              <div className="sm:w-52">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Satuan
                </label>
                <select
                  value={stockUnit}
                  onChange={(e) => {
                    setStockUnit(e.target.value);
                    setStockMessage("");
                  }}
                  className={defaultFieldClass}
                >
                  {product.units.map((unit) => (
                    <option key={unit.satuan} value={unit.satuan}>
                      {unit.satuan} (isi {unit.isi_dalam_satuan_dasar} pcs)
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleAddStock}
                disabled={stockQty <= 0 || !selectedUnit}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
              >
                Tambah Stok
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Stok saat ini:{" "}
              <strong className="text-gray-700">{product.stock_pcs} pcs</strong>
              {selectedUnit && stockQty > 0 && (
                <>
                  {" "}
                  → {product.stock_pcs} + ({stockQty} × {selectedIsi}) ={" "}
                  <strong className="text-gray-700">
                    {projectedStock} pcs
                  </strong>
                </>
              )}
            </p>
            {stockMessage && (
              <p className="text-xs font-medium text-emerald-600 mt-1">
                {stockMessage}
              </p>
            )}
          </div>

          {/* PENYESUAIAN HARGA */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 bg-blue-700 rounded-sm flex items-center justify-center">
                <span className="text-[8px] text-white font-bold">Rp</span>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Penyesuaian Harga Jual & Modal (Rp)
              </h3>
            </div>
            <ImageUpload value={image} onChange={setImage} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-3">
              {product.units.map((unit) => {
                const sellPrice = prices[unit.satuan] ?? unit.price;
                const costPrice = costs[unit.satuan] ?? 0;
                const profit = sellPrice - costPrice;

                return (
                  <div key={unit.satuan} className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Harga Jual per {unit.satuan}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                          Rp
                        </span>
                        <input
                          type="number"
                          value={prices[unit.satuan] ?? unit.price}
                          onChange={(e) =>
                            handlePriceChange(unit.satuan, e.target.value)
                          }
                          className={priceFieldClass}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Harga Modal per {unit.satuan}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                          Rp
                        </span>
                        <input
                          type="number"
                          value={costs[unit.satuan] ?? ""}
                          onChange={(e) =>
                            handleCostChange(unit.satuan, e.target.value)
                          }
                          className={priceFieldClass}
                        />
                      </div>
                    </div>
                    {sellPrice > 0 && costPrice > 0 && (
                      <p
                        className={`text-xs font-medium ${
                          profit >= 0 ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        Laba: {formatCurrency(profit)}/{unit.satuan}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3 p-4 sm:p-5 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-3 sm:py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="w-full sm:w-auto px-5 py-3 sm:py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
          >
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  );
}
