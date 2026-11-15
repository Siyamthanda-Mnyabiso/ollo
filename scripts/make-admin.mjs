// Makes a local user an admin: sets app_metadata.role = "admin" (never user_metadata).
//   pnpm local pnpm make-admin 0821234567
// Sign out and back in afterwards so the new role is in your session.
import postgres from "postgres";

const phone = process.argv[2];
if (!phone || !process.env.DATABASE_URL) {
  console.error("Usage: pnpm local pnpm make-admin <phone, e.g. 0821234567>");
  process.exit(2);
}
const e164 = phone.startsWith("0") ? "27" + phone.slice(1) : phone.replace(/^\+/, "");
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const rows = await sql`
  update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
  where phone = ${e164} returning id`;
await sql.end();
if (rows.length === 0) {
  console.error(`No user with phone ${e164}. Sign in once at /sign-in first, then run this again.`);
  process.exit(1);
}
console.log(`${e164} is now an admin. Sign out and back in.`);
