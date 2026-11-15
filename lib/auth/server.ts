import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getEnv } from "@/lib/env";
import { otpSchema, zaPhoneSchema } from "./phone";

/** Supabase client acting as the signed-in user (anon key, RLS applies). */
export async function createSupabaseServerClient() {
  const env = getEnv();
  const cookieStore = await cookies();
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try {
            for (const { name, value, options } of list) cookieStore.set(name, value, options);
          } catch {
            // Called from a Server Component, where cookies cannot be set. Safe to ignore.
          }
        },
      },
    },
  );
}

/** Supabase client with the service role key. Bypasses RLS. Server only. */
export function createSupabaseAdminClient() {
  const env = getEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Sends a one-time PIN by SMS to a South African number. */
export async function requestOtp(phoneInput: string) {
  const phone = zaPhoneSchema.parse(phoneInput);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) throw error;
  return { phone };
}

/** Checks the PIN and starts a session. */
export async function verifyOtp(phoneInput: string, tokenInput: string) {
  const phone = zaPhoneSchema.parse(phoneInput);
  const token = otpSchema.parse(tokenInput);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
  if (error) throw error;
  return data;
}

/** The signed-in user, verified with Supabase. Null when signed out. */
export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}
