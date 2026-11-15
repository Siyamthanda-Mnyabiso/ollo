import { type PaymentMethod } from "@/lib/fees/config";

/** After a seller changes their bank account, no payout is sent for this long. */
export const BANK_CHANGE_PAUSE_HOURS = 48;

/**
 * When a seller is paid for a payment, per payment method. One place to change it.
 *
 * - "on_confirmation": paid out as soon as the provider confirms the payment. Only safe for
 *   methods where a confirmation means the money has really moved.
 * - "on_settlement": paid out only after the provider reports the funds as received (settled).
 *
 * Ollo must never pay out money it has not received, so every method on a real provider defaults
 * to "on_settlement" until Stitch confirms which methods release funds immediately. The mock has no
 * settlement step, so it pays bank methods on confirmation to let the whole flow be clicked through.
 */
export type PayoutTiming = "on_confirmation" | "on_settlement";
export type PayoutProvider = "mock" | "stitch";

export const PAYOUT_TIMING: Record<PayoutProvider, Record<PaymentMethod, PayoutTiming>> = {
  mock: {
    payshap: "on_confirmation",
    capitec_pay: "on_confirmation",
    instant_eft: "on_confirmation",
    card: "on_settlement",
  },
  // Change a method to "on_confirmation" here once Stitch confirms it releases funds immediately.
  stitch: {
    payshap: "on_settlement",
    capitec_pay: "on_settlement",
    instant_eft: "on_settlement",
    card: "on_settlement",
  },
};

export const payoutTimingFor = (provider: PayoutProvider, method: PaymentMethod): PayoutTiming =>
  PAYOUT_TIMING[provider][method];

/** The two moments a payout can be considered: the payment confirmed, or its funds settled. */
export type PayoutTrigger = "confirmation" | "settlement";

export function shouldPayOut(
  provider: PayoutProvider,
  method: PaymentMethod,
  trigger: PayoutTrigger,
): boolean {
  return (
    payoutTimingFor(provider, method) ===
    (trigger === "confirmation" ? "on_confirmation" : "on_settlement")
  );
}

export function pauseUntilFrom(now: Date = new Date()): Date {
  return new Date(now.getTime() + BANK_CHANGE_PAUSE_HOURS * 60 * 60 * 1000);
}

export function isPaused(pausedUntil: Date | null, now: Date = new Date()): boolean {
  return pausedUntil !== null && pausedUntil.getTime() > now.getTime();
}
