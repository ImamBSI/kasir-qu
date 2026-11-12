import "server-only";

import { hash } from "bcryptjs";
import type { PoolClient } from "pg";
import { getDbPool } from "@/lib/db";
import { isUserRole, requireSuperAdminUser } from "@/lib/session";
import type { ManagedUser } from "@/types/users";

const BCRYPT_ROUNDS = 10;

export class UserManagementError extends Error {}

interface UserDetailsInput {
  id: string;
  name: string;
  username: string;
  role: "SADM" | "ADM" | "STF";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseId(value: unknown): string {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    !/^[1-9]\d*$/.test(value.id)
  ) {
    throw new UserManagementError("Akun yang dipilih tidak valid.");
  }

  return value.id;
}

function parseDetails(value: unknown): UserDetailsInput {
  if (!isRecord(value)) {
    throw new UserManagementError("Data akun tidak valid.");
  }

  const { id, name, username, role } = value;
  if (
    typeof id !== "string" ||
    !/^[1-9]\d*$/.test(id) ||
    typeof name !== "string" ||
    typeof username !== "string" ||
    typeof role !== "string" ||
    !isUserRole(role)
  ) {
    throw new UserManagementError("Data akun tidak valid.");
  }

  const normalizedName = name.trim();
  const normalizedUsername = username.trim();
  if (
    normalizedName.length === 0 ||
    normalizedName.length > 100 ||
    normalizedUsername.length === 0 ||
    normalizedUsername.length > 50
  ) {
    throw new UserManagementError("Nama atau username tidak valid.");
  }

  return {
    id,
    name: normalizedName,
    username: normalizedUsername,
    role,
  };
}

function parseNewUser(value: unknown) {
  if (!isRecord(value)) {
    throw new UserManagementError("Data akun tidak valid.");
  }

  const { name, username, password, role } = value;
  if (
    typeof name !== "string" ||
    typeof username !== "string" ||
    typeof password !== "string" ||
    typeof role !== "string" ||
    !isUserRole(role)
  ) {
    throw new UserManagementError("Data akun tidak valid.");
  }

  const normalizedName = name.trim();
  const normalizedUsername = username.trim();
  validateAccountFields(normalizedName, normalizedUsername);
  validatePassword(password);

  return {
    name: normalizedName,
    username: normalizedUsername,
    password,
    role,
  };
}

function validateAccountFields(name: string, username: string) {
  if (
    name.length === 0 ||
    name.length > 100 ||
    username.length === 0 ||
    username.length > 50
  ) {
    throw new UserManagementError("Nama atau username tidak valid.");
  }
}

function parsePassword(value: unknown) {
  if (!isRecord(value) || typeof value.password !== "string") {
    throw new UserManagementError("Password tidak valid.");
  }
  validatePassword(value.password);
  return value.password;
}

function validatePassword(password: string) {
  const length = Buffer.byteLength(password, "utf8");
  if (length < 12 || length > 72) {
    throw new UserManagementError("Password harus 12-72 byte.");
  }
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

async function withTransaction<T>(
  work: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getDbPool().connect();

  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("[user-manager-rollback]", rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}

async function lockActiveSuperAdmins(client: PoolClient) {
  const result = await client.query<{ id: string }>(
    `SELECT id::text
     FROM users
     WHERE role = 'SADM' AND is_active = TRUE
     ORDER BY id
     FOR UPDATE`,
  );
  return result.rowCount ?? 0;
}

export async function getUserManagerData() {
  const currentUser = await requireSuperAdminUser();
  const result = await getDbPool().query<{
    id: string;
    name: string;
    username: string;
    role: string;
    is_active: boolean;
    created_at: string;
  }>(
    `SELECT id::text, name, username, role, is_active, created_at::text
     FROM users
     ORDER BY created_at DESC, id DESC`,
  );

  const users: ManagedUser[] = result.rows.map((row) => {
    if (!isUserRole(row.role)) {
      throw new Error("Database contains an unsupported user role.");
    }
    return { ...row, role: row.role };
  });

  return { currentUserId: currentUser.id, users };
}

export async function createManagedUser(value: unknown) {
  const user = parseNewUser(value);
  const passwordHash = await hash(user.password, BCRYPT_ROUNDS);

  try {
    await getDbPool().query(
      `INSERT INTO users (name, username, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, TRUE)`,
      [user.name, user.username, passwordHash, user.role],
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new UserManagementError("Username sudah digunakan.");
    }
    throw error;
  }
}

export async function updateManagedUser(value: unknown, actorId: string) {
  const user = parseDetails(value);

  if (user.id === actorId && user.role !== "SADM") {
    throw new UserManagementError("Role akun sendiri tidak dapat diturunkan.");
  }

  try {
    await withTransaction(async (client) => {
      const activeSuperAdmins = await lockActiveSuperAdmins(client);
      const targetResult = await client.query<{
        role: string;
        is_active: boolean;
      }>(
        `SELECT role, is_active
         FROM users
         WHERE id = $1
         FOR UPDATE`,
        [user.id],
      );
      const target = targetResult.rows[0];
      if (!target) {
        throw new UserManagementError("Akun tidak ditemukan.");
      }

      if (
        target.role === "SADM" &&
        target.is_active &&
        user.role !== "SADM" &&
        activeSuperAdmins <= 1
      ) {
        throw new UserManagementError(
          "Tidak dapat mengubah satu-satunya super admin aktif.",
        );
      }

      await client.query(
        `UPDATE users
         SET name = $2, username = $3, role = $4, updated_at = now()
         WHERE id = $1`,
        [user.id, user.name, user.username, user.role],
      );
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new UserManagementError("Username sudah digunakan.");
    }
    throw error;
  }
}

export async function setManagedUserActive(value: unknown, actorId: string) {
  if (!isRecord(value) || typeof value.isActive !== "boolean") {
    throw new UserManagementError("Status akun tidak valid.");
  }

  const userId = parseId(value);
  if (userId === actorId && !value.isActive) {
    throw new UserManagementError("Akun sendiri tidak dapat dinonaktifkan.");
  }

  await withTransaction(async (client) => {
    const activeSuperAdmins = await lockActiveSuperAdmins(client);
    const targetResult = await client.query<{
      role: string;
      is_active: boolean;
    }>(
      `SELECT role, is_active
       FROM users
       WHERE id = $1
       FOR UPDATE`,
      [userId],
    );
    const target = targetResult.rows[0];
    if (!target) {
      throw new UserManagementError("Akun tidak ditemukan.");
    }

    if (
      target.role === "SADM" &&
      target.is_active &&
      !value.isActive &&
      activeSuperAdmins <= 1
    ) {
      throw new UserManagementError(
        "Tidak dapat menonaktifkan satu-satunya super admin aktif.",
      );
    }

    await client.query(
      `UPDATE users
       SET is_active = $2, updated_at = now()
       WHERE id = $1`,
      [userId, value.isActive],
    );
  });
}

export async function resetManagedUserPassword(value: unknown) {
  const userId = parseId(value);
  const password = parsePassword(value);
  const passwordHash = await hash(password, BCRYPT_ROUNDS);
  const result = await getDbPool().query(
    `UPDATE users
     SET password_hash = $2, updated_at = now()
     WHERE id = $1`,
    [userId, passwordHash],
  );

  if (result.rowCount !== 1) {
    throw new UserManagementError("Akun tidak ditemukan.");
  }
}
