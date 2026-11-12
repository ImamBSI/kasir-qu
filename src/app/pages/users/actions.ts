"use server";

import { revalidatePath } from "next/cache";
import {
  createManagedUser,
  resetManagedUserPassword,
  setManagedUserActive,
  updateManagedUser,
  UserManagementError,
} from "@/lib/userManagement";
import { requireSuperAdminUser } from "@/lib/session";
import type { UserManagerActionResult } from "@/types/users";

async function runUserManagerAction(
  task: (actorId: string) => Promise<void>,
): Promise<UserManagerActionResult> {
  const actor = await requireSuperAdminUser();

  try {
    await task(actor.id);
    revalidatePath("/pages/users");
    return { ok: true };
  } catch (error) {
    console.error("[user-manager]", error);
    return {
      ok: false,
      error:
        error instanceof UserManagementError
          ? error.message
          : "Operasi akun gagal. Silakan coba lagi.",
    };
  }
}

export async function createManagedUserAction(
  input: unknown,
): Promise<UserManagerActionResult> {
  return runUserManagerAction(() => createManagedUser(input));
}

export async function updateManagedUserAction(
  input: unknown,
): Promise<UserManagerActionResult> {
  return runUserManagerAction((actorId) => updateManagedUser(input, actorId));
}

export async function setManagedUserActiveAction(
  input: unknown,
): Promise<UserManagerActionResult> {
  return runUserManagerAction((actorId) =>
    setManagedUserActive(input, actorId),
  );
}

export async function resetManagedUserPasswordAction(
  input: unknown,
): Promise<UserManagerActionResult> {
  return runUserManagerAction(() => resetManagedUserPassword(input));
}
