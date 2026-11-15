import { z } from "zod";
import { handleSchema } from "@/lib/handles";
import { BANKS, CATEGORIES, CHANNELS, CURRENT_PAYMENT_METHODS, SALES_RANGES } from "./options";

const name = (label: string) =>
  z.string().trim().min(2, `Enter your ${label}`).max(80, `${label} is too long`);

export const profileSchema = z.object({
  fullName: name("full name"),
  displayName: name("business name"),
  category: z.enum(CATEGORIES, { error: "Choose what you sell" }),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const businessSchema = z.object({
  channels: z.array(z.enum(CHANNELS)).min(1, "Choose at least one place you sell"),
  monthlySalesRange: z.enum(SALES_RANGES.map((r) => r.value) as [string, ...string[]], {
    error: "Choose how much you sell each month",
  }),
  currentPaymentMethods: z
    .array(z.enum(CURRENT_PAYMENT_METHODS))
    .min(1, "Choose how customers pay you now"),
});
export type BusinessInput = z.infer<typeof businessSchema>;

export const linkSchema = z.object({ handle: handleSchema });
export type LinkInput = z.infer<typeof linkSchema>;

export const bankSchema = z.object({
  bankName: z.enum(BANKS, { error: "Choose your bank" }),
  accountNumber: z
    .string()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^\d{6,16}$/, "Enter your account number using digits only")),
  accountHolder: name("account holder name"),
});
export type BankInput = z.infer<typeof bankSchema>;

export const planSchema = z.object({ plan: z.enum(["free", "pro"], { error: "Choose a plan" }) });
export type PlanInput = z.infer<typeof planSchema>;
