import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getEnv } from "@/lib/env";
import * as schema from "./schema";

/**
 * Server-side database client. It connects with the database owner role and
 * bypasses RLS, so it must only be used in server code after you have checked
 * who the caller is. Browser access goes through Supabase with the anon key.
 */
const globalForDb = globalThis as unknown as { sql?: ReturnType<typeof postgres> };

const client = globalForDb.sql ?? postgres(getEnv().DATABASE_URL, { prepare: false, max: 10 });
if (process.env.NODE_ENV !== "production") globalForDb.sql = client;

export const db = drizzle(client, { schema });
export type Db = typeof db;
/** Either the db or an open transaction. Ledger functions accept both. */
export type DbOrTx = Parameters<Parameters<Db["transaction"]>[0]>[0] | Db;
export { schema };
