import Dashboard from "@/components/Dashboard";
import { requireAuthenticatedUser } from "@/lib/session";

export default async function HomePage() {
  await requireAuthenticatedUser();

  return <Dashboard />;
}
