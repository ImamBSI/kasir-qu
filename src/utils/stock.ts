import type { Product, ProductUnit } from "@/types";

const DEFAULT_MIN_STOCK = 20;

/**
 * Stok yang tersedia untuk satuan tertentu.
 * Contoh: stok 10 pcs, satuan Dus berisi 12 pcs -> 0 dus.
 */
export function getUnitStock(product: Product, unit: ProductUnit): number {
  const conversion = unit.isi_dalam_satuan_dasar || 1;
  return Math.max(0, Math.floor(product.stock_pcs / conversion));
}

/** Stok berdasarkan satuan dasar (units[0], biasanya Pcs/Kg). */
export function getBaseStock(product: Product): number {
  return getUnitStock(product, product.units[0]);
}

/** Barang dianggap habis jika stok satuan dasarnya 0. */
export function isOutOfStock(product: Product): boolean {
  return getBaseStock(product) <= 0;
}

/** Batas minimum stok sebelum dianggap menipis. */
export function getMinStock(product: Product): number {
  return product.min_stock ?? DEFAULT_MIN_STOCK;
}

/** Stok menipis: masih ada, tapi di bawah batas minimum. */
export function isLowStock(product: Product): boolean {
  const stock = getBaseStock(product);
  return stock > 0 && stock < getMinStock(product);
}
