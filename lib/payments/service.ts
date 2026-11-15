import "server-only";
import { and, eq, gte, inArray, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { getEnv } from "@/lib/env";
import {
  auditLog,
  ledgerAccounts,
  ledgerEntries,
  paymentMethodSettings,
  paymentRequests,
  payments,
  sellers,
} from "@/lib/db/schema";
import { calculateFeeCents, PAYMENT_METHODS, type PaymentMethod } from "@/lib/fees";
import { ensureAccount, paymentSettlementLines, postTransaction, refundLines } from "@/lib/ledger";
import {
  checkLimits,
  PENDING_COUNTS_FOR_MINUTES,
  startOfDaySouthAfrica,
  type LimitCheck,
} from "@/lib/limits";
import { hasPayoutFor, payoutOnConfirmation } from "@/lib/payouts/service";
import { getPaymentProvider, PaymentsDisabledError } from "./index";
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

/** A payment was refused because it is over one of the seller's limits. */
export class PaymentLimitError extends Error {
  constructor(public readonly check: Extract<LimitCheck, { ok: false }>) {
    super(`Payment limit reached: ${check.reason}`);
    this.name = "PaymentLimitError";
  }
}

/** What the seller has received today plus payments started in the last few minutes. */
async function countedTodayCents(sellerId: string): Promise<number> {
  const pendingSince = new Date(Date.now() - PENDING_COUNTS_FOR_MINUTES * 60 * 1000);
  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${payments.amountCents}), 0)::bigint`.mapWith(Number),
    })
    .from(payments)
    .where(
      and(
        eq(payments.sellerId, sellerId),
        or(
          and(eq(payments.status, "succeeded"), gte(payments.createdAt, startOfDaySouthAfrica())),
          and(eq(payments.status, "pending"), gte(payments.createdAt, pendingSince)),
        ),
      ),
    );
  return row?.total ?? 0;
}

export interface StartPaymentInput {
  sellerId: string;
  plan: "free" | "pro";
  limits: { perPaymentCents: number; perDayCents: number };
  requestId?: string;
  item?: { id: string; name: string };
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
  // With the disabled provider, stop before anything is written.
  if (getEnv().PAYMENT_PROVIDER === "disabled") throw new PaymentsDisabledError();
  // A repeat of a payment already started (same key) is not checked again against the day's total.
  const [already] = await db
    .select({ id: payments.id })
    .from(payments)
    .where(eq(payments.idempotencyKey, input.idempotencyKey))
    .limit(1);
  if (!already) {
    const check = checkLimits({
      amountCents: input.amountCents,
      limits: input.limits,
      countedTodayCents: await countedTodayCents(input.sellerId),
    });
    if (!check.ok) throw new PaymentLimitError(check);
  }

  const feeCents = calculateFeeCents({
    amountCents: input.amountCents,
    method: input.method,
    plan: input.plan,
  });

  const [created] = await db
    .insert(payments)
    .values({
      sellerId: input.sellerId,
      source: input.requestId ? "request" : input.item ? "item" : "pay_link",
      requestId: input.requestId,
      itemId: input.item?.id,
      itemName: input.item?.name,
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

  const outcome = await settleInTransaction(providerReference, status);
  if (outcome.result === "settled" && status === "succeeded" && outcome.paymentId) {
    // After the commit, so a payout problem can never undo a settled payment.
    await payoutOnConfirmation(outcome.paymentId);
  }
  return outcome.result;
}

async function settleInTransaction(
  providerReference: string,
  status: ProviderPaymentStatus,
): Promise<{ result: "settled" | "unchanged" | "unknown"; paymentId?: string }> {
  return db.transaction(async (tx) => {
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.providerReference, providerReference))
      .for("update");
    if (!payment) return { result: "unknown" };
    if (payment.status !== "pending") return { result: "unchanged" };

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
    return { result: "settled", paymentId: payment.id };
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
      bio: sellers.bio,
      logoUrl: sellers.logoUrl,
      handle: sellers.handle,
      plan: sellers.plan,
      limitPerPaymentCents: sellers.limitPerPaymentCents,
      limitPerDayCents: sellers.limitPerDayCents,
      status: sellers.status,
      onboardedAt: sellers.onboardedAt,
    })
    .from(sellers)
    .where(eq(sellers.handle, handle.toLowerCase()))
    .limit(1);
  return seller && seller.onboardedAt ? seller : null;
}

type DbOrTx = Pick<typeof db, "select">;

/** What Ollo currently owes a seller: the negated sum of their "Seller balance" ledger account. */
export async function sellerOwedCents(conn: DbOrTx, sellerId: string): Promise<number> {
  const [row] = await conn
    .select({
      total: sql<number>`coalesce(sum(${ledgerEntries.amountCents}), 0)::bigint`.mapWith(Number),
    })
    .from(ledgerEntries)
    .innerJoin(ledgerAccounts, eq(ledgerAccounts.id, ledgerEntries.accountId))
    .where(and(eq(ledgerAccounts.sellerId, sellerId), eq(ledgerAccounts.name, "Seller balance")));
  return -(row?.total ?? 0);
}

export class RefundError extends Error {
  constructor(
    public readonly code:
      "not_found" | "not_refundable" | "paid_out" | "insufficient_balance" | "provider_failed",
  ) {
    super(`Refund refused: ${code}`);
    this.name = "RefundError";
  }
}

/**
 * Refunds a whole payment to the buyer. The provider call is idempotent on a key made from the
 * payment id, so a crash between the provider call and the database write is safe to retry.
 * The seller gives back what they received (amount minus fee) and Ollo gives back its fee.
 * If the seller has already been paid out and no longer has that balance, the refund is refused.
 */
export async function refundSellerPayment(args: {
  sellerId: string;
  paymentId: string;
  actorId: string;
}): Promise<void> {
  const [payment] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.id, args.paymentId), eq(payments.sellerId, args.sellerId)))
    .limit(1);
  if (!payment) throw new RefundError("not_found");
  if (payment.status !== "succeeded" || !payment.providerReference)
    throw new RefundError("not_refundable");
  // For launch a refund is only possible before the payout has gone out.
  if (await hasPayoutFor(payment.id)) throw new RefundError("paid_out");
  if ((await sellerOwedCents(db, args.sellerId)) < payment.amountCents - payment.feeCents) {
    throw new RefundError("insufficient_balance");
  }

  let result;
  try {
    result = await getPaymentProvider().refundPayment({
      idempotencyKey: `refund_${payment.id}`,
      providerReference: payment.providerReference,
      amountCents: payment.amountCents,
    });
  } catch {
    throw new RefundError("provider_failed");
  }
  if (result.status === "failed") throw new RefundError("provider_failed");

  await db.transaction(async (tx) => {
    const [locked] = await tx
      .select()
      .from(payments)
      .where(eq(payments.id, payment.id))
      .for("update");
    if (!locked || locked.status !== "succeeded") return; // Already refunded by an earlier attempt.
    await tx.update(payments).set({ status: "refunded" }).where(eq(payments.id, payment.id));
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
      refundLines({
        paymentId: payment.id,
        amountCents: payment.amountCents,
        feeCents: payment.feeCents,
        accounts: { stitchClearing, sellerBalance, feeIncome },
      }),
    );
    await tx.insert(auditLog).values({
      actor: args.actorId,
      action: "payment.refunded",
      entity: "payments",
      entityId: payment.id,
      after: { amountCents: payment.amountCents, feeCents: payment.feeCents },
    });
  });
}
