import "server-only";
import { eq } from "drizzle-orm";
import { encryptField } from "@/lib/crypto";
import { db } from "@/lib/db";
import { auditLog, sellers, sellerVerification } from "@/lib/db/schema";
import { getPaymentProvider } from "@/lib/payments";
import { pauseUntilFrom } from "@/lib/payouts/config";
import { notifier } from "@/lib/notifications";
import { BANK_FAILURE_MESSAGES } from "./messages";

export type BankSaveResult = { ok: true } | { ok: false; message: string };

/**
 * Checks a bank account with the payment provider and saves it encrypted.
 *
 * - "onboarding": a failed check is recorded, because the seller has no account yet.
 * - "change": a failed check leaves the current verified account untouched. A successful change
 *   pauses payouts for BANK_CHANGE_PAUSE_HOURS, so a stolen session cannot redirect money at once.
 */
export async function saveVerifiedBank(args: {
  sellerId: string;
  userId: string;
  mode: "onboarding" | "change";
  input: { bankName: string; accountNumber: string; accountHolder: string };
}): Promise<BankSaveResult> {
  const { sellerId, userId, mode, input } = args;

  let result;
  try {
    result = await getPaymentProvider().verifyBankAccount(input);
  } catch {
    return { ok: false, message: BANK_FAILURE_MESSAGES.unavailable };
  }

  if (!result.verified) {
    if (mode === "onboarding") {
      await db
        .insert(sellerVerification)
        .values({ sellerId, bankStatus: "failed" })
        .onConflictDoUpdate({ target: sellerVerification.sellerId, set: { bankStatus: "failed" } });
    }
    return { ok: false, message: BANK_FAILURE_MESSAGES[result.reason ?? "unavailable"] };
  }

  const values = {
    bankName: input.bankName,
    accountNumber: encryptField(input.accountNumber),
    accountHolder: input.accountHolder,
    bankStatus: "verified" as const,
  };
  const pausedUntil = mode === "change" ? pauseUntilFrom() : null;
  await db.transaction(async (tx) => {
    await tx
      .insert(sellerVerification)
      .values({ sellerId, ...values })
      .onConflictDoUpdate({ target: sellerVerification.sellerId, set: values });
    if (pausedUntil) {
      await tx
        .update(sellers)
        .set({ payoutsPausedUntil: pausedUntil })
        .where(eq(sellers.id, sellerId));
    }
    // The account number itself never goes in the audit log.
    await tx.insert(auditLog).values({
      actor: userId,
      action: mode === "change" ? "seller.bank_changed" : "seller.bank_verified",
      entity: "seller_verification",
      entityId: sellerId,
      after: {
        bankName: input.bankName,
        lastFour: input.accountNumber.slice(-4),
        payoutsPausedUntil: pausedUntil?.toISOString() ?? null,
      },
    });
  });

  if (pausedUntil) {
    await notifier.send({
      sellerId,
      kind: "payout_landed",
      title: "Bank account changed. Payouts are paused for a while.",
      body: "If this was not you, contact Ollo straight away.",
      channels: ["dashboard", "sms"],
    });
  }
  return { ok: true };
}
