"use server";

import { redirect } from "next/navigation";
import { requestOtp, verifyOtp } from "@/lib/auth/server";
import { otpSchema, zaPhoneSchema } from "@/lib/auth/phone";

export interface SignInState {
  step: "phone" | "code";
  phone?: string;
  error?: string;
}

export async function sendCode(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = zaPhoneSchema.safeParse(formData.get("phone"));
  if (!parsed.success)
    return { step: "phone", error: "Enter a valid South African cellphone number" };
  try {
    await requestOtp(parsed.data);
  } catch {
    // Do not reveal whether a number exists or why sending failed.
    return { step: "phone", error: "We could not send a code. Wait a moment and try again." };
  }
  return { step: "code", phone: parsed.data };
}

export async function checkCode(prev: SignInState, formData: FormData): Promise<SignInState> {
  const phone = prev.phone;
  if (!phone) return { step: "phone" };
  const code = otpSchema.safeParse(formData.get("code"));
  if (!code.success) return { step: "code", phone, error: "Enter the 6 digit code" };
  try {
    await verifyOtp(phone, code.data);
  } catch {
    return { step: "code", phone, error: "That code is not right or has expired" };
  }
  // The onboarding index sends finished sellers to the dashboard and others to the step they left.
  redirect("/onboarding");
}

export async function resendCode(prev: SignInState): Promise<SignInState> {
  if (!prev.phone) return { step: "phone" };
  try {
    await requestOtp(prev.phone);
  } catch {
    return { ...prev, error: "We could not send a new code yet. Wait a moment and try again." };
  }
  return { step: "code", phone: prev.phone };
}
