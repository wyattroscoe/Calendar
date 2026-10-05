import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

// DATABASE_URL set (Vercel / Neon) → hosted Postgres.
// Not set (local dev) → PGlite, an embedded Postgres stored in ./.pglite.

export type DB = PgDatabase<PgQueryResultHKT, typeof schema>;

export const PGLITE_DIR = "./.pglite";

function createDb(): DB {
  const url = process.env.DATABASE_URL;
  if (url) return drizzleNeon(neon(url), { schema }) as unknown as DB;
  return drizzlePglite(PGLITE_DIR, { schema }) as unknown as DB;
}

// Reuse one connection across hot reloads in development.
const globalForDb = globalThis as unknown as { db?: DB };
export const db: DB = globalForDb.db ?? createDb();
if (process.env.NODE_ENV !== "production") globalForDb.db = db;
