import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { decryptField } from "@/lib/crypto";
import { db } from "@/lib/db";
import { auditLog, payments, payouts, sellers, sellerVerification } from "@/lib/db/schema";
import { ensureAccount, payoutLines, postTransaction } from "@/lib/ledger";
import { getPaymentProvider } from "@/lib/payments";
import { getEnv } from "@/lib/env";
import { isPaused, shouldPayOut, type PayoutTrigger } from "./config";

/** Pays the seller when a payment is confirmed, if that method is set to "on_confirmation". */
export const payoutOnConfirmation = (paymentId: string) => payOut(paymentId, "confirmation");

/**
 * Pays the seller once the provider reports the funds as settled, if that method is set to
 * "on_settlement". Call this from the provider's settlement event or a reconciliation job.
 */
export const payoutOnSettlement = (paymentId: string) => payOut(paymentId, "settlement");

/**
 * Sends the seller their money for one succeeded payment, but only at the moment its method is
 * configured for (see PAYOUT_TIMING). Does nothing for a seller whose payouts are paused or one
 * without a verified bank account.
 * Never throws: a payout problem must not undo a payment. An unsent payout is simply not made
 * yet, and the money stays in the seller's balance.
 */
async function payOut(
  paymentId: string,
  trigger: PayoutTrigger,
): Promise<"sent" | "skipped" | "failed"> {
  try {
    const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
    if (
      !payment ||
      payment.status !== "succeeded" ||
      !shouldPayOut(getEnv().PAYMENT_PROVIDER, payment.method, trigger)
    )
      return "skipped";

    const [seller] = await db
      .select()
      .from(sellers)
      .where(eq(sellers.id, payment.sellerId))
      .limit(1);
    const [bank] = await db
      .select()
      .from(sellerVerification)
      .where(eq(sellerVerification.sellerId, payment.sellerId))
      .limit(1);
    if (!seller || isPaused(seller.payoutsPausedUntil)) return "skipped";
    if (
      !bank ||
      bank.bankStatus !== "verified" ||
      !bank.accountNumber ||
      !bank.bankName ||
      !bank.accountHolder
    ) {
      return "skipped";
    }

    const amountCents = payment.amountCents - payment.feeCents;
    if (amountCents <= 0) return "skipped";
    const idempotencyKey = `payout_${payment.id}`;

    const [created] = await db
      .insert(payouts)
      .values({ sellerId: seller.id, paymentId: payment.id, amountCents, idempotencyKey })
      .onConflictDoNothing({ target: payouts.idempotencyKey })
      .returning();
    const payout =
      created ??
      (await db.select().from(payouts).where(eq(payouts.idempotencyKey, idempotencyKey)))[0]!;
    if (payout.status === "paid") return "sent";

    const result = await getPaymentProvider().createPayout({
      idempotencyKey,
      amountCents,
      reference: payout.id,
      bankName: bank.bankName,
      accountNumber: decryptField(bank.accountNumber),
      accountHolder: bank.accountHolder,
    });

    await db.transaction(async (tx) => {
      const [locked] = await tx
        .select()
        .from(payouts)
        .where(eq(payouts.id, payout.id))
        .for("update");
      if (!locked || locked.status === "paid") return;
      await tx
        .update(payouts)
        .set({
          status: result.status,
          providerReference: result.providerReference,
          landedAt: result.status === "paid" ? new Date() : null,
        })
        .where(eq(payouts.id, payout.id));
      const stitchClearing = await ensureAccount(tx, {
        sellerId: null,
        type: "asset",
        name: "Stitch clearing",
      });
      const sellerBalance = await ensureAccount(tx, {
        sellerId: seller.id,
        type: "liability",
        name: "Seller balance",
      });
      await postTransaction(
        tx,
        payoutLines({
          payoutId: payout.id,
          paymentId: payment.id,
          amountCents,
          accounts: { stitchClearing, sellerBalance },
        }),
      );
      await tx.insert(auditLog).values({
        actor: null,
        action: "payout.sent",
        entity: "payouts",
        entityId: payout.id,
        after: { amountCents, status: result.status },
      });
    });
    return "sent";
  } catch (error) {
    console.error(
      "Instant payout failed",
      paymentId,
      error instanceof Error ? error.message : error,
    );
    return "failed";
  }
}

export function listPayouts(sellerId: string) {
  return db
    .select()
    .from(payouts)
    .where(eq(payouts.sellerId, sellerId))
    .orderBy(desc(payouts.createdAt))
    .limit(50);
}

export async function getBankSummary(sellerId: string) {
  const [row] = await db
    .select({
      bankName: sellerVerification.bankName,
      accountNumber: sellerVerification.accountNumber,
      bankStatus: sellerVerification.bankStatus,
    })
    .from(sellerVerification)
    .where(eq(sellerVerification.sellerId, sellerId))
    .limit(1);
  if (!row || row.bankStatus !== "verified" || !row.accountNumber || !row.bankName) return null;
  const last4 = decryptField(row.accountNumber).slice(-4);
  return { bankName: row.bankName, last4 };
}

export async function countPayoutsFor(paymentId: string) {
  const rows = await db
    .select({ id: payouts.id })
    .from(payouts)
    .where(and(eq(payouts.paymentId, paymentId)));
  return rows.length;
}
