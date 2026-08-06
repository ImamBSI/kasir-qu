"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import productsData from "@/data/products.json";
import type { Product, ProductUnit } from "@/types";
import { formatCurrency } from "@/utils/format";
import ModalEditBarang from "./components/modalEditBarang";
import ModalInputBarang from "./components/modalInputBarang";

const ITEMS_PER_PAGE = 10;

export default function GudangPage() {
  const [products, setProducts] = useState<Product[]>(
    productsData as Product[],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showInputModal, setShowInputModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [selectedUnits, setSelectedUnits] = useState<Record<number, number>>(
    {},
  );
  const categories = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category))];
    return ["Semua", ...cats];
  }, [products]);

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "Semua" || product.category === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const startEntry = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endEntry = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredProducts.length,
  );

  const handleSaveUpdate = (
    productId: number,
    updatedUnits: ProductUnit[],
    updatedStock: number
  ) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, units: updatedUnits, stock_pcs: updatedStock }
          : p
      )
    );
    setEditingProduct(null);
  };

  const handleAddProduct = (newProduct: {
    name: string;
    category: string;
    units: { satuan: string; price: number; isi_dalam_satuan_dasar: number }[];
  }) => {
    const maxId = products.reduce((max, p) => Math.max(max, p.id), 0);
    const product: Product = {
      id: maxId + 1,
      name: newProduct.name,
      sku: `SKU-${maxId + 1}`,
      category: newProduct.category,
      image: "/images/default.webp",
      stock_pcs: 0,
      units: newProduct.units,
    };
    setProducts((prev) => [...prev, product]);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage stock levels and pricing
          </p>
        </div>
        <button
          onClick={() => setShowInputModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-md text-sm font-medium hover:bg-blue-800"
        >
          <Plus className="size-4" />
          Tambah Produk
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3 mb-4 p-4 bg-white border border-gray-200 rounded-lg">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama atau SKU..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category);
                setCurrentPage(1);
              }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? "bg-blue-700 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-16">
                  Img
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-45">
                  Product Details
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">
                  Unit
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">
                  Price (Rp)
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">
                  Stock Qty
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedProducts.map((product) => {
                const selectedUnitIndex = selectedUnits[product.id] ?? 0;
                const currentUnit =
                  product.units[selectedUnitIndex] ?? product.units[0];
                const stock = product.stock_pcs;
                const isLowStock = stock < 20;
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        SKU: {product.sku}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDropdown(
                              activeDropdown === product.id ? null : product.id,
                            );
                          }}
                          className="inline-flex items-center justify-between bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium rounded px-2.5 py-1 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 gap-2"
                        >
                          <span>{currentUnit.satuan}</span>
                          <svg
                            className="size-3 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>

                        {activeDropdown === product.id && (
                          <div className="absolute left-0 z-50 mt-1 w-28 bg-white border border-gray-200 rounded shadow-md py-1">
                            {product.units.map((u, index) => (
                              <button
                                key={u.satuan}
                                type="button"
                                onClick={() => {
                                  setSelectedUnits((prev) => ({
                                    ...prev,
                                    [product.id]: index,
                                  }));
                                  setActiveDropdown(null);
                                }}
                                className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                                  currentUnit.satuan === u.satuan
                                    ? "bg-blue-50 text-blue-700 font-semibold"
                                    : "text-gray-700 hover:bg-gray-50"
                                }`}
                              >
                                {u.satuan}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-mono">
                        {formatCurrency(currentUnit.price)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end">
                        <span
                          className={`text-sm font-semibold ${isLowStock ? "text-red-600" : "text-gray-900"}`}
                        >
                          {stock}
                        </span>
                        {isLowStock && (
                          <span className="text-[10px] text-red-500">
                            Low Stock
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end">
                        <button
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-md text-sm font-medium hover:bg-blue-800 transition-colors"
                          onClick={() => setEditingProduct(product)}
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredProducts.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {startEntry} to {endEntry} of {filteredProducts.length}{" "}
              entries
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="size-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 text-sm rounded ${
                      currentPage === page
                        ? "bg-blue-700 text-white"
                        : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-1.5 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Edit */}
      {editingProduct && (
        <ModalEditBarang
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={handleSaveUpdate}
        />
      )}

      {/* Modal Input Barang */}
      {showInputModal && (
        <ModalInputBarang
          categories={categories}
          onClose={() => setShowInputModal(false)}
          onSave={handleAddProduct}
        />
      )}
    </div>
  );
}
