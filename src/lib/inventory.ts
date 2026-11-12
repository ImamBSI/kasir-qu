import "server-only";

import { randomUUID } from "node:crypto";
import { getDbPool } from "@/lib/db";
import { deleteProductImage } from "@/lib/objectStorage";
import type { Product, ProductUnit } from "@/types";
import { getObjectStorageImageKey } from "@/utils/productImage";
import type {
  AddStockInput,
  CreateProductInput,
  ProductUnitInput,
  UpdateProductInput,
} from "@/types/inventory";

const DEFAULT_IMAGE = "/images/placeholder.svg";

interface ProductRow {
  id: string;
  sku: string;
  name: string;
  image: string | null;
  stock_pcs: number;
  category_name: string | null;
}

interface UnitRow {
  product_id: string;
  satuan: string;
  isi_dalam_satuan: number;
  harga: string;
  modal: string;
}

function assertValidUnits(units: ProductUnitInput[]) {
  if (units.length === 0) {
    throw new Error("Minimal satu satuan harus diisi.");
  }

  const names = new Set<string>();
  for (const unit of units) {
    if (!unit.satuan.trim()) {
      throw new Error("Nama satuan tidak boleh kosong.");
    }
    if (names.has(unit.satuan)) {
      throw new Error(`Satuan ${unit.satuan} dobel.`);
    }
    names.add(unit.satuan);

    if (!Number.isInteger(unit.isi_dalam_satuan_dasar) || unit.isi_dalam_satuan_dasar < 1) {
      throw new Error(`Isi per ${unit.satuan} harus bilangan bulat minimal 1.`);
    }
    if (!(unit.price >= 0) || !(unit.cost_price >= 0)) {
      throw new Error(`Harga ${unit.satuan} tidak valid.`);
    }
  }

  if (!units.some((unit) => unit.isi_dalam_satuan_dasar === 1)) {
    throw new Error("Satuan dasar (isi 1 pcs) wajib ada.");
  }
}

export async function listProducts(): Promise<Product[]> {
  const pool = getDbPool();

  const productResult = await pool.query<ProductRow>(
    `SELECT p.id::text, p.sku, p.name, p.image, p.stock_pcs,
            c.name AS category_name
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     ORDER BY p.id`,
  );

  const unitResult = await pool.query<UnitRow>(
    `SELECT product_id::text, satuan, isi_dalam_satuan, harga::text, modal::text
     FROM product_units
     ORDER BY product_id, isi_dalam_satuan`,
  );

  const unitsByProduct = new Map<string, ProductUnit[]>();
  for (const row of unitResult.rows) {
    const list = unitsByProduct.get(row.product_id) ?? [];
    list.push({
      satuan: row.satuan,
      isi_dalam_satuan_dasar: row.isi_dalam_satuan,
      price: Number(row.harga),
      cost_price: Number(row.modal),
    });
    unitsByProduct.set(row.product_id, list);
  }

  return productResult.rows.map((row) => ({
    id: Number(row.id),
    name: row.name,
    sku: row.sku,
    category: row.category_name ?? "Tanpa Kategori",
    image: row.image || DEFAULT_IMAGE,
    stock_pcs: row.stock_pcs,
    units: unitsByProduct.get(row.id) ?? [],
  }));
}

export async function createProduct(input: CreateProductInput): Promise<number> {
  const name = input.name.trim();
  const category = input.category.trim();

  if (!name) throw new Error("Nama produk wajib diisi.");
  if (!category) throw new Error("Kategori wajib diisi.");
  assertValidUnits(input.units);

  const client = await getDbPool().connect();
  try {
    await client.query("BEGIN");

    const categoryResult = await client.query<{ id: string }>(
      `INSERT INTO categories (name) VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id::text`,
      [category],
    );

    // SKU sementara unik, lalu diganti jadi SKU-<id> setelah id didapat.
    const productResult = await client.query<{ id: string }>(
      `INSERT INTO products (category_id, sku, name, image, stock_pcs)
       VALUES ($1, $2, $3, $4, 0)
       RETURNING id::text`,
      [
        categoryResult.rows[0].id,
        `TMP-${randomUUID()}`,
        name,
        input.image || null,
      ],
    );
    const productId = productResult.rows[0].id;

    await client.query(`UPDATE products SET sku = $2 WHERE id = $1`, [
      productId,
      `SKU-${productId.padStart(4, "0")}`,
    ]);

    for (const unit of input.units) {
      await client.query(
        `INSERT INTO product_units (product_id, satuan, isi_dalam_satuan, harga, modal)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          productId,
          unit.satuan,
          unit.isi_dalam_satuan_dasar,
          unit.price,
          unit.cost_price,
        ],
      );
    }

    await client.query("COMMIT");
    return Number(productId);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export async function updateProduct(
  input: UpdateProductInput,
): Promise<string | void> {
  assertValidUnits(input.units);

  const client = await getDbPool().connect();
  let previousImage: string | null = null;
  try {
    await client.query("BEGIN");

    const existingProduct = await client.query<{ image: string | null }>(
      `SELECT image FROM products WHERE id = $1 FOR UPDATE`,
      [input.productId],
    );
    if (existingProduct.rowCount !== 1) {
      throw new Error("Produk tidak ditemukan.");
    }
    previousImage = existingProduct.rows[0].image;

    const productUpdate = await client.query(
      `UPDATE products SET image = $2, updated_at = now() WHERE id = $1`,
      [input.productId, input.image || null],
    );
    if (productUpdate.rowCount !== 1) {
      throw new Error("Produk tidak ditemukan.");
    }

    for (const unit of input.units) {
      const unitUpdate = await client.query(
        `UPDATE product_units
         SET harga = $3, modal = $4, updated_at = now()
         WHERE product_id = $1 AND satuan = $2`,
        [input.productId, unit.satuan, unit.price, unit.cost_price],
      );
      if (unitUpdate.rowCount !== 1) {
        throw new Error(`Satuan ${unit.satuan} tidak ditemukan pada produk ini.`);
      }
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }

  const previousKey = getObjectStorageImageKey(previousImage);
  const nextKey = getObjectStorageImageKey(input.image);
  if (previousKey && previousKey !== nextKey) {
    try {
      await deleteProductImage(previousKey);
    } catch (error) {
      console.error("[inventory-image-cleanup]", error);
      return "Perubahan tersimpan, tetapi foto lama gagal dihapus dari object storage.";
    }
  }
}

export async function addStock(
  input: AddStockInput,
  createdBy: string,
): Promise<void> {
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    throw new Error("Jumlah stok harus bilangan bulat lebih dari 0.");
  }

  const client = await getDbPool().connect();
  try {
    await client.query("BEGIN");

    const unitResult = await client.query<{ isi_dalam_satuan: number }>(
      `SELECT u.isi_dalam_satuan
       FROM products p
       JOIN product_units u ON u.product_id = p.id
       WHERE p.id = $1 AND u.satuan = $2
       FOR UPDATE OF p, u`,
      [input.productId, input.satuan],
    );
    const unit = unitResult.rows[0];
    if (!unit) {
      throw new Error("Produk atau satuan tidak ditemukan.");
    }

    const quantityPcs = input.quantity * unit.isi_dalam_satuan;
    if (
      !Number.isSafeInteger(quantityPcs) ||
      quantityPcs < 1 ||
      quantityPcs > 2_147_483_647
    ) {
      throw new Error("Jumlah stok tidak valid.");
    }

    await client.query(
      `UPDATE products
       SET stock_pcs = stock_pcs + $2, updated_at = now()
       WHERE id = $1`,
      [input.productId, quantityPcs],
    );
    await client.query(
      `INSERT INTO stock_movements (
         product_id, movement_type, quantity_pcs, created_by
       )
       VALUES ($1, 'IN', $2, $3)`,
      [input.productId, quantityPcs, createdBy],
    );
    await client.query("COMMIT");
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("[stock-rollback]", rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}
