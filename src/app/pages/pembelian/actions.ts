"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/session";
import { createSale } from "@/lib/sales";

export async function createSaleAction(input: unknown) {
  const user = await requireAuthenticatedUser();

  try {
    const sale = await createSale(input, user.id);
    revalidatePath("/");
    revalidatePath("/pages/gudang");
    revalidatePath("/pages/laporan");
    revalidatePath("/pages/pembelian");
    return { ok: true as const, ...sale };
  } catch (error) {
    console.error("[sale]", error);
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Transaksi gagal.",
    };
  }
}
