import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDbPool } from "@/lib/db";
import type { UserRole } from "@/types";

export const SESSION_COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Host-kasirqu-session"
    : "kasirqu-session";

const SESSION_DURATION_SECONDS = 60 * 60 * 8;

interface SessionPayload {
  userId: string;
  sessionVersion: number;
  expiresAt: number;
}

interface AuthenticatedUser {
  id: string;
  name: string;
  username: string;
  role: UserRole;
}

function getSessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET;

  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("AUTH_SESSION_SECRET must be at least 32 bytes.");
  }

  return secret;
}

export function isUserRole(role: string): role is UserRole {
  return role === "SADM" || role === "ADM" || role === "STF";
}

export function createSessionToken(userId: string, sessionVersion: number) {
  const payload = Buffer.from(
    JSON.stringify({
      userId,
      sessionVersion,
      expiresAt: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
    } satisfies SessionPayload),
  ).toString("base64url");
  const signature = createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

function getSessionUserId(token: string | undefined) {
  if (!token) return null;

  const [encodedPayload, encodedSignature, ...extraParts] = token.split(".");
  if (!encodedPayload || !encodedSignature || extraParts.length > 0) {
    return null;
  }

  const expectedSignature = createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest();
  const providedSignature = Buffer.from(encodedSignature, "base64url");

  if (
    providedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(providedSignature, expectedSignature)
  ) {
    return null;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    );
  } catch {
    return null;
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    !("userId" in payload) ||
    typeof payload.userId !== "string" ||
    !("sessionVersion" in payload) ||
    typeof payload.sessionVersion !== "number" ||
    !Number.isSafeInteger(payload.sessionVersion) ||
    payload.sessionVersion < 0 ||
    !("expiresAt" in payload) ||
    typeof payload.expiresAt !== "number" ||
    payload.expiresAt <= Math.floor(Date.now() / 1000)
  ) {
    return null;
  }

  return {
    userId: payload.userId,
    sessionVersion: payload.sessionVersion,
  };
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const session = getSessionUserId(
    cookieStore.get(SESSION_COOKIE_NAME)?.value,
  );
  if (!session) return null;

  const result = await getDbPool().query<{
    id: string;
    name: string;
    username: string;
    role: string;
    session_version: number;
  }>(
    `SELECT id::text, name, username, role, session_version
     FROM users
     WHERE id = $1 AND is_active = TRUE
     LIMIT 1`,
    [session.userId],
  );
  const user = result.rows[0];

  if (
    !user ||
    !isUserRole(user.role) ||
    user.session_version !== session.sessionVersion
  ) {
    return null;
  }

  return { ...user, role: user.role };
}

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireSuperAdminUser() {
  const user = await requireAuthenticatedUser();

  if (user.role !== "SADM") {
    redirect("/");
  }

  return user;
}
