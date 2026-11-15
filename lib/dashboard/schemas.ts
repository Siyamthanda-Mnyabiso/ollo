import { z } from "zod";
import { MAX_PAYMENT_CENTS, MIN_PAYMENT_CENTS, parseRandsToCents } from "@/lib/money";
import { PAYMENT_METHODS } from "@/lib/fees/config";

export const amountSchema = z
  .string()
  .trim()
  .transform((v, ctx) => {
    const cents = parseRandsToCents(v);
    if (cents === null) {
      ctx.addIssue({ code: "custom", message: "Enter an amount, for example 250 or 250.50" });
      return z.NEVER;
    }
    return cents;
  })
  .pipe(
    z
      .number()
      .min(MIN_PAYMENT_CENTS, "The smallest payment is R5")
      .max(MAX_PAYMENT_CENTS, "The largest payment is R50 000"),
  );

export const requestSchema = z.object({
  amountCents: amountSchema,
  description: z.string().trim().max(140, "Keep it under 140 characters").optional(),
});

export const itemSchema = z.object({
  name: z.string().trim().min(2, "Enter the item name").max(80, "Keep it under 80 characters"),
  priceCents: amountSchema,
});

export const buyerSchema = z.object({
  method: z.enum(PAYMENT_METHODS, { error: "Choose how you want to pay" }),
  buyerName: z.string().trim().max(80).optional(),
  buyerPhone: z.string().trim().max(20).optional(),
  idempotencyKey: z.string().min(8).max(100),
});
