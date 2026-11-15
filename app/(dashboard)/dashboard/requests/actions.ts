"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { auditLog, paymentRequests } from "@/lib/db/schema";
import { requestSchema } from "@/lib/dashboard/schemas";
import { requireSeller } from "@/lib/dashboard/queries";

export interface RequestFormState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

/** Requests stay open for a week unless they are paid or cancelled first. */
const REQUEST_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

export async function createRequest(
  _prev: RequestFormState,
  formData: FormData,
): Promise<RequestFormState> {
  const { user, seller } = await requireSeller();
  const parsed = requestSchema.safeParse({
    amountCents: formData.get("amount"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]> };
  }

  const [created] = await db
    .insert(paymentRequests)
    .values({
      sellerId: seller.id,
      amountCents: parsed.data.amountCents,
      description: parsed.data.description,
      expiresAt: new Date(Date.now() + REQUEST_LIFETIME_MS),
    })
    .returning({ id: paymentRequests.id });
  await db.insert(auditLog).values({
    actor: user.id,
    action: "request.created",
    entity: "payment_requests",
    entityId: created!.id,
    after: { amountCents: parsed.data.amountCents },
  });
  redirect(`/dashboard/requests/${created!.id}`);
}

export async function cancelRequest(formData: FormData): Promise<void> {
  const { user, seller } = await requireSeller();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  await db
    .update(paymentRequests)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(paymentRequests.id, id.data),
        eq(paymentRequests.sellerId, seller.id),
        eq(paymentRequests.status, "open"),
      ),
    );
  await db.insert(auditLog).values({
    actor: user.id,
    action: "request.cancelled",
    entity: "payment_requests",
    entityId: id.data,
  });
  redirect(`/dashboard/requests/${id.data}`);
}
