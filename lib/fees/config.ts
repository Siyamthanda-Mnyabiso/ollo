/**
 * Fee rates live here and nowhere else.
 * Rates are in basis points (1 bps = 0.01%), so 300 = 3%.
 */
export const PLANS = ["free", "pro"] as const;
export type Plan = (typeof PLANS)[number];

export const PAYMENT_METHODS = ["payshap", "capitec_pay", "instant_eft", "card"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type MethodClass = "bank" | "card";

export const METHOD_CLASS: Record<PaymentMethod, MethodClass> = {
  payshap: "bank",
  capitec_pay: "bank",
  instant_eft: "bank",
  card: "card",
};

export const FEE_RATES_BPS: Record<Plan, Record<MethodClass, number>> = {
  free: { bank: 300, card: 390 },
  pro: { bank: 250, card: 390 },
};

export const MINIMUM_FEE_CENTS = 100;
