"use client";

import ReactECharts from "echarts-for-react";
import React from "react";

export interface PieChartDataItem {
  name: string;
  value: number;
  color: string;
  percentage: string | number;
}

interface CustomPieChartProps {
  data: PieChartDataItem[];
  seriesName?: string;      // Nama seri untuk tooltip (opsional)
  totalLabel?: string;      // Teks label total (opsional)
  totalValue?: React.ReactNode; // Nilai total yang sudah diformat (opsional)
}

export default function CustomPieChart({
  data,
  seriesName = "Data",
  totalLabel,
  totalValue,
}: CustomPieChartProps) {
  const pieChartOption = {
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)",
    },
    legend: {
      show: false, // Kita sembunyikan karena menggunakan custom legend di bawah
    },
    series: [
      {
        name: seriesName,
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
            show: false,
            fontSize: 16,
            fontWeight: "bold",
          },
        },
        labelLine: {
          show: false,
        },
        data: data.map((item) => ({
          value: item.value,
          name: item.name,
          itemStyle: { color: item.color },
        })),
      },
    ],
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Area Chart */}
      <div className="w-full h-[200px]">
        <ReactECharts option={pieChartOption} style={{ height: "100%", width: "100%" }} />
      </div>

      {/* Tampilan Total (Hanya muncul jika props totalValue diberikan) */}
      {totalValue && (
        <div className="text-center -mt-4 mb-4">
          <p className="text-xs text-gray-500">{totalLabel || "Total"}</p>
          <p className="text-xl font-bold text-gray-900">{totalValue}</p>
        </div>
      )}

      {/* Custom Legend */}
      <div className="flex flex-wrap gap-4 justify-center">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            ></span>
            <span className="text-xs text-gray-600">
              {item.name} ({item.percentage}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}