"use server";

import { z } from "zod";
import { zaPhoneSchema } from "@/lib/auth/phone";
import { db } from "@/lib/db";
import { waitlistSignups } from "@/lib/db/schema";

export interface WaitlistState {
  done?: boolean;
  error?: string;
}

/**
 * Pre-launch sign-up. Anyone can call this, so it validates the number, ignores bots through a
 * hidden field, and answers the same whether or not the number was already on the list.
 */
export async function joinWaitlist(
  _prev: WaitlistState,
  formData: FormData,
): Promise<WaitlistState> {
  if (formData.get("website")) return { done: true }; // A bot filled the hidden field.
  const phone = zaPhoneSchema.safeParse(formData.get("phone"));
  if (!phone.success) return { error: "Enter a valid South African cellphone number" };
  const name = z
    .string()
    .trim()
    .max(80)
    .safeParse(formData.get("name") ?? "");
  await db
    .insert(waitlistSignups)
    .values({ phone: phone.data, name: name.success && name.data ? name.data : null })
    .onConflictDoNothing({ target: waitlistSignups.phone });
  return { done: true };
}
