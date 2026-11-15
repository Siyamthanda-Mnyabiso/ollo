import { formatRand } from "@/lib/money";

/**
 * Every payment limit and expiry lives here and nowhere else. Amounts are integer cents.
 */

/** Smallest and largest single payment Ollo accepts from anyone. */
export const MIN_PAYMENT_CENTS = 500; // R5
export const MAX_PAYMENT_CENTS = 5_000_000; // R50 000

/** A payment request stays open this long unless it is paid or cancelled. */
export const REQUEST_LIFETIME_DAYS = 7;

/**
 * Limits for every seller until an admin changes them. Kept low for new sellers.
 * An admin can raise or lower either number for one seller (sellers.limit_per_payment_cents
 * and sellers.limit_per_day_cents). A null value in the database means "use the default".
 */
export const DEFAULT_SELLER_LIMITS = {
  perPaymentCents: 500_000, // R5 000
  perDayCents: 2_000_000, // R20 000
} as const;

/** A pending payment still counts toward the day's limit for this long. */
export const PENDING_COUNTS_FOR_MINUTES = 20;

export interface SellerLimits {
  perPaymentCents: number;
  perDayCents: number;
}

export function resolveLimits(seller: {
  limitPerPaymentCents: number | null;
  limitPerDayCents: number | null;
}): SellerLimits {
  return {
    perPaymentCents: seller.limitPerPaymentCents ?? DEFAULT_SELLER_LIMITS.perPaymentCents,
    perDayCents: seller.limitPerDayCents ?? DEFAULT_SELLER_LIMITS.perDayCents,
  };
}

export type LimitCheck =
  | { ok: true }
  | { ok: false; reason: "per_payment"; limitCents: number }
  | { ok: false; reason: "per_day"; limitCents: number; remainingCents: number };

/** `countedTodayCents` is what the seller has already received or has pending today. */
export function checkLimits(args: {
  amountCents: number;
  limits: SellerLimits;
  countedTodayCents: number;
}): LimitCheck {
  const { amountCents, limits, countedTodayCents } = args;
  if (amountCents > limits.perPaymentCents) {
    return { ok: false, reason: "per_payment", limitCents: limits.perPaymentCents };
  }
  if (countedTodayCents + amountCents > limits.perDayCents) {
    return {
      ok: false,
      reason: "per_day",
      limitCents: limits.perDayCents,
      remainingCents: Math.max(0, limits.perDayCents - countedTodayCents),
    };
  }
  return { ok: true };
}

/** Start of the current day in South Africa (UTC+2, no daylight saving), as a UTC Date. */
export function startOfDaySouthAfrica(now: Date = new Date()): Date {
  const offsetMs = 2 * 60 * 60 * 1000;
  const local = new Date(now.getTime() + offsetMs);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - offsetMs);
}

/** Plain wording for the buyer. It says what to do next and never mentions other customers' payments. */
export function limitMessage(
  check: Extract<LimitCheck, { ok: false }>,
  sellerName: string,
): string {
  if (check.reason === "per_payment") {
    return `${sellerName} can accept up to ${formatRand(check.limitCents)} in one payment. Please pay a smaller amount, or pay in parts.`;
  }
  return `${sellerName} cannot accept this payment right now because it is over their limit for today. Please try again tomorrow or ask them to contact Ollo.`;
}
