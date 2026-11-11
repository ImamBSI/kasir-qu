"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface DateRangeProps {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
}

interface MonthGridProps {
  month: Date;
  startDate: string;
  endDate: string;
  onSelect: (date: string) => void;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

function parseDate(value: string): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string): string {
  const date = parseDate(value);
  if (!date) return "MM/DD/YYYY";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}/${day}/${date.getFullYear()}`;
}

function getMonthDays(month: Date): Array<number | null> {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const days: Array<number | null> = Array(firstWeekday).fill(null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(day);
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

function MonthGrid({ month, startDate, endDate, onSelect }: MonthGridProps) {
  const today = toDateKey(new Date());

  return (
    <div className="w-full sm:w-[250px]">
      <div className="mb-3 grid grid-cols-7 text-center text-xs font-medium text-slate-500">
        {WEEKDAYS.map((day, index) => (
          <span key={`${day}-${index}`} className="h-8">
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {getMonthDays(month).map((day, index) => {
          if (!day) {
            return <span key={`empty-${index}`} className="h-9" />;
          }

          const date = new Date(month.getFullYear(), month.getMonth(), day);
          const dateKey = toDateKey(date);
          const isStart = dateKey === startDate;
          const isEnd = dateKey === endDate;
          const isSelected = isStart || isEnd;
          const isInRange =
            Boolean(startDate && endDate) &&
            dateKey > startDate &&
            dateKey < endDate;
          const isToday = dateKey === today;

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelect(dateKey)}
              aria-label={`Pilih tanggal ${formatDisplayDate(dateKey)}`}
              aria-pressed={isSelected}
              className={`mx-auto flex h-9 w-9 items-center justify-center text-sm transition-colors ${
                isSelected
                  ? "rounded-full bg-blue-500 font-semibold text-white"
                  : isInRange
                    ? "rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200"
                    : `rounded-full text-slate-700 hover:bg-slate-100 ${
                        isToday ? "ring-1 ring-slate-300" : ""
                      }`
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DateRange({
  startDate,
  endDate,
  onChange,
}: DateRangeProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(
    () => parseDate(startDate) ?? new Date(),
  );

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const nextMonth = new Date(
    viewMonth.getFullYear(),
    viewMonth.getMonth() + 1,
    1,
  );

  const toggleCalendar = () => {
    if (!isOpen) {
      setViewMonth(
        parseDate(startDate) ?? parseDate(endDate) ?? new Date(),
      );
    }
    setIsOpen((open) => !open);
  };

  const moveMonth = (offset: number) => {
    setViewMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
  };

  const handleSelect = (date: string) => {
    if (!startDate || endDate || date < startDate) {
      onChange(date, "");
      return;
    }

    onChange(startDate, date);
    setIsOpen(false);
  };

  return (
    <div ref={rootRef} className="relative inline-block max-w-full">
      <button
        type="button"
        onClick={toggleCalendar}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={`flex w-[290px] max-w-full items-center justify-between gap-3 rounded-md border bg-slate-50 px-3 py-2 text-left shadow-sm transition-all ${
          isOpen
            ? "border-transparent ring-2 ring-blue-500"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <span className="whitespace-nowrap text-sm font-medium tracking-wide text-slate-700">
          {formatDisplayDate(startDate)}
          <span className="mx-1.5 text-slate-500">–</span>
          <span className={endDate ? "text-slate-700" : "text-slate-500"}>
            {formatDisplayDate(endDate)}
          </span>
        </span>
        <Calendar className="size-4 shrink-0 text-slate-600" />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Pilih rentang tanggal"
          className="absolute right-0 top-full z-50 mt-2 max-h-[75vh] w-[min(570px,calc(100vw-2rem))] overflow-y-auto rounded-lg border border-slate-200 bg-white p-5 text-slate-700 shadow-xl"
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              aria-label="Bulan sebelumnya"
              className="flex size-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <ChevronLeft className="size-5" />
            </button>
            <div className="grid flex-1 grid-cols-1 sm:grid-cols-2">
              <h3 className="text-center text-lg font-medium">
                {monthFormatter.format(viewMonth)}
              </h3>
              <h3 className="hidden text-center text-lg font-medium sm:block">
                {monthFormatter.format(nextMonth)}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              aria-label="Bulan berikutnya"
              className="flex size-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>

          <div className="flex justify-center gap-6">
            <MonthGrid
              month={viewMonth}
              startDate={startDate}
              endDate={endDate}
              onSelect={handleSelect}
            />
            <div className="hidden border-l border-slate-200 pl-6 sm:block">
              <MonthGrid
                month={nextMonth}
                startDate={startDate}
                endDate={endDate}
                onSelect={handleSelect}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
