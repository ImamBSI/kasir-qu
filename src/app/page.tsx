"use client";

import { useState, useMemo } from "react";
import { Trophy, PieChart, ListFilter, TrendingUp, TableIcon } from "lucide-react";
import ReactECharts from "echarts-for-react";
import purchasedData from "@/data/purchased.json";
import type { Order } from "@/types";
import DateRange from "@/components/DateRange";
import { formatCurrency } from "@/utils/format";

const topBuyers = [
  {
    name: "Sarah Jenkins",
    tier: "Premium Member",
    amount: "$12,450.00",
    items: 142,
    rank: 1,
  },
  {
    name: "Michael Chen",
    tier: "Gold Member",
    amount: "$9,820.50",
    items: 89,
    rank: 2,
  },
  {
    name: "Emma Watson",
    tier: "Silver Member",
    amount: "$7,105.25",
    items: 105,
    rank: 3,
  },
];

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#6b7280"];

const rankColors = ["bg-yellow-400", "bg-gray-300", "bg-orange-400"];

export default function DashboardPage() {
  const orders = purchasedData as Order[];
  const [startDate, setStartDate] = useState("2026-08-07");
  const [endDate, setEndDate] = useState("2026-08-07");

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
        percentage: totalSales > 0 ? ((value / totalSales) * 100).toFixed(1) : "0",
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredOrders]);

  const totalRevenue = salesProductData.reduce((sum, item) => sum + item.value, 0);

  const handleDateChange = (newStart: string, newEnd: string) => {
    setStartDate(newStart);
    setEndDate(newEnd);
  };

  const pieChartOption = {
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)",
    },
    legend: {
      show: false,
    },
    series: [
      {
        name: "Sales",
        type: "pie",
        radius: "70%",
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 0,
          borderColor: "#fff",
          borderWidth: 2,
        },
        label: {
          show: false,
          position: "center",
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: "bold",
          },
        },
        labelLine: {
          show: false,
        },
        data: salesProductData.map((item) => ({
          value: item.value,
          name: item.name,
          itemStyle: { color: item.color },
        })),
      },
    ],
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex items-start justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor your store's performance and top customers.
          </p>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Trophy className="size-5 text-blue-600" />
              Top 3 Customers
            </h2>
            <div className="space-y-3">
              {topBuyers.map((buyer) => (
                <div
                  key={buyer.rank}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="relative">
                    <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                    <span
                      className={`absolute -bottom-1 -right-1 w-5 h-5 ${rankColors[buyer.rank - 1]} rounded-full text-xs font-bold text-white flex items-center justify-center`}
                    >
                      {buyer.rank}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{buyer.name}</p>
                    <p className="text-xs text-gray-500">{buyer.tier}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{buyer.amount}</p>
                    <p className="text-xs text-gray-500">{buyer.items} Items</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sales Distribution Chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <PieChart className="size-5 text-blue-600" />
              Sales Distribution
            </h2>
            <div className="flex flex-col items-center">
              <div className="w-full h-[200px]">
                <ReactECharts option={pieChartOption} style={{ height: "100%", width: "100%" }} />
              </div>
              <div className="text-center -mt-4 mb-4">
                <p className="text-xs text-gray-500">Total Sales</p>
                <p className="text-xl font-bold text-gray-900">
                  Rp {formatCurrency(totalRevenue)}
                </p>
              </div>
              <div className="flex flex-wrap gap-4 justify-center">
                {salesProductData.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    ></span>
                    <span className="text-xs text-gray-600">
                      {cat.name} ({cat.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
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
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Qty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Satuan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-2 py-4 text-sm font-medium text-gray-900">
                        {order.customer_name || "Walk-in Customer"}
                      </td>
                      <td className="px-2 py-4 text-sm text-gray-600">
                        {order.items.map((item) => (
                          <div key={item.item_id} className="text-xs">
                            {item.item_name}
                          </div>
                        ))}
                      </td>
                      <td className="px-2 py-4 text-sm text-gray-600">
                        {order.items.map((item) => (
                          <div key={item.item_id} className="text-xs">
                            {item.quantity}
                          </div>
                        ))}
                      </td>
                      <td className="px-2 py-4 text-sm text-gray-600">
                        {order.items.map((item) => (
                          <div key={item.item_id} className="text-xs">
                            {item.unit}
                          </div>
                        ))}
                      </td>
                      <td className="px-2 py-4 text-sm font-semibold text-gray-900">
                        Rp {formatCurrency(order.total_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-linear-to-br from-blue-700 to-blue-900 rounded-lg p-6 max-h-2/3 text-white">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-1">
              <TrendingUp className="size-5" />
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
                      : 0
                  )}
                </p>
              </div>
            </div>

            <button className="w-full py-2.5 bg-white text-blue-700 rounded-md text-sm font-medium hover:bg-gray-100">
              View Detailed Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
