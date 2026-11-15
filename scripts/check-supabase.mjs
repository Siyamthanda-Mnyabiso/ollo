// Checks a Supabase project: RLS is on for every table, and the publishable key cannot read or write
// the sensitive tables. Prints only pass or fail lines, never any key, password or row.
//
//   pnpm check:supabase            reads .env.local (the hosted project)
//   DATABASE_URL=... NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=... pnpm check:supabase
import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // Nothing to load.
  }
}

const {
  DATABASE_URL,
  NEXT_PUBLIC_SUPABASE_URL: apiUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key,
} = process.env;
if (!DATABASE_URL || !apiUrl || !key) {
  console.error(
    "Missing DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  );
  process.exit(2);
}

let failed = 0;
const report = (ok, text) => {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${text}`);
};

console.log(`Target: ${new URL(apiUrl).hostname}`);

const sql = postgres(DATABASE_URL, { max: 1 });
try {
  const tables = await sql`
    select c.relname as name, c.relrowsecurity as rls
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' order by 1`;
  report(tables.length > 0, `${tables.length} tables in public`);
  for (const t of tables) report(t.rls, `RLS enabled on ${t.name}`);

  const applied = await sql`select count(*)::int as n from drizzle.__drizzle_migrations`.catch(
    () => [{ n: 0 }],
  );
  report(applied[0].n >= 4, `${applied[0].n} migrations recorded`);
} finally {
  await sql.end();
}

const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
for (const table of ["sellers", "seller_verification", "ledger_entries", "audit_log", "payments"]) {
  const read = await fetch(`${apiUrl}/rest/v1/${table}?select=*&limit=1`, { headers });
  const rows = read.ok ? await read.json() : null;
  report(
    !read.ok || (Array.isArray(rows) && rows.length === 0),
    `publishable key reads no rows from ${table}`,
  );
  const write = await fetch(`${apiUrl}/rest/v1/${table}`, { method: "POST", headers, body: "{}" });
  report(!write.ok, `publishable key cannot insert into ${table} (HTTP ${write.status})`);
}

process.exit(failed ? 1 : 0);
