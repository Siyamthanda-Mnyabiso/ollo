import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  auditLog,
  paymentMethodSettings,
  paymentRequests,
  payments,
  sellers,
} from "@/lib/db/schema";
import { calculateFeeCents, PAYMENT_METHODS, type PaymentMethod } from "@/lib/fees";
import { ensureAccount, paymentSettlementLines, postTransaction } from "@/lib/ledger";
import { getPaymentProvider } from "./index";
import { ProviderTimeoutError, type ProviderPaymentStatus } from "./types";

/** Methods a seller accepts. A seller with no saved settings accepts all of them. */
export async function enabledMethods(sellerId: string): Promise<PaymentMethod[]> {
  const rows = await db
    .select()
    .from(paymentMethodSettings)
    .where(eq(paymentMethodSettings.sellerId, sellerId));
  if (rows.length === 0) return [...PAYMENT_METHODS];
  return PAYMENT_METHODS.filter((m) => rows.find((r) => r.method === m)?.enabled);
}

export interface StartPaymentInput {
  sellerId: string;
  plan: "free" | "pro";
  requestId?: string;
  amountCents: number;
  method: PaymentMethod;
  buyer: { name?: string; phone?: string };
  /** Made when the page is shown, so a double click or a retry never creates a second payment. */
  idempotencyKey: string;
  returnUrl: (paymentId: string) => string;
  description?: string;
}

/**
 * Creates the payment row, then asks the provider to start it.
 * Money amounts are integer cents. The fee is fixed here, when the payment is created.
 */
export async function startPayment(
  input: StartPaymentInput,
): Promise<{ redirectUrl?: string; paymentId: string }> {
  const feeCents = calculateFeeCents({
    amountCents: input.amountCents,
    method: input.method,
    plan: input.plan,
  });

  const [created] = await db
    .insert(payments)
    .values({
      sellerId: input.sellerId,
      source: input.requestId ? "request" : "pay_link",
      requestId: input.requestId,
      amountCents: input.amountCents,
      feeCents,
      method: input.method,
      buyerName: input.buyer.name,
      buyerPhone: input.buyer.phone,
      idempotencyKey: input.idempotencyKey,
    })
    .onConflictDoNothing({ target: payments.idempotencyKey })
    .returning();
  const payment =
    created ??
    (await db.select().from(payments).where(eq(payments.idempotencyKey, input.idempotencyKey)))[0]!;

  // A repeat of a payment that already has a provider reference does not call the provider again.
  if (payment.providerReference) return { paymentId: payment.id };

  const provider = getPaymentProvider();
  const request = {
    idempotencyKey: input.idempotencyKey,
    amountCents: payment.amountCents,
    method: payment.method,
    reference: payment.id,
    description: input.description,
    buyer: input.buyer,
    returnUrl: input.returnUrl(payment.id),
  };
  let result;
  try {
    try {
      result = await provider.createPayment(request);
    } catch (error) {
      if (!(error instanceof ProviderTimeoutError)) throw error;
      // The provider may have created it. Asking again with the same key returns that payment.
      result = await provider.createPayment(request);
    }
  } catch {
    await db.update(payments).set({ status: "failed" }).where(eq(payments.id, payment.id));
    throw new Error("The payment provider could not start the payment");
  }

  await db
    .update(payments)
    .set({ providerReference: result.providerReference })
    .where(eq(payments.id, payment.id));
  return { paymentId: payment.id, redirectUrl: result.redirectUrl };
}

const FINAL: ProviderPaymentStatus[] = ["succeeded", "failed", "expired"];

/**
 * Applies the provider's answer to a payment. Safe to call many times, from the return page and
 * from webhooks, in any order: only a pending payment changes, and the ledger is written in the
 * same database transaction as the status change, so it can never be written twice.
 */
export async function settlePayment(
  providerReference: string,
  status: ProviderPaymentStatus,
): Promise<"settled" | "unchanged" | "unknown"> {
  if (!FINAL.includes(status)) return "unchanged";

  return db.transaction(async (tx) => {
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.providerReference, providerReference))
      .for("update");
    if (!payment) return "unknown";
    if (payment.status !== "pending") return "unchanged";

    await tx.update(payments).set({ status }).where(eq(payments.id, payment.id));

    if (status === "succeeded") {
      const stitchClearing = await ensureAccount(tx, {
        sellerId: null,
        type: "asset",
        name: "Stitch clearing",
      });
      const feeIncome = await ensureAccount(tx, {
        sellerId: null,
        type: "revenue",
        name: "Fee income",
      });
      const sellerBalance = await ensureAccount(tx, {
        sellerId: payment.sellerId,
        type: "liability",
        name: "Seller balance",
      });
      await postTransaction(
        tx,
        paymentSettlementLines({
          paymentId: payment.id,
          amountCents: payment.amountCents,
          feeCents: payment.feeCents,
          accounts: { stitchClearing, sellerBalance, feeIncome },
        }),
      );
      if (payment.requestId) {
        await tx
          .update(paymentRequests)
          .set({ status: "paid" })
          .where(
            and(
              eq(paymentRequests.id, payment.requestId),
              inArray(paymentRequests.status, ["open"]),
            ),
          );
      }
    }

    await tx.insert(auditLog).values({
      action: `payment.${status}`,
      entity: "payments",
      entityId: payment.id,
      after: { amountCents: payment.amountCents, feeCents: payment.feeCents },
    });
    return "settled";
  });
}

/** Pulls the latest status from the provider for a payment still pending, then settles it. */
export async function refreshPayment(paymentId: string) {
  const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
  if (payment?.status === "pending" && payment.providerReference) {
    const result = await getPaymentProvider().getPaymentStatus(payment.providerReference);
    await settlePayment(payment.providerReference, result.status);
    return (
      (await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1))[0] ?? payment
    );
  }
  return payment ?? null;
}

export async function getSellerByHandle(handle: string) {
  const [seller] = await db
    .select({
      id: sellers.id,
      displayName: sellers.displayName,
      handle: sellers.handle,
      plan: sellers.plan,
      status: sellers.status,
      onboardedAt: sellers.onboardedAt,
    })
    .from(sellers)
    .where(eq(sellers.handle, handle.toLowerCase()))
    .limit(1);
  return seller && seller.onboardedAt ? seller : null;
}
