"use client";

import { Trophy, PieChart, ListFilter, TrendingUp, TableIcon } from "lucide-react";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

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

const categoryData = [
  { name: "Electronics", value: 40, color: "#2563eb" },
  { name: "Clothing", value: 30, color: "#6b7280" },
  { name: "Home", value: 20, color: "#93c5fd" },
  { name: "Others", value: 10, color: "#dbeafe" },
];

const customersList = [
  { rank: 4, name: "David Miller", purchases: "$6,430.00", status: "Active" },
  { rank: 5, name: "Jessica Lee", purchases: "$5,900.25", status: "Active" },
  {
    rank: 6,
    name: "Robert Taylor",
    purchases: "$4,210.00",
    status: "Inactive",
  },
  { rank: 7, name: "Amanda White", purchases: "$3,850.50", status: "Active" },
  { rank: 8, name: "James Wilson", purchases: "$2,900.00", status: "At Risk" },
];

const statusColors: Record<string, string> = {
  Active: "bg-green-100 text-green-700",
  Inactive: "bg-gray-100 text-gray-600",
  "At Risk": "bg-red-100 text-red-700",
};

const rankColors = ["bg-yellow-400", "bg-gray-300", "bg-orange-400"];

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
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
        {/* Top Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top 3 Buyers */}
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

          {/* Category Distribution */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <PieChart className="size-5 text-blue-600" />
              Category Distribution
            </h2>
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={200}>
                <RechartsPieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
              <div className="text-center -mt-8 mb-4">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-xl font-bold text-gray-900">12.5k</p>
              </div>
              <div className="flex flex-wrap gap-4 justify-center">
                {categoryData.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    ></span>
                    <span className="text-xs text-gray-600">
                      {cat.name} ({cat.value}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TableIcon className="size-5 text-blue-600" />
                All Customers List
              </h2>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <ListFilter className="size-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Nama Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total Pembelian
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {customersList.map((customer) => (
                    <tr key={customer.rank} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-500">
                        #{customer.rank}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {customer.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {customer.purchases}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sales Summary */}
          <div className="bg-linear-to-br from-blue-700 to-blue-900 rounded-lg p-6 text-white">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-1">
              <TrendingUp className="size-5" />
              Sales Summary
            </h2>
            <p className="text-sm text-blue-200 mb-6">Monthly Performance</p>

            <div className="mb-6">
              <p className="text-xs text-blue-200 uppercase">Total Revenue</p>
              <div className="flex items-end gap-3">
                <span className="text-3xl font-bold">$84,520</span>
                <span className="text-sm bg-blue-600/50 px-2 py-1 rounded mb-1">
                  ↑12.5%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs text-blue-200">Orders</p>
                <p className="text-2xl font-bold">1,248</p>
              </div>
              <div>
                <p className="text-xs text-blue-200">Avg. Value</p>
                <p className="text-2xl font-bold">$67.72</p>
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
