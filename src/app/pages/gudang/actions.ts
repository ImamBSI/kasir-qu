"use server";

import { revalidatePath } from "next/cache";
import {
  addStock,
  createProduct,
  updateProduct,
} from "@/lib/inventory";
import { requireAuthenticatedUser } from "@/lib/session";
import type {
  ActionResult,
  AddStockInput,
  CreateProductInput,
  UpdateProductInput,
} from "@/types/inventory";

async function runInventoryAction<T>(
  task: (userId: string) => Promise<T>,
): Promise<ActionResult> {
  const user = await requireAuthenticatedUser();

  try {
    const result = await task(user.id);
    revalidatePath("/");
    revalidatePath("/pages/gudang");
    revalidatePath("/pages/pembelian");
    revalidatePath("/pages/laporan");
    return {
      ok: true,
      warning: typeof result === "string" ? result : undefined,
    };
  } catch (error) {
    console.error("[inventory]", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Terjadi kesalahan.",
    };
  }
}

export async function createProductAction(
  input: CreateProductInput,
): Promise<ActionResult> {
  return runInventoryAction(() => createProduct(input));
}

export async function updateProductAction(
  input: UpdateProductInput,
): Promise<ActionResult> {
  return runInventoryAction(() => updateProduct(input));
}

export async function addStockAction(
  input: AddStockInput,
): Promise<ActionResult> {
  return runInventoryAction((userId) => addStock(input, userId));
}
