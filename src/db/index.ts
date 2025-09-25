import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '@/db/schema';

// Guard: prevent Edge runtime from initializing libsql
if (typeof (globalThis as any).EdgeRuntime !== "undefined") {
  throw new Error(
    "Database client initialized on Edge runtime. Move DB calls to Node.js runtime API routes or Server Components, and set `export const runtime = \"nodejs\"` on routes that use the DB."
  );
}

const url = process.env.TURSO_CONNECTION_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  const missing = [!url && 'TURSO_CONNECTION_URL', !authToken && 'TURSO_AUTH_TOKEN'].filter(Boolean).join(', ');
  throw new Error(`Missing required database env vars: ${missing}. Check your .env and deployment environment variables.`);
}

// Optional: reuse a single client/db instance across hot reloads
const globalAny = globalThis as any;
const libsqlClient = globalAny.__LIBSQL_CLIENT__ ?? createClient({ url, authToken });
if (!globalAny.__LIBSQL_CLIENT__) globalAny.__LIBSQL_CLIENT__ = libsqlClient;

export const db = (globalAny.__DRIZZLE_DB__ ??= drizzle(libsqlClient, { schema }));

export type Database = typeof db;