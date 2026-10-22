"use client";

import { useState, useMemo } from "react";
import {
  Trophy,
  PieChart,
  TableIcon,
  ChartNoAxesCombinedIcon,
  TriangleAlert,
} from "lucide-react";
import { useRouter } from "next/navigation";
import purchasedData from "@/data/purchased.json";
import productsData from "@/data/products.json";
import type { Order, Product } from "@/types";
import DateRange from "@/components/DateRange";
import { formatCurrency } from "@/utils/format";
import { getBaseStock, getMinStock } from "@/utils/stock";
import CustomPieChart from "@/components/PieChart"; // Import komponen baru

const products = productsData as Product[];

const COLORS = [
  "#2563eb",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#6b7280",
];
const rankColors = ["bg-yellow-400", "bg-gray-300", "bg-orange-400"];

function formatOrderDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: value, time: "" };

  return {
    date: date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  };
}

export default function DashboardPage() {
  const orders = purchasedData as Order[];
  const [startDate, setStartDate] = useState("2026-08-07");
  const [endDate, setEndDate] = useState("2026-08-07");
  const router = useRouter();
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderDate = order.order_date.split("T")[0];
      return orderDate >= startDate && orderDate <= endDate;
    });
  }, [orders, startDate, endDate]);

  const salesProductData = useMemo(() => {
    const productSales: Record<string, number> = {};
    let totalSales = 0;

    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        const name = item.item_name;
        productSales[name] = (productSales[name] || 0) + item.subtotal;
        totalSales += item.subtotal;
      });
    });

    return Object.entries(productSales)
      .map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length],
        percentage:
          totalSales > 0 ? ((value / totalSales) * 100).toFixed(1) : "0",
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredOrders]);

  const totalRevenue = salesProductData.reduce(
    (sum, item) => sum + item.value,
    0,
  );

  const bestSellers = useMemo(() => {
    const grouped = new Map<
      string,
      { name: string; quantity: number; unit: string; revenue: number }
    >();

    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        const current = grouped.get(item.item_id);
        if (current) {
          current.quantity += item.quantity;
          current.revenue += item.subtotal;
        } else {
          grouped.set(item.item_id, {
            name: item.item_name,
            quantity: item.quantity,
            unit: item.unit,
            revenue: item.subtotal,
          });
        }
      });
    });

    return [...grouped.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);
  }, [filteredOrders]);

  const stockWarnings = useMemo(
    () =>
      products
        .map((product) => ({
          id: product.id,
          name: product.name,
          stock: getBaseStock(product),
          minStock: getMinStock(product),
          unit: product.units[0].satuan,
        }))
        .filter((product) => product.stock < product.minStock)
        .sort((a, b) => a.stock / a.minStock - b.stock / b.minStock)
        .slice(0, 3),
    [],
  );

  const orderRows = useMemo(
    () =>
      filteredOrders.flatMap((order) => {
        const { date, time } = formatOrderDateTime(order.order_date);
        return order.items.map((item, index) => ({
          key: `${order.id}-${item.item_id}-${index}`,
          date,
          time,
          itemName: item.item_name,
          quantity: item.quantity,
          unit: item.unit,
          subtotal: item.subtotal,
        }));
      }),
    [filteredOrders],
  );

  const handleDateChange = (newStart: string, newEnd: string) => {
    setStartDate(newStart);
    setEndDate(newEnd);
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-start justify-between mb-4 md:mb-6 shrink-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Overview</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor performa penjualan, produk terlaris, dan stok toko.
          </p>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
          {/* Produk Terlaris & Stok */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-1">
              <Trophy className="size-5 text-blue-600" />
              Produk Terlaris
            </h2>
            <p className="text-xs text-gray-500 mb-3">
              Berdasarkan transaksi pada rentang tanggal.
            </p>

            {bestSellers.length === 0 ? (
              <p className="text-sm text-gray-500">Belum ada penjualan.</p>
            ) : (
              <div className="space-y-2">
                {bestSellers.map((product, index) => (
                  <div
                    key={product.name}
                    className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg"
                  >
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${rankColors[index]}`}
                    >
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {product.quantity} {product.unit} terjual
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-gray-900">
                      Rp {formatCurrency(product.revenue)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-gray-200">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-red-600">
                <TriangleAlert className="size-4" />
                Stok Perlu Diisi
              </h3>
              {stockWarnings.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500">
                  Semua stok masih aman.
                </p>
              ) : (
                <div className="mt-2 space-y-2">
                  {stockWarnings.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-red-100 bg-red-50 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          min {product.minStock} {product.unit}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-red-600">
                        {product.stock === 0
                          ? "Habis"
                          : `${product.stock} ${product.unit}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sales Distribution Chart - Sekarang Jauh Lebih Bersih! */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <PieChart className="size-5 text-blue-600" />
              Sales Distribution
            </h2>

            <CustomPieChart
              data={salesProductData}
              seriesName="Sales"
              totalLabel="Total Sales"
              totalValue={`Rp ${formatCurrency(totalRevenue)}`}
            />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 md:p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TableIcon className="size-5 text-blue-600" />
                Recent Order
              </h2>
              <DateRange
                startDate={startDate}
                endDate={endDate}
                onChange={handleDateChange}
              />
            </div>
            {/* Mobile list */}
            <div className="md:hidden max-h-[240px] overflow-y-auto divide-y divide-gray-200">
              {orderRows.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-gray-500">
                  Tidak ada transaksi pada tanggal ini.
                </p>
              ) : (
                orderRows.map((row) => (
                  <div
                    key={row.key}
                    className="flex items-start justify-between gap-3 p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {row.itemName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {row.date} · {row.time} · {row.quantity} {row.unit}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-gray-900">
                      Rp {formatCurrency(row.subtotal)}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="hidden md:block overflow-x-auto max-h-[240px] overflow-y-auto">
              <table className="w-full min-w-[560px]">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Items
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Satuan
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orderRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-sm text-gray-500"
                      >
                        Tidak ada transaksi pada tanggal ini.
                      </td>
                    </tr>
                  ) : (
                    orderRows.map((row) => (
                      <tr key={row.key} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                          {row.date}
                          <span className="ml-1.5 text-xs text-gray-400">
                            {row.time}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {row.itemName}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600">
                          {row.quantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {row.unit}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-gray-900">
                          Rp {formatCurrency(row.subtotal)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-linear-to-br from-blue-700 to-blue-900 rounded-lg p-4 md:p-6 text-white">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-1">
              <ChartNoAxesCombinedIcon className="size-5" />
              Sales Summary
            </h2>
            <p className="text-sm text-blue-200 mb-6">Monthly Performance</p>

            <div className="mb-6">
              <p className="text-xs text-blue-200 uppercase">Total Revenue</p>
              <div className="flex items-end gap-3">
                <span className="text-3xl font-bold">
                  Rp {formatCurrency(totalRevenue)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs text-blue-200">Orders</p>
                <p className="text-2xl font-bold">{filteredOrders.length}</p>
              </div>
              <div>
                <p className="text-xs text-blue-200">Avg. Value</p>
                <p className="text-2xl font-bold">
                  Rp{" "}
                  {formatCurrency(
                    filteredOrders.length > 0
                      ? Math.round(totalRevenue / filteredOrders.length)
                      : 0,
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={() => router.push("/pages/laporan")}
              className="w-full py-2.5 bg-white text-blue-700 rounded-md text-sm font-medium hover:bg-gray-100 cursor-pointer"
            >
              View Detailed Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
