import "server-only";

import { getDbPool } from "@/lib/db";
import type { MonthlyReport, ProductMonthlyReport } from "@/types";

export interface StockSummary {
  id: number;
  name: string;
  sku: string;
  stock: number;
  minStock: number;
  unit: string;
}

export async function getDashboardLowStock(): Promise<StockSummary[]> {
  const result = await getDbPool().query<{
    id: string;
    name: string;
    sku: string;
    stock_pcs: number;
  }>(
    `SELECT id::text, name, sku, stock_pcs
     FROM products
     WHERE stock_pcs < 20
     ORDER BY stock_pcs ASC, name
     LIMIT 3`,
  );

  return result.rows.map((row) => ({
    id: Number(row.id),
    name: row.name,
    sku: row.sku,
    stock: row.stock_pcs,
    minStock: 20,
    unit: "Pcs",
  }));
}

async function getLowestStock(): Promise<StockSummary[]> {
  const result = await getDbPool().query<{
    id: string;
    name: string;
    sku: string;
    stock_pcs: number;
  }>(
    `SELECT id::text, name, sku, stock_pcs
     FROM products
     ORDER BY stock_pcs ASC, name
     LIMIT 3`,
  );

  return result.rows.map((row) => ({
    id: Number(row.id),
    name: row.name,
    sku: row.sku,
    stock: row.stock_pcs,
    minStock: 20,
    unit: "Pcs",
  }));
}

export async function getMonthlyReportData() {
  const pool = getDbPool();
  const monthlyResult = await pool.query<{
    month: string;
    revenue: string;
    transactions: string;
    items_sold: string;
    stock_in_pcs: string;
    stock_out_pcs: string;
    gross_profit: string;
  }>(
    `    WITH bounds AS (
       SELECT LEAST(
        date_trunc(
          'month',
          (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') - INTERVAL '11 months'
        ),
         COALESCE(
          (SELECT MIN(date_trunc('month', sold_at AT TIME ZONE 'Asia/Jakarta'))
           FROM sales),
          date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')
         ),
         COALESCE(
          (SELECT MIN(date_trunc('month', created_at AT TIME ZONE 'Asia/Jakarta'))
           FROM stock_movements),
          date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')
         )
       ) AS first_month
     ),
     months AS (
       SELECT generate_series(
         first_month,
         date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta'),
         INTERVAL '1 month'
       ) AS month
       FROM bounds
     ),
     sales_by_month AS (
       SELECT date_trunc('month', sold_at AT TIME ZONE 'Asia/Jakarta') AS month,
              SUM(total_amount) AS revenue,
              COUNT(*) AS transactions
       FROM sales
       GROUP BY 1
     ),
     items_by_month AS (
       SELECT date_trunc(
                'month', s.sold_at AT TIME ZONE 'Asia/Jakarta'
              ) AS month,
              SUM(i.quantity_pcs) AS items_sold,
              SUM(i.gross_profit) AS gross_profit
       FROM sales s
       JOIN sale_items i ON i.sale_id = s.id
       GROUP BY 1
     ),
     stock_by_month AS (
       SELECT date_trunc(
                'month', created_at AT TIME ZONE 'Asia/Jakarta'
              ) AS month,
              SUM(quantity_pcs) FILTER (WHERE movement_type = 'IN') AS stock_in_pcs,
              SUM(quantity_pcs) FILTER (WHERE movement_type = 'OUT') AS stock_out_pcs
       FROM stock_movements
       GROUP BY 1
     )
     SELECT to_char(m.month, 'YYYY-MM') AS month,
            COALESCE(s.revenue, 0)::text AS revenue,
            COALESCE(s.transactions, 0)::text AS transactions,
            COALESCE(i.items_sold, 0)::text AS items_sold,
            COALESCE(st.stock_in_pcs, 0)::text AS stock_in_pcs,
            COALESCE(st.stock_out_pcs, 0)::text AS stock_out_pcs,
            COALESCE(i.gross_profit, 0)::text AS gross_profit
     FROM months m
     LEFT JOIN sales_by_month s ON s.month = m.month
     LEFT JOIN items_by_month i ON i.month = m.month
     LEFT JOIN stock_by_month st ON st.month = m.month
     ORDER BY m.month`,
  );

  const productResult = await pool.query<{
    month: string;
    sku: string;
    name: string;
    qty_pcs: string;
    revenue: string;
    sell_price: string;
    cost_price: string;
  }>(
    `SELECT to_char(
              date_trunc('month', s.sold_at AT TIME ZONE 'Asia/Jakarta'),
              'YYYY-MM'
            ) AS month,
            i.product_sku AS sku,
            i.product_name AS name,
            SUM(i.quantity_pcs)::text AS qty_pcs,
            SUM(i.subtotal)::text AS revenue,
            (SUM(i.subtotal) / NULLIF(SUM(i.quantity_pcs), 0))::text AS sell_price,
            (SUM(i.subtotal - i.gross_profit) /
             NULLIF(SUM(i.quantity_pcs), 0))::text AS cost_price
     FROM sales s
     JOIN sale_items i ON i.sale_id = s.id
     GROUP BY 1, 2, 3
     ORDER BY 1, 2`,
  );

  const lowestStock = await getLowestStock();

  const monthly: MonthlyReport[] = monthlyResult.rows.map((row) => ({
    month: row.month,
    revenue: Number(row.revenue),
    transactions: Number(row.transactions),
    items_sold: Number(row.items_sold),
    stock_in_pcs: Number(row.stock_in_pcs),
    stock_out_pcs: Number(row.stock_out_pcs),
    gross_profit: Number(row.gross_profit),
  }));

  const productMonthly: ProductMonthlyReport[] = productResult.rows.map(
    (row) => ({
      month: row.month,
      sku: row.sku,
      name: row.name,
      qty_pcs: Number(row.qty_pcs),
      revenue: Number(row.revenue),
      sell_price: Number(row.sell_price),
      cost_price: Number(row.cost_price),
    }),
  );

  return { monthly, productMonthly, lowestStock };
}
