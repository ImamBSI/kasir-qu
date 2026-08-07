"use client";

import ReactECharts from "echarts-for-react";
import { PieChart as PieChartIcon } from "lucide-react";
import type { EChartsOption } from "echarts";
import { formatCurrency } from "@/utils/format";

export interface PieChartData {
  name: string;
  value: number;
  color: string;
  percentage?: string | number;
}

interface PieChartProps {
  title: string;
  data: PieChartData[];
  total: number;
  className?: string;
}

export default function PieChart({
  title,
  data,
  total,
  className = "",
}: PieChartProps) {
  const option: EChartsOption = {
    tooltip: {
      trigger: "item",
      formatter: "{b}<br/>Rp {c} ({d}%)",
    },

    legend: {
      show: false,
    },

    series: [
      {
        type: "pie",
        radius: ["60%", "80%"],

        avoidLabelOverlap: false,

        itemStyle: {
          borderColor: "#fff",
          borderWidth: 3,
        },

        label: {
          show: false,
        },

        labelLine: {
          show: false,
        },

        data: data.map((item) => ({
          value: item.value,
          name: item.name,
          itemStyle: {
            color: item.color,
          },
        })),
      },
    ],
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <h2 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-900">
        <PieChartIcon className="size-5 text-blue-600" />
        {title}
      </h2>

      <div className="flex flex-col items-center">
        <div className="w-full h-[220px]">
          <ReactECharts
            option={option}
            style={{
              width: "100%",
              height: "100%",
            }}
          />
        </div>

        <div className="-mt-2 mb-5 text-center">
          <p className="text-xs text-gray-500">
            Total Sales
          </p>

          <p className="text-2xl font-bold text-gray-900">
            Rp {formatCurrency(total)}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {data.map((item) => (
            <div
              key={item.name}
              className="flex items-center gap-2"
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: item.color,
                }}
              />

              <span className="text-xs text-gray-600">
                {item.name} ({item.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}