"use client";

import { useState, useMemo } from "react";
import { Search, ShoppingCart, Minus, Plus, Trash, X } from "lucide-react";
import productsData from "@/data/products.json";
import type { CartItem, Product, ProductUnit } from "@/types";
import { getUnitStock, isOutOfStock } from "@/utils/stock";

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
  const [isCartOpen, setIsCartOpen] = useState(false);

  const removeFromCart = (id: number, satuan: string) => {
    setCart((prev) =>
      prev.filter((item) => !(item.id === id && item.unit.satuan === satuan)),
    );
    const key = `${id}-${satuan}`;
    setEditQty((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const clearCart = () => {
    setCart([]);
    setEditQty({});
  };

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

  const getAvailableStock = (productId: number, satuan: string) => {
    const product = products.find((p) => p.id === productId);
    const unit = product?.units.find((u) => u.satuan === satuan);
    return product && unit ? getUnitStock(product, unit) : 0;
  };

  const addToCart = (product: Product) => {
    const unit = getSelectedUnit(product.id);
    if (!unit) return;

    const available = getUnitStock(product, unit);
    if (available <= 0) return;

    setCart((prev) => {
      const existing = prev.find(
        (item) => item.id === product.id && item.unit.satuan === unit.satuan,
      );
      if (existing) {
        if (existing.quantity >= available) return prev;
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
    const available = getAvailableStock(id, satuan);
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id && item.unit.satuan === satuan
            ? {
                ...item,
                quantity: Math.min(
                  available,
                  Math.max(0, item.quantity + delta),
                ),
              }
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
    const available = getAvailableStock(id, satuan);
    if (!isNaN(qty)) {
      const clamped = Math.min(Math.max(0, qty), available);
      setCart((prev) =>
        prev
          .map((item) =>
            item.id === id && item.unit.satuan === satuan
              ? { ...item, quantity: clamped }
              : item,
          )
          .filter((item) => item.quantity > 0),
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
    <div className="flex h-full overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
        {/* Search Bar */}
        <div className="p-3 bg-white border-b border-gray-200 shrink-0">
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
        <div className="px-3 py-2 bg-white border-b border-gray-200 shrink-0">
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

        {/* Products Grid - Scrollable */}
        <div className="flex-1 overflow-y-auto p-3 pb-24 md:pb-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-2">
            {filteredProducts.map((product) => {
              const unitIndex = selectedUnits[product.id] ?? 0;
              const currentUnit = product.units[unitIndex] ?? product.units[0];
              const available = getUnitStock(product, currentUnit);
              const empty = isOutOfStock(product);
              const inCart =
                cart.find(
                  (item) =>
                    item.id === product.id &&
                    item.unit.satuan === currentUnit.satuan,
                )?.quantity ?? 0;
              const reachedLimit = available > 0 && inCart >= available;

              return (
                <div
                  key={product.id}
                  className={`relative bg-white border border-gray-200 rounded-lg overflow-hidden transition-shadow ${
                    empty ? "opacity-70" : "hover:shadow-md"
                  }`}
                >
                  <div className="relative aspect-square bg-gray-100">
                    <img
                      src={product.image}
                      alt={product.name}
                      className={`w-full h-full object-cover ${empty ? "grayscale" : ""}`}
                    />
                    {empty && (
                      <span className="absolute left-1.5 top-1.5 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        Habis
                      </span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <h3 className="font-semibold text-gray-900 text-sm mb-0.5 truncate">
                      {product.name}
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      SKU: {product.sku}
                    </p>
                    <p
                      className={`text-[11px] mb-1.5 ${
                        empty || available === 0
                          ? "text-red-600 font-medium"
                          : "text-gray-500"
                      }`}
                    >
                      {empty
                        ? "Stok habis"
                        : available === 0
                          ? `Stok ${currentUnit.satuan} habis`
                          : `Sisa ${available} ${currentUnit.satuan}`}
                    </p>

                    {/* Unit Selector */}
                    <div className="flex gap-0.5 mb-2">
                      {product.units.map((unit, idx) => {
                        const unitStock = getUnitStock(product, unit);
                        return (
                          <button
                            key={unit.satuan}
                            onClick={() =>
                              setSelectedUnits((prev) => ({
                                ...prev,
                                [product.id]: idx,
                              }))
                            }
                            disabled={unitStock === 0}
                            title={
                              unitStock === 0
                                ? `Stok ${unit.satuan} habis`
                                : undefined
                            }
                            className={`flex-1 py-1.5 px-1 text-[11px] rounded border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                              unitIndex === idx
                                ? "bg-blue-700 text-white border-blue-700"
                                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {unit.satuan}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-blue-700 font-bold text-sm">
                          {formatCurrency(currentUnit.price)}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          /{currentUnit.satuan}
                        </span>
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        disabled={empty || available === 0 || reachedLimit}
                        aria-label={
                          reachedLimit
                            ? `Stok ${product.name} sudah maksimal di keranjang`
                            : `Tambah ${product.name}`
                        }
                        className="w-9 h-9 md:w-8 md:h-8 shrink-0 bg-gray-100 hover:bg-blue-700 hover:text-white rounded-full flex items-center justify-center transition-colors disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-300 disabled:hover:bg-gray-100"
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                    {reachedLimit && (
                      <p className="mt-1 text-[10px] text-amber-600">
                        Maksimal di keranjang
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tombol keranjang - mobile */}
      <button
        onClick={() => setIsCartOpen(true)}
        className="md:hidden fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 flex items-center gap-2 px-4 py-3 bg-blue-700 text-white rounded-full shadow-lg text-sm font-semibold active:bg-blue-800"
      >
        <ShoppingCart className="size-5" />
        {totalItems > 0 ? `${totalItems} item · ${formatCurrency(total)}` : "Keranjang"}
      </button>

      {/* Backdrop keranjang - mobile */}
      {isCartOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setIsCartOpen(false)}
        />
      )}

      {/* Cart Panel */}
      <div
        className={`${
          isCartOpen ? "flex" : "hidden"
        } md:flex fixed inset-x-0 bottom-0 z-50 h-[85dvh] flex-col bg-white border-t border-gray-200 rounded-t-2xl shadow-xl pb-[env(safe-area-inset-bottom)] md:static md:inset-auto md:z-auto md:h-auto md:w-96 md:shrink-0 md:rounded-none md:border-t-0 md:border-l md:shadow-none md:pb-0`}
      >
        {/* Header keranjang - mobile */}
        <div className="md:hidden flex items-center justify-between p-3 border-b border-gray-200 shrink-0">
          <h2 className="text-base font-semibold text-gray-900">Keranjang</h2>
          <button
            onClick={() => setIsCartOpen(false)}
            aria-label="Tutup keranjang"
            className="p-2 -mr-1 text-gray-500"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Customer Input */}
        <div className="p-3 border-b border-gray-200 shrink-0">
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

        {/* Cart Items - Scrollable */}
        <div className="flex-1 overflow-y-auto p-3">
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
                const available = getAvailableStock(item.id, item.unit.satuan);
                return (
                  <div
                    key={key}
                    className="flex gap-3 p-3 bg-gray-50 rounded-lg shadow-sm"
                  >
                    <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-blue-700">
                        {formatCurrency(item.unit.price)}/{item.unit.satuan}
                      </p>
                      {item.quantity >= available && (
                        <p className="text-[10px] font-medium text-amber-600">
                          Maks. {available} {item.unit.satuan}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(item.unit.price * item.quantity)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.unit.satuan, -1)
                            }
                            className="w-9 h-9 md:w-7 md:h-7 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center"
                          >
                            <Minus className="size-4" />
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
                              max={available}
                              className="w-12 text-center text-sm border border-blue-500 rounded focus:outline-none"
                            />
                          ) : (
                            <button
                              onClick={() =>
                                setEditQty((prev) => ({
                                  ...prev,
                                  [key]: String(item.quantity),
                                }))
                              }
                              className="w-12 text-center text-sm font-medium hover:text-blue-600"
                            >
                              {item.quantity}
                            </button>
                          )}
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.unit.satuan, 1)
                            }
                            disabled={item.quantity >= available}
                            aria-label={`Tambah jumlah ${item.name}`}
                            className="w-9 h-9 md:w-7 md:h-7 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-gray-200"
                          >
                            <Plus className="size-4" />
                          </button>
                        </div>
                        <button
                          onClick={() =>
                            removeFromCart(item.id, item.unit.satuan)
                          }
                          className="w-9 h-9 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded flex items-center justify-center transition-colors"
                        >
                          <Trash className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="border-t border-gray-200 p-3 space-y-1.5 shrink-0">
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
          <button className="w-full py-3 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 mt-3">
            <ShoppingCart className="size-4" />
            Selesaikan Transaksi
          </button>
        </div>
      </div>
    </div>
  );
}
