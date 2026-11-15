"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { amountSchema, buyerSchema } from "@/lib/dashboard/schemas";
import { db } from "@/lib/db";
import { items, paymentRequests } from "@/lib/db/schema";
import { getEnv } from "@/lib/env";
import { limitMessage, resolveLimits } from "@/lib/limits";
import {
  enabledMethods,
  getSellerByHandle,
  PaymentLimitError,
  startPayment,
} from "@/lib/payments/service";
import { PAYMENTS_DISABLED_MESSAGE, PaymentsDisabledError } from "@/lib/payments";

export interface PayFormState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

/**
 * Starts a payment from the public pay page. Anyone can call this, so nothing from the form is
 * trusted: the seller comes from the address, and a request's amount comes from the database.
 */
export async function payNow(_prev: PayFormState, formData: FormData): Promise<PayFormState> {
  const handle = z.string().min(1).max(40).safeParse(formData.get("handle"));
  if (!handle.success) return { error: "This pay link is not valid." };
  const seller = await getSellerByHandle(handle.data);
  if (!seller || seller.status === "suspended") return { error: "This pay link is not valid." };

  const buyer = buyerSchema.safeParse({
    method: formData.get("method"),
    buyerName: formData.get("buyerName") || undefined,
    buyerPhone: formData.get("buyerPhone") || undefined,
    idempotencyKey: formData.get("idempotencyKey"),
  });
  if (!buyer.success) {
    return { fieldErrors: z.flattenError(buyer.error).fieldErrors as Record<string, string[]> };
  }
  if (!(await enabledMethods(seller.id)).includes(buyer.data.method)) {
    return { fieldErrors: { method: ["This seller does not accept that way of paying"] } };
  }

  let amountCents: number;
  let requestId: string | undefined;
  let description: string | undefined;
  let item: { id: string; name: string } | undefined;
  const rawRequestId = formData.get("requestId");
  if (rawRequestId) {
    const id = z.uuid().safeParse(rawRequestId);
    if (!id.success) return { error: "This payment request is not valid." };
    const [request] = await db
      .select()
      .from(paymentRequests)
      .where(and(eq(paymentRequests.id, id.data), eq(paymentRequests.sellerId, seller.id)))
      .limit(1);
    if (!request || request.status !== "open")
      return { error: "This payment request is no longer open." };
    if (request.expiresAt && request.expiresAt < new Date())
      return { error: "This payment request has expired. Ask the seller for a new one." };
    amountCents = request.amountCents;
    requestId = request.id;
    description = request.description ?? undefined;
  } else if (formData.get("item") && formData.get("item") !== "custom") {
    // The price always comes from the database, never from the form.
    const itemId = z.uuid().safeParse(formData.get("item"));
    if (!itemId.success) return { fieldErrors: { item: ["Choose an item or enter an amount"] } };
    const [row] = await db
      .select()
      .from(items)
      .where(and(eq(items.id, itemId.data), eq(items.sellerId, seller.id), eq(items.active, true)))
      .limit(1);
    if (!row) return { fieldErrors: { item: ["That item is no longer available"] } };
    amountCents = row.priceCents;
    item = { id: row.id, name: row.name };
    description = row.name;
  } else {
    const amount = amountSchema.safeParse(formData.get("amount"));
    if (!amount.success) {
      return { fieldErrors: { amount: [amount.error.issues[0]?.message ?? "Enter an amount"] } };
    }
    amountCents = amount.data;
  }

  const appUrl = getEnv().NEXT_PUBLIC_APP_URL;
  let redirectUrl: string | undefined;
  try {
    const result = await startPayment({
      sellerId: seller.id,
      plan: seller.plan,
      limits: resolveLimits(seller),
      requestId,
      item,
      amountCents,
      method: buyer.data.method,
      buyer: { name: buyer.data.buyerName, phone: buyer.data.buyerPhone },
      idempotencyKey: buyer.data.idempotencyKey,
      description,
      returnUrl: (paymentId) => `${appUrl}/${seller.handle}/done?p=${paymentId}`,
    });
    redirectUrl = result.redirectUrl ?? `${appUrl}/${seller.handle}/done?p=${result.paymentId}`;
  } catch (error) {
    if (error instanceof PaymentsDisabledError) return { error: PAYMENTS_DISABLED_MESSAGE };
    if (error instanceof PaymentLimitError) {
      return { error: limitMessage(error.check, seller.displayName) };
    }
    return { error: "We could not start your payment. Nothing was charged. Please try again." };
  }
  redirect(redirectUrl);
}
