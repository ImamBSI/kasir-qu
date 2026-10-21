"use client";

import { useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  Crown,
  Info,
  Minus,
  PackageMinus,
  PackagePlus,
  ReceiptText,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import reportData from "@/data/report-monthly.json";
import productMonthlyData from "@/data/product-monthly.json";
import productsData from "@/data/products.json";
import type { MonthlyReport, Product, ProductMonthlyReport } from "@/types";
import { formatRupiah } from "@/utils/format";
import { getBaseStock, getMinStock } from "@/utils/stock";

const monthly = reportData as MonthlyReport[];
const productMonthly = productMonthlyData as ProductMonthlyReport[];
const products = productsData as Product[];

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function monthLabel(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  return `${MONTH_NAMES[monthIndex - 1]} ${year}`;
}

function monthShort(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  return `${MONTH_NAMES[monthIndex - 1].slice(0, 3)} ${String(year).slice(2)}`;
}

function formatNumber(value: number) {
  return value.toLocaleString("id-ID");
}

function formatPercent(value: number) {
  const rounded = value.toLocaleString("id-ID", { maximumFractionDigits: 1 });
  return `${value > 0 ? "+" : ""}${rounded}%`;
}

function calculateDelta(current: number, previous?: number) {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

function MetricCard({
  label,
  value,
  delta,
  compareLabel,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta: number | null;
  compareLabel: string;
  icon: LucideIcon;
}) {
  const isFlat = delta !== null && Math.abs(delta) < 0.05;
  const isUp = delta !== null && delta > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <Icon className="size-4 shrink-0 text-gray-400" />
      </div>
      <p className="mt-2 text-lg md:text-xl font-bold text-gray-900">{value}</p>
      <div className="mt-1 flex flex-wrap items-center gap-1 text-xs">
        {delta === null ? (
          <span className="text-gray-400">Belum ada pembanding</span>
        ) : (
          <>
            <span
              className={`inline-flex items-center gap-0.5 font-medium ${
                isFlat
                  ? "text-gray-500"
                  : isUp
                    ? "text-emerald-600"
                    : "text-red-600"
              }`}
            >
              {isFlat ? (
                <Minus className="size-3" />
              ) : isUp ? (
                <ArrowUpRight className="size-3" />
              ) : (
                <ArrowDownRight className="size-3" />
              )}
              {formatPercent(delta)}
            </span>
            <span className="text-gray-400">vs {compareLabel}</span>
          </>
        )}
      </div>
    </div>
  );
}

export default function LaporanPage() {
  const [selectedMonth, setSelectedMonth] = useState(
    monthly[monthly.length - 1].month,
  );
  const [compareMode, setCompareMode] = useState<"month" | "year">("month");
  const [trendMonths, setTrendMonths] = useState<6 | 12>(12);

  const stats = useMemo(() => {
    const index = monthly.findIndex((item) => item.month === selectedMonth);
    const safeIndex = index === -1 ? monthly.length - 1 : index;
    const current = monthly[safeIndex];
    const previousMonth = monthly[safeIndex - 1];
    const lastYear = monthly[safeIndex - 12];
    const comparison = compareMode === "month" ? previousMonth : lastYear;
    const compareLabel = compareMode === "month" ? "bulan lalu" : "tahun lalu";
    const compareMonth = comparison?.month;

    const currentProducts = productMonthly
      .filter((item) => item.month === current.month)
      .sort((a, b) => b.revenue - a.revenue);

    const priceRows = currentProducts.map((item) => {
      const before = compareMonth
        ? productMonthly.find(
            (entry) => entry.month === compareMonth && entry.sku === item.sku,
          )
        : undefined;

      return {
        ...item,
        previousPrice: before?.sell_price ?? null,
        change: before
          ? ((item.sell_price - before.sell_price) / before.sell_price) * 100
          : null,
      };
    });

    const topProducts = currentProducts.slice(0, 4);
    const maxRevenue = topProducts[0]?.revenue ?? 0;

    const lowestStock = products
      .map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        stock: getBaseStock(product),
        minStock: getMinStock(product),
        unit: product.units[0].satuan,
      }))
      .sort((a, b) => a.stock / a.minStock - b.stock / b.minStock)
      .slice(0, 3);

    const revenueDelta = calculateDelta(current.revenue, comparison?.revenue);
    const transactionDelta = calculateDelta(
      current.transactions,
      comparison?.transactions,
    );
    const itemsDelta = calculateDelta(current.items_sold, comparison?.items_sold);
    const profitDelta = calculateDelta(
      current.gross_profit,
      comparison?.gross_profit,
    );

    const avgBasket = current.revenue / current.transactions;
    const margin = (current.gross_profit / current.revenue) * 100;

    const revenueByMonth = new Map(
      monthly.map((item) => [item.month, item.revenue]),
    );

    const trendSlice = monthly.slice(
      Math.max(0, safeIndex - (trendMonths - 1)),
      safeIndex + 1,
    );

    const trendOption: EChartsOption = {
      tooltip: {
        trigger: "axis",
        valueFormatter: (value) => formatRupiah(Number(value)),
      },
      legend: {
        top: 0,
        right: 0,
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { fontSize: 11, color: "#4b5563" },
      },
      grid: { left: 4, right: 8, top: 34, bottom: 4, containLabel: true },
      xAxis: {
        type: "category",
        data: trendSlice.map((item) => monthShort(item.month)),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#e5e7eb" } },
        axisLabel: { fontSize: 10, color: "#6b7280" },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          fontSize: 10,
          color: "#6b7280",
          formatter: (value) => `${Math.round(Number(value) / 1_000_000)} jt`,
        },
        splitLine: { lineStyle: { color: "#f3f4f6" } },
      },
      series: [
        {
          name: "Omzet",
          type: "bar",
          data: trendSlice.map((item) => item.revenue),
          barMaxWidth: 24,
          itemStyle: { color: "#1d4ed8", borderRadius: [4, 4, 0, 0] },
        },
        {
          name: "Tahun lalu",
          type: "line",
          smooth: true,
          showSymbol: false,
          data: trendSlice.map((item) => {
            const [year, monthIndex] = item.month.split("-").map(Number);
            return (
              revenueByMonth.get(
                `${year - 1}-${String(monthIndex).padStart(2, "0")}`,
              ) ?? null
            );
          }),
          lineStyle: { color: "#94a3b8", width: 2, type: "dashed" },
          itemStyle: { color: "#94a3b8" },
        },
      ],
    };

    const stockSlice = monthly.slice(Math.max(0, safeIndex - 5), safeIndex + 1);

    const stockOption: EChartsOption = {
      tooltip: {
        trigger: "axis",
        valueFormatter: (value) => `${formatNumber(Number(value))} pcs`,
      },
      legend: {
        top: 0,
        right: 0,
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { fontSize: 11, color: "#4b5563" },
      },
      grid: { left: 4, right: 8, top: 34, bottom: 4, containLabel: true },
      xAxis: {
        type: "category",
        data: stockSlice.map((item) => monthShort(item.month)),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#e5e7eb" } },
        axisLabel: { fontSize: 10, color: "#6b7280" },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          fontSize: 10,
          color: "#6b7280",
          formatter: (value) => `${Math.round(Number(value) / 1000)} rb`,
        },
        splitLine: { lineStyle: { color: "#f3f4f6" } },
      },
      series: [
        {
          name: "Masuk",
          type: "bar",
          data: stockSlice.map((item) => item.stock_in_pcs),
          barMaxWidth: 18,
          itemStyle: { color: "#10b981", borderRadius: [4, 4, 0, 0] },
        },
        {
          name: "Keluar",
          type: "bar",
          data: stockSlice.map((item) => item.stock_out_pcs),
          barMaxWidth: 18,
          itemStyle: { color: "#f59e0b", borderRadius: [4, 4, 0, 0] },
        },
      ],
    };

    const insights: string[] = [];

    if (revenueDelta !== null) {
      insights.push(
        `Omzet ${monthLabel(current.month)} ${revenueDelta >= 0 ? "naik" : "turun"} ${formatPercent(Math.abs(revenueDelta))} dibanding ${compareLabel}.`,
      );
    }

    const bestProduct = currentProducts[0];
    if (bestProduct) {
      const share = (bestProduct.revenue / current.revenue) * 100;
      insights.push(
        `${bestProduct.name} jadi penyumbang omzet terbesar (${share.toLocaleString("id-ID", { maximumFractionDigits: 1 })}% dari total bulan ini).`,
      );
    }

    const biggestIncrease = [...priceRows]
      .filter((row) => row.change !== null)
      .sort((a, b) => (b.change ?? 0) - (a.change ?? 0))[0];

    if (biggestIncrease && (biggestIncrease.change ?? 0) > 0.1) {
      insights.push(
        `Harga ${biggestIncrease.name} naik ${formatPercent(biggestIncrease.change ?? 0)} jadi ${formatRupiah(biggestIncrease.sell_price)}.`,
      );
    }

    const netStock = current.stock_in_pcs - current.stock_out_pcs;
    insights.push(
      `Barang keluar ${formatNumber(current.stock_out_pcs)} pcs, masuk ${formatNumber(current.stock_in_pcs)} pcs — stok ${netStock >= 0 ? "bertambah" : "berkurang"} ${formatNumber(Math.abs(netStock))} pcs.`,
    );

    return {
      current,
      comparison,
      compareLabel,
      revenueDelta,
      transactionDelta,
      itemsDelta,
      profitDelta,
      avgBasket,
      margin,
      currentProducts,
      priceRows,
      topProducts,
      maxRevenue,
      lowestStock,
      insights,
      trendOption,
      stockOption,
    };
  }, [selectedMonth, compareMode, trendMonths]);

  const {
    current,
    comparison,
    compareLabel,
    revenueDelta,
    transactionDelta,
    itemsDelta,
    profitDelta,
    avgBasket,
    margin,
    priceRows,
    topProducts,
    maxRevenue,
    lowestStock,
    insights,
    trendOption,
    stockOption,
  } = stats;

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Laporan Toko
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Omzet bulanan, barang masuk/keluar, dan perubahan harga.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="sr-only" htmlFor="report-month">
            Pilih bulan
          </label>
          <select
            id="report-month"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="w-full sm:w-auto rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[...monthly].reverse().map((item) => (
              <option key={item.month} value={item.month}>
                {monthLabel(item.month)}
              </option>
            ))}
          </select>

          <div className="flex rounded-lg border border-gray-300 bg-white p-0.5">
            <button
              onClick={() => setCompareMode("month")}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                compareMode === "month"
                  ? "bg-blue-700 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              vs Bulan lalu
            </button>
            <button
              onClick={() => setCompareMode("year")}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                compareMode === "year"
                  ? "bg-blue-700 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              vs Tahun lalu
            </button>
          </div>
        </div>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
        <MetricCard
          label="Omzet"
          value={formatRupiah(current.revenue)}
          delta={revenueDelta}
          compareLabel={compareLabel}
          icon={Wallet}
        />
        <MetricCard
          label="Transaksi"
          value={`${formatNumber(current.transactions)}x`}
          delta={transactionDelta}
          compareLabel={compareLabel}
          icon={ReceiptText}
        />
        <MetricCard
          label="Barang terjual"
          value={`${formatNumber(current.items_sold)} pcs`}
          delta={itemsDelta}
          compareLabel={compareLabel}
          icon={Boxes}
        />
        <MetricCard
          label="Laba kotor"
          value={formatRupiah(current.gross_profit)}
          delta={profitDelta}
          compareLabel={compareLabel}
          icon={TrendingUp}
        />
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 px-1 text-xs text-gray-500">
        <span>
          Rata-rata per transaksi:{" "}
          <span className="font-medium text-gray-700">
            {formatRupiah(Math.round(avgBasket))}
          </span>
        </span>
        <span>
          Margin kotor:{" "}
          <span className="font-medium text-gray-700">
            {margin.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%
          </span>
        </span>
        {comparison && (
          <span>
            Pembanding: <span className="font-medium text-gray-700">{monthLabel(comparison.month)}</span>
          </span>
        )}
      </div>

      {/* Ringkasan otomatis */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-blue-900">
          <Info className="size-4" />
          Yang perlu diketahui bulan ini
        </h2>
        <ul className="mt-2 space-y-1.5 pl-5 list-disc text-sm text-blue-900/80">
          {insights.map((insight) => (
            <li key={insight}>{insight}</li>
          ))}
        </ul>
      </div>

      {/* Grafik omzet */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
          <div>
            <h2 className="text-sm md:text-base font-semibold text-gray-900">
              Tren Omzet
            </h2>
            <p className="text-xs text-gray-500">
              Dibandingkan dengan periode yang sama tahun lalu.
            </p>
          </div>
          <div className="flex rounded-lg border border-gray-300 bg-white p-0.5">
            {([6, 12] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTrendMonths(range)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  trendMonths === range
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {range} bulan
              </button>
            ))}
          </div>
        </div>
        <ReactECharts
          option={trendOption}
          notMerge
          style={{ height: 250, width: "100%" }}
        />
      </div>

      {/* Grafik stok */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-5">
        <div className="mb-1">
          <h2 className="text-sm md:text-base font-semibold text-gray-900">
            Barang Masuk vs Keluar
          </h2>
          <p className="text-xs text-gray-500">
            6 bulan terakhir, dalam satuan pcs. Selisihnya menunjukkan stok
            bertambah atau berkurang.
          </p>
        </div>
        <ReactECharts
          option={stockOption}
          notMerge
          style={{ height: 240, width: "100%" }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Perubahan harga */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-3 md:p-5 border-b border-gray-200">
            <h2 className="text-sm md:text-base font-semibold text-gray-900">
              Perubahan Harga Barang
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Harga jual {monthLabel(current.month)} dibanding {compareLabel}.
            </p>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                    Produk
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">
                    Sebelum
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">
                    Sekarang
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">
                    Perubahan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {priceRows.map((row) => (
                  <tr key={row.sku} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">
                        {row.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {row.qty_pcs.toLocaleString("id-ID")} pcs terjual
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600">
                      {row.previousPrice
                        ? formatRupiah(row.previousPrice)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {formatRupiah(row.sell_price)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center gap-0.5 text-sm font-medium ${
                          row.change === null
                            ? "text-gray-400"
                            : Math.abs(row.change) < 0.05
                              ? "text-gray-500"
                              : row.change > 0
                                ? "text-red-600"
                                : "text-emerald-600"
                        }`}
                      >
                        {row.change === null ? (
                          "—"
                        ) : Math.abs(row.change) < 0.05 ? (
                          "Tetap"
                        ) : (
                          <>
                            {row.change > 0 ? (
                              <ArrowUpRight className="size-3.5" />
                            ) : (
                              <ArrowDownRight className="size-3.5" />
                            )}
                            {formatPercent(row.change)}
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <div className="md:hidden divide-y divide-gray-200">
            {priceRows.map((row) => (
              <div key={row.sku} className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {row.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {row.qty_pcs.toLocaleString("id-ID")} pcs terjual
                    </p>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center gap-0.5 text-sm font-medium ${
                      row.change === null
                        ? "text-gray-400"
                        : Math.abs(row.change) < 0.05
                          ? "text-gray-500"
                          : row.change > 0
                            ? "text-red-600"
                            : "text-emerald-600"
                    }`}
                  >
                    {row.change === null
                      ? "—"
                      : Math.abs(row.change) < 0.05
                        ? "Tetap"
                        : formatPercent(row.change)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm">
                  <span className="text-gray-500">
                    {row.previousPrice ? formatRupiah(row.previousPrice) : "—"}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium text-gray-900">
                    {formatRupiah(row.sell_price)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {/* Produk terlaris */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-5">
            <h2 className="flex items-center gap-2 text-sm md:text-base font-semibold text-gray-900">
              <Crown className="size-4 text-amber-500" />
              Produk Terlaris
            </h2>
            <div className="mt-3 space-y-3">
              {topProducts.map((product) => (
                <div key={product.sku}>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product.name}
                    </p>
                    <p className="shrink-0 text-sm font-semibold text-gray-900">
                      {formatRupiah(product.revenue)}
                    </p>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-gray-100">
                      <div
                        className="h-1.5 rounded-full bg-blue-600"
                        style={{
                          width: `${maxRevenue > 0 ? (product.revenue / maxRevenue) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="shrink-0 text-xs text-gray-500">
                      {product.qty_pcs.toLocaleString("id-ID")} pcs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stok terendah */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-5">
            <h2 className="flex items-center gap-2 text-sm md:text-base font-semibold text-gray-900">
              <PackageMinus className="size-4 text-red-500" />
              Stok Perlu Diisi
            </h2>
            <div className="mt-3 space-y-2">
              {lowestStock.map((product) => {
                const isLow = product.stock < product.minStock;
                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-gray-200 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {product.sku} · min {product.minStock}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                        product.stock === 0
                          ? "bg-red-600 text-white"
                          : isLow
                            ? "bg-red-50 text-red-600"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {product.stock === 0
                        ? "Habis"
                        : `${product.stock} ${product.unit}`}
                    </span>
                  </div>
                );
              })}
              {lowestStock.length === 0 && (
                <p className="flex items-center gap-2 text-sm text-gray-500">
                  <PackagePlus className="size-4" />
                  Semua stok masih aman.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="px-1 pb-1 text-[11px] text-gray-400">
        Data laporan masih berupa contoh. Angka akan otomatis mengikuti
        transaksi setelah database terpasang.
      </p>
    </div>
  );
}
