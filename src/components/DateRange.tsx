"use client";

import { useRef } from "react";
import { Calendar } from "lucide-react";

interface DateRangeProps {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
}

export default function DateRange({
  startDate,
  endDate,
  onChange,
}: DateRangeProps) {
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);

  const openPicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    try {
      ref.current?.showPicker();
    } catch (error) {
      ref.current?.focus();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 px-2.5 py-1.5 md:px-3 md:py-2 bg-slate-50 border border-slate-200 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
      <Calendar className="size-4 shrink-0 text-slate-600 hover:text-slate-900 cursor-pointer" />

      <input
        ref={startInputRef}
        type="date"
        aria-label="Tanggal mulai"
        value={startDate}
        onClick={() => openPicker(startInputRef)}
        onChange={(e) => onChange(e.target.value, endDate)}
        className="w-[8.5rem] min-w-0 bg-transparent text-xs md:text-sm font-medium text-slate-700 focus:outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden"
      />

      <span className="text-sm font-medium text-slate-500">-</span>

      <input
        ref={endInputRef}
        type="date"
        aria-label="Tanggal akhir"
        value={endDate}
        onClick={() => openPicker(endInputRef)}
        onChange={(e) => onChange(startDate, e.target.value)}
        className="w-[8.5rem] min-w-0 bg-transparent text-xs md:text-sm font-medium text-slate-700 focus:outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden"
      />
    </div>
  );
}
