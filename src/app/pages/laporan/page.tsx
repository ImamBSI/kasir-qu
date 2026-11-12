import { getMonthlyReportData } from "@/lib/reports";
import LaporanClient from "./LaporanClient";

export default async function LaporanPage() {
  const reportData = await getMonthlyReportData();
  return <LaporanClient {...reportData} />;
}
