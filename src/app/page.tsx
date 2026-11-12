import Dashboard from "@/components/Dashboard";
import { getDashboardLowStock } from "@/lib/reports";
import { requireAuthenticatedUser } from "@/lib/session";
import { getOrdersByDateRange } from "@/lib/sales";

function getJakartaDateKey() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export default async function HomePage() {
  await requireAuthenticatedUser();
  const today = getJakartaDateKey();
  const [initialOrders, initialStockWarnings] = await Promise.all([
    getOrdersByDateRange(today, today),
    getDashboardLowStock(),
  ]);

  return (
    <Dashboard
      initialDate={today}
      initialOrders={initialOrders}
      initialStockWarnings={initialStockWarnings}
    />
  );
}
