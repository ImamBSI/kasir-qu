"use server";

import { requireAuthenticatedUser } from "@/lib/session";
import { getOrdersByDateRange } from "@/lib/sales";

function isDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export async function getDashboardOrdersAction(
  startDate: string,
  endDate: string,
) {
  await requireAuthenticatedUser();

  if (!isDateKey(startDate) || !isDateKey(endDate) || endDate < startDate) {
    throw new Error("Rentang tanggal tidak valid.");
  }

  return getOrdersByDateRange(startDate, endDate);
}
