"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSeller } from "@/lib/dashboard/queries";
import { db } from "@/lib/db";
import { auditLog, paymentMethodSettings } from "@/lib/db/schema";
import { PAYMENT_METHODS } from "@/lib/fees/config";

export interface MethodsState {
  error?: string;
  saved?: boolean;
}

const schema = z.object({
  methods: z.array(z.enum(PAYMENT_METHODS)).min(1, "Keep at least one way to pay switched on"),
});

export async function saveMethods(_prev: MethodsState, formData: FormData): Promise<MethodsState> {
  const { user, seller } = await requireSeller();
  const parsed = schema.safeParse({ methods: formData.getAll("methods") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const enabled = new Set(parsed.data.methods);

  await db.transaction(async (tx) => {
    for (const method of PAYMENT_METHODS) {
      await tx
        .insert(paymentMethodSettings)
        .values({ sellerId: seller.id, method, enabled: enabled.has(method) })
        .onConflictDoUpdate({
          target: [paymentMethodSettings.sellerId, paymentMethodSettings.method],
          set: { enabled: enabled.has(method) },
        });
    }
    await tx.insert(auditLog).values({
      actor: user.id,
      action: "seller.payment_methods_changed",
      entity: "sellers",
      entityId: seller.id,
      after: { enabled: [...enabled] },
    });
  });
  revalidatePath("/dashboard/payment-methods");
  return { saved: true };
}
