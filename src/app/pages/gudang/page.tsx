import { listProducts } from "@/lib/inventory";
import GudangClient from "./components/GudangClient";

export default async function GudangPage() {
  const products = await listProducts();

  return <GudangClient initialProducts={products} />;
}
