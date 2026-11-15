import {
  FEE_RATES_BPS,
  METHOD_CLASS,
  MINIMUM_FEE_CENTS,
  type PaymentMethod,
  type Plan,
} from "./config";

export * from "./config";

export interface FeeInput {
  amountCents: number;
  method: PaymentMethod;
  plan: Plan;
}

/**
 * Returns the Ollo fee in integer cents.
 *
 * - rate comes from FEE_RATES_BPS for the plan and method class
 * - rounding is half up, done in integer maths (no floats)
 * - the fee is never below MINIMUM_FEE_CENTS
 * - the fee never exceeds the payment amount itself
 */
export function calculateFeeCents({ amountCents, method, plan }: FeeInput): number {
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    throw new RangeError("amountCents must be a positive integer");
  }
  const rateBps = FEE_RATES_BPS[plan][METHOD_CLASS[method]];
  const computed = Math.floor((amountCents * rateBps + 5000) / 10000);
  return Math.min(Math.max(computed, MINIMUM_FEE_CENTS), amountCents);
}

/** What the seller receives after the fee. */
export function netAmountCents(input: FeeInput): number {
  return input.amountCents - calculateFeeCents(input);
}
