import { METHOD_CLASS, type PaymentMethod } from "@/lib/fees/config";

/** After a seller changes their bank account, no payout is sent for this long. */
export const BANK_CHANGE_PAUSE_HOURS = 48;

/** Only bank payments are paid out instantly. Card payments are not. */
export const isInstantPayoutMethod = (method: PaymentMethod) => METHOD_CLASS[method] === "bank";

export function pauseUntilFrom(now: Date = new Date()): Date {
  return new Date(now.getTime() + BANK_CHANGE_PAUSE_HOURS * 60 * 60 * 1000);
}

export function isPaused(pausedUntil: Date | null, now: Date = new Date()): boolean {
  return pausedUntil !== null && pausedUntil.getTime() > now.getTime();
}
