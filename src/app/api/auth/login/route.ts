import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import {
  createSessionToken,
  isUserRole,
  SESSION_COOKIE_NAME,
} from "@/lib/session";
import { getDbPool } from "@/lib/db";

export const runtime = "nodejs";

interface Credentials {
  username: string;
  password: string;
}

interface UserRow {
  id: string;
  password_hash: string;
  role: string;
  is_active: boolean;
  session_version: number;
}

function isCredentials(value: unknown): value is Credentials {
  return (
    typeof value === "object" &&
    value !== null &&
    "username" in value &&
    typeof value.username === "string" &&
    "password" in value &&
    typeof value.password === "string"
  );
}

export async function POST(request: Request) {
  const contentType = request.headers
    .get("content-type")
    ?.split(";", 1)[0]
    .trim()
    .toLowerCase();

  if (contentType !== "application/json") {
    return Response.json(
      { error: "Jenis permintaan tidak didukung." },
      { status: 415 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  if (!isCredentials(body)) {
    return Response.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  const username = body.username.trim();
  if (
    username.length === 0 ||
    username.length > 50 ||
    body.password.length === 0 ||
    Buffer.byteLength(body.password, "utf8") > 72
  ) {
    return Response.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  const result = await getDbPool().query<UserRow>(
    `SELECT id::text, password_hash, role, is_active, session_version
     FROM users
     WHERE username = $1
     LIMIT 1`,
    [username],
  );
  const user = result.rows[0];
  const passwordMatches = user
    ? await compare(body.password, user.password_hash)
    : false;

  if (!user || !user.is_active || !isUserRole(user.role) || !passwordMatches) {
    return Response.json(
      { error: "Username atau password salah." },
      { status: 401 },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE_NAME,
    createSessionToken(user.id, user.session_version),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    },
  );

  return Response.json({ role: user.role });
}
