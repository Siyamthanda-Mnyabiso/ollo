import { z } from "zod";

/**
 * South African mobile numbers. Accepts 082 456 7890, 82 456 7890, +27 82 456 7890
 * and 0027824567890, and returns E.164 (+27824567890).
 */
export function normaliseZaPhone(input: string): string | null {
  const digits = input.replace(/[\s()-]/g, "");
  let national: string;
  if (/^\+27\d{9}$/.test(digits)) national = digits.slice(3);
  else if (/^0027\d{9}$/.test(digits)) national = digits.slice(4);
  else if (/^27\d{9}$/.test(digits)) national = digits.slice(2);
  else if (/^0\d{9}$/.test(digits)) national = digits.slice(1);
  else if (/^\d{9}$/.test(digits)) national = digits;
  else return null;
  // Mobile numbers start 6, 7 or 8.
  if (!/^[678]/.test(national)) return null;
  return `+27${national}`;
}

export const zaPhoneSchema = z.string().transform((v, ctx) => {
  const n = normaliseZaPhone(v);
  if (!n) ctx.addIssue({ code: "custom", message: "Enter a valid South African cellphone number" });
  return n ?? z.NEVER;
});

export const otpSchema = z.string().regex(/^\d{6}$/, "Enter the 6 digit code");
