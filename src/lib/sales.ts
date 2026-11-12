import "server-only";

import { getDbPool } from "@/lib/db";
import type { Order, OrderItem } from "@/types";

export interface SaleItemInput {
  productId: number;
  unit: string;
  quantity: number;
}

export interface CreateSaleInput {
  customerName: string | null;
  items: SaleItemInput[];
}

function parseCreateSaleInput(value: unknown): CreateSaleInput {
  if (typeof value !== "object" || value === null) {
    throw new Error("Data transaksi tidak valid.");
  }

  const rawCustomerName =
    "customerName" in value ? value.customerName : undefined;
  const rawItems = "items" in value ? value.items : undefined;
  if (
    (rawCustomerName !== undefined &&
      rawCustomerName !== null &&
      typeof rawCustomerName !== "string") ||
    !Array.isArray(rawItems) ||
    rawItems.length === 0 ||
    rawItems.length > 100
  ) {
    throw new Error("Data transaksi tidak valid.");
  }

  const customerName =
    typeof rawCustomerName === "string" ? rawCustomerName.trim() || null : null;
  if (customerName && customerName.length > 100) {
    throw new Error("Nama pelanggan maksimal 100 karakter.");
  }

  const keys = new Set<string>();
  const items = rawItems.map((item): SaleItemInput => {
    if (typeof item !== "object" || item === null) {
      throw new Error("Item transaksi tidak valid.");
    }

    const productId = "productId" in item ? item.productId : undefined;
    const unit = "unit" in item ? item.unit : undefined;
    const quantity = "quantity" in item ? item.quantity : undefined;
    if (
      typeof productId !== "number" ||
      !Number.isSafeInteger(productId) ||
      productId < 1 ||
      typeof unit !== "string" ||
      !unit.trim() ||
      unit.length > 20 ||
      typeof quantity !== "number" ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > 100_000
    ) {
      throw new Error("Item transaksi tidak valid.");
    }

    const normalizedUnit = unit.trim();
    const key = `${productId}:${normalizedUnit}`;
    if (keys.has(key)) {
      throw new Error("Item produk dan satuan tidak boleh duplikat.");
    }
    keys.add(key);

    return { productId, unit: normalizedUnit, quantity };
  });

  return { customerName, items };
}

export async function createSale(
  input: unknown,
  createdBy: string,
): Promise<{ id: number; total: number }> {
  const sale = parseCreateSaleInput(input);
  const client = await getDbPool().connect();

  try {
    await client.query("BEGIN");

    const saleResult = await client.query<{ id: string }>(
      `INSERT INTO sales (customer_name, created_by)
       VALUES ($1, $2)
       RETURNING id::text`,
      [sale.customerName, createdBy],
    );
    const saleId = saleResult.rows[0].id;

    for (const item of sale.items) {
      const productResult = await client.query<{
        id: string;
        sku: string;
        name: string;
        stock_pcs: number;
        isi_dalam_satuan: number;
        harga: string;
        modal: string;
      }>(
        `SELECT p.id::text, p.sku, p.name, p.stock_pcs,
                u.isi_dalam_satuan, u.harga::text, u.modal::text
         FROM products p
         JOIN product_units u ON u.product_id = p.id
         WHERE p.id = $1 AND u.satuan = $2
         FOR UPDATE OF p, u`,
        [item.productId, item.unit],
      );
      const product = productResult.rows[0];
      if (!product) {
        throw new Error("Produk atau satuan tidak ditemukan.");
      }

      const quantityPcs = item.quantity * product.isi_dalam_satuan;
      if (
        !Number.isSafeInteger(quantityPcs) ||
        quantityPcs < 1 ||
        quantityPcs > 2_147_483_647
      ) {
        throw new Error(`Jumlah ${product.name} tidak valid.`);
      }
      if (product.stock_pcs < quantityPcs) {
        throw new Error(
          `Stok ${product.name} tersisa ${product.stock_pcs} pcs.`,
        );
      }

      const stockUpdate = await client.query(
        `UPDATE products
         SET stock_pcs = stock_pcs - $2, updated_at = now()
         WHERE id = $1 AND stock_pcs >= $2`,
        [item.productId, quantityPcs],
      );
      if (stockUpdate.rowCount !== 1) {
        throw new Error(`Stok ${product.name} tidak mencukupi.`);
      }

      await client.query(
        `INSERT INTO sale_items (
           sale_id, product_id, product_sku, product_name, unit_name,
           quantity, quantity_pcs, unit_price, unit_cost, subtotal, gross_profit
         )
         VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8::numeric, $9::numeric,
           $8::numeric * $6,
           ($8::numeric - $9::numeric) * $6
         )`,
        [
          saleId,
          product.id,
          product.sku,
          product.name,
          item.unit,
          item.quantity,
          quantityPcs,
          product.harga,
          product.modal,
        ],
      );

      await client.query(
        `INSERT INTO stock_movements (
           product_id, movement_type, quantity_pcs, sale_id, created_by
         )
         VALUES ($1, 'OUT', $2, $3, $4)`,
        [item.productId, quantityPcs, saleId, createdBy],
      );
    }

    const totalResult = await client.query<{ total: string }>(
      `SELECT COALESCE(SUM(subtotal), 0)::text AS total
       FROM sale_items WHERE sale_id = $1`,
      [saleId],
    );
    const total = totalResult.rows[0].total;
    await client.query(
      `UPDATE sales SET total_amount = $2::numeric WHERE id = $1`,
      [saleId, total],
    );

    await client.query("COMMIT");
    return { id: Number(saleId), total: Number(total) };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("[sale-rollback]", rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function getOrdersByDateRange(
  startDate: string,
  endDate: string,
): Promise<Order[]> {
  const result = await getDbPool().query<{
    id: string;
    order_date: Date;
    customer_name: string | null;
    total_price: string;
    items: OrderItem[];
  }>(
    `SELECT s.id::text, s.sold_at AS order_date, s.customer_name,
            s.total_amount::text AS total_price,
            COALESCE(
              json_agg(
                json_build_object(
                  'item_id', i.product_id::text,
                  'item_name', i.product_name,
                  'quantity', i.quantity,
                  'pcs_quantity', i.quantity_pcs,
                  'unit', i.unit_name,
                  'unit_price', i.unit_price::float8,
                  'subtotal', i.subtotal::float8
                ) ORDER BY i.id
              ) FILTER (WHERE i.id IS NOT NULL),
              '[]'::json
            ) AS items
     FROM sales s
     LEFT JOIN sale_items i ON i.sale_id = s.id
     WHERE s.sold_at >= ($1::date::timestamp AT TIME ZONE 'Asia/Jakarta')
       AND s.sold_at < (($2::date + INTERVAL '1 day')::timestamp
                        AT TIME ZONE 'Asia/Jakarta')
     GROUP BY s.id
     ORDER BY s.sold_at DESC, s.id DESC`,
    [startDate, endDate],
  );

  return result.rows.map((row) => ({
    id: Number(row.id),
    order_date: row.order_date.toISOString(),
    customer_name: row.customer_name,
    total_price: Number(row.total_price),
    items: row.items,
  }));
}
