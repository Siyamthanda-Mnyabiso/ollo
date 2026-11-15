const LOCAL_HOSTS = ["localhost", "127.0.0.1", "::1", "[::1]"];

/**
 * Whether people can sign up and log in. SIGNUPS_OPEN decides when it is set. When it is not,
 * sign-ups are open everywhere except a real production site, so a forgotten setting can never
 * show a sign-in form that cannot send a code. A production build against a local Supabase (the
 * end-to-end tests) counts as open.
 */
export function signupsOpen(env: {
  SIGNUPS_OPEN?: boolean;
  NODE_ENV: string;
  NEXT_PUBLIC_SUPABASE_URL: string;
}): boolean {
  if (env.SIGNUPS_OPEN !== undefined) return env.SIGNUPS_OPEN;
  if (env.NODE_ENV !== "production") return true;
  return LOCAL_HOSTS.includes(new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname);
}
