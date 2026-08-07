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
    <div className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
      <Calendar className="size-4 text-slate-600 hover:text-slate-900 cursor-pointer" />

      <input
        ref={startInputRef}
        type="date"
        value={startDate}
        onClick={() => openPicker(startInputRef)}
        onChange={(e) => onChange(e.target.value, endDate)}
        className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden"
      />

      <span className="text-sm font-medium text-slate-500">-</span>

      <input
        ref={endInputRef}
        type="date"
        value={endDate}
        onClick={() => openPicker(endInputRef)}
        onChange={(e) => onChange(startDate, e.target.value)}
        className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden"
      />
    </div>
  );
}
