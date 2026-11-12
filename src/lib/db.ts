import "server-only";

import { Pool } from "pg";

type GlobalWithPool = typeof globalThis & {
  kasirQuPool?: Pool;
};

const globalWithPool = globalThis as GlobalWithPool;

export function getDbPool() {
  const connectionString = process.env.NEON_DATABASE_URL;

  if (!connectionString) {
    throw new Error("NEON_DATABASE_URL is required.");
  }

  if (!globalWithPool.kasirQuPool) {
    globalWithPool.kasirQuPool = new Pool({
      connectionString,
      max: 1,
    });
  }

  return globalWithPool.kasirQuPool;
}
