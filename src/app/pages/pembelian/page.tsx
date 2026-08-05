"use client";

import { useState, useMemo } from "react";
import { Search, ShoppingCart, Minus, Plus } from "lucide-react";
import productsData from "@/data/products.json";
import type { CartItem, Product, ProductUnit } from "@/types";

export default function PembelianPage() {
  const products = productsData as Product[];
  const [selectedCategory, setSelectedCategory] = useState("Semua Kategori");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUnits, setSelectedUnits] = useState<Record<number, number>>(
    {},
  );
  const [editQty, setEditQty] = useState<Record<string, string>>({});

  const categories = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category))];
    return ["Semua Kategori", ...cats];
  }, [products]);

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "Semua Kategori" ||
      product.category === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getSelectedUnit = (productId: number): ProductUnit | undefined => {
    const product = products.find((p) => p.id === productId);
    if (!product || !product.units || product.units.length === 0)
      return undefined;
    const unitIndex = selectedUnits[productId] ?? 0;
    return product.units[unitIndex] ?? product.units[0];
  };

  const addToCart = (product: Product) => {
    const unit = getSelectedUnit(product.id);

    // Pastikan unit tidak undefined sebelum dimasukkan ke keranjang
    if (!unit) return;

    setCart((prev) => {
      const existing = prev.find(
        (item) => item.id === product.id && item.unit.satuan === unit.satuan,
      );
      if (existing) {
        return prev.map((item) =>
          item.id === product.id && item.unit.satuan === unit.satuan
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          image: product.image,
          unit, 
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (id: number, satuan: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id && item.unit.satuan === satuan
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const handleQtyInput = (id: number, satuan: string, value: string) => {
    setEditQty((prev) => ({ ...prev, [`${id}-${satuan}`]: value }));
  };

  const handleQtyBlur = (id: number, satuan: string) => {
    const key = `${id}-${satuan}`;
    const qty = parseInt(editQty[key], 10);
    if (!isNaN(qty) && qty > 0) {
      setCart((prev) =>
        prev.map((item) =>
          item.id === id && item.unit.satuan === satuan
            ? { ...item, quantity: qty }
            : item,
        ),
      );
    }
    setEditQty((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleQtyKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    id: number,
    satuan: string,
  ) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce(
    (sum, item) => sum + item.unit.price * item.quantity,
    0,
  );
  const total = subtotal;

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString("id-ID")}`;
  };

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        {/* Search Bar */}
        <div className="p-3 bg-white border-b border-gray-200">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products, SKUs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="px-3 py-2 bg-white border-b border-gray-200">
          <div className="flex gap-1.5 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
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

        {/* Products Grid */}
        <div className="flex-1 overflow-auto p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredProducts.map((product) => {
              const unitIndex = selectedUnits[product.id] ?? 0;
              const currentUnit = product.units[unitIndex];
              return (
                <div
                  key={product.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-gray-100">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2">
                    <h3 className="font-semibold text-gray-900 text-xs mb-0.5 truncate">
                      {product.name}
                    </h3>
                    <p className="text-[10px] text-gray-500 mb-1">
                      SKU: {product.sku}
                    </p>

                    {/* Unit Selector */}
                    <div className="flex gap-0.5 mb-1.5">
                      {product.units.map((unit, idx) => (
                        <button
                          key={unit.satuan}
                          onClick={() =>
                            setSelectedUnits((prev) => ({
                              ...prev,
                              [product.id]: idx,
                            }))
                          }
                          className={`flex-1 py-0.5 px-1 text-[10px] rounded border transition-colors ${
                            unitIndex === idx
                              ? "bg-blue-700 text-white border-blue-700"
                              : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {unit.satuan}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-blue-700 font-bold text-xs">
                          {formatCurrency(currentUnit.price)}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          /{currentUnit.satuan}
                        </span>
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        className="w-6 h-6 bg-gray-100 hover:bg-blue-700 hover:text-white rounded-full flex items-center justify-center transition-colors"
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cart Panel */}
      <div className="w-72 bg-white border-l border-gray-200 flex flex-col">
        {/* Customer Input */}
        <div className="p-3 border-b border-gray-200">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Nama Pelanggan (Opsional)
          </label>
          <input
            type="text"
            placeholder="Masukkan nama pelanggan"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto p-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShoppingCart className="size-10 mb-2" />
              <p className="text-xs">Keranjang kosong</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => {
                const key = `${item.id}-${item.unit.satuan}`;
                const isEditing = editQty[key] !== undefined;
                return (
                  <div
                    key={key}
                    className="flex gap-2 p-2 bg-gray-50 rounded-lg"
                  >
                    <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-blue-700">
                        {formatCurrency(item.unit.price)}/{item.unit.satuan}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.unit.satuan, -1)
                        }
                        className="w-5 h-5 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center"
                      >
                        <Minus className="size-2.5" />
                      </button>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editQty[key]}
                          onChange={(e) =>
                            handleQtyInput(
                              item.id,
                              item.unit.satuan,
                              e.target.value,
                            )
                          }
                          onBlur={() =>
                            handleQtyBlur(item.id, item.unit.satuan)
                          }
                          onKeyDown={(e) =>
                            handleQtyKeyDown(
                              e as React.KeyboardEvent<HTMLInputElement>,
                              item.id,
                              item.unit.satuan,
                            )
                          }
                          autoFocus
                          className="w-10 text-center text-xs border border-blue-500 rounded focus:outline-none"
                        />
                      ) : (
                        <button
                          onClick={() =>
                            setEditQty((prev) => ({
                              ...prev,
                              [key]: String(item.quantity),
                            }))
                          }
                          className="w-10 text-center text-xs font-medium hover:text-blue-600"
                        >
                          {item.quantity}
                        </button>
                      )}
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.unit.satuan, 1)
                        }
                        className="w-5 h-5 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center"
                      >
                        <Plus className="size-2.5" />
                      </button>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-semibold text-gray-900">
                        {formatCurrency(item.unit.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="border-t border-gray-200 p-3 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Total Item</span>
            <span className="font-medium">{totalItems} Items</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between pt-1.5 border-t border-gray-200">
            <span className="text-base font-bold text-gray-900">Total</span>
            <span className="text-xl font-bold text-blue-700">
              {formatCurrency(total)}
            </span>
          </div>
          <button className="w-full py-2.5 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 mt-3">
            <ShoppingCart className="size-4" />
            Selesaikan Transaksi
          </button>
        </div>
      </div>
    </div>
  );
}
