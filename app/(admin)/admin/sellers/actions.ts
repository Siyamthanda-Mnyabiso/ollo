"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { auditLog, sellers } from "@/lib/db/schema";
import { MAX_PAYMENT_CENTS, MIN_PAYMENT_CENTS } from "@/lib/limits";
import { parseRandsToCents } from "@/lib/money";

export interface LimitsFormState {
  error?: string;
  saved?: boolean;
  fieldErrors?: Record<string, string[] | undefined>;
}

/** Blank means "use the default". Anything else is a rand amount. */
const optionalAmount = (label: string) =>
  z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (v === "") return null;
      const cents = parseRandsToCents(v);
      if (cents === null || cents < MIN_PAYMENT_CENTS) {
        ctx.addIssue({
          code: "custom",
          message: `${label}: enter an amount of R5 or more, or leave it blank`,
        });
        return z.NEVER;
      }
      return cents;
    });

const limitsSchema = z.object({
  id: z.uuid(),
  perPayment: optionalAmount("Per payment limit"),
  perDay: optionalAmount("Daily limit"),
});

export async function setSellerLimits(
  _prev: LimitsFormState,
  formData: FormData,
): Promise<LimitsFormState> {
  // Checked again here: a server action can be called without going through the admin page.
  const admin = await requireAdmin();
  const parsed = limitsSchema.safeParse({
    id: formData.get("id"),
    perPayment: formData.get("perPayment") ?? "",
    perDay: formData.get("perDay") ?? "",
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]> };
  }
  const { id, perPayment, perDay } = parsed.data;
  if (perPayment !== null && perPayment > MAX_PAYMENT_CENTS) {
    return { fieldErrors: { perPayment: ["The most Ollo allows for one payment is R50 000"] } };
  }
  if (perPayment !== null && perDay !== null && perDay < perPayment) {
    return { fieldErrors: { perDay: ["The daily limit cannot be below the per payment limit"] } };
  }

  const [before] = await db.select().from(sellers).where(eq(sellers.id, id)).limit(1);
  if (!before) return { error: "Seller not found" };
  await db.transaction(async (tx) => {
    await tx
      .update(sellers)
      .set({ limitPerPaymentCents: perPayment, limitPerDayCents: perDay })
      .where(eq(sellers.id, id));
    await tx.insert(auditLog).values({
      actor: admin.id,
      action: "admin.seller_limits_changed",
      entity: "sellers",
      entityId: id,
      before: { perPayment: before.limitPerPaymentCents, perDay: before.limitPerDayCents },
      after: { perPayment, perDay },
    });
  });
  return { saved: true };
}

export async function goToSeller(formData: FormData) {
  await requireAdmin();
  redirect(`/admin/sellers/${z.uuid().parse(formData.get("id"))}`);
}
