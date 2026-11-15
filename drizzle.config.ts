import { defineConfig } from "drizzle-kit";

// Reads the same local env file Next.js uses, unless DATABASE_URL is already set (for example to a local database).
if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // No local env file: fall back to the local database below.
  }
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  },
  entities: { roles: { provider: "supabase" } },
  strict: true,
  verbose: true,
});
