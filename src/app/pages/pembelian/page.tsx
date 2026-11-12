import { listProducts } from "@/lib/inventory";
import PembelianClient from "./PembelianClient";

export default async function PembelianPage() {
  const products = await listProducts();

  return <PembelianClient initialProducts={products} />;
}
