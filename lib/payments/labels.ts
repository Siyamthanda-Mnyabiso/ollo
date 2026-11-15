import type { PaymentMethod } from "@/lib/fees/config";

export const METHOD_LABELS: Record<PaymentMethod, string> = {
  payshap: "PayShap",
  capitec_pay: "Capitec Pay",
  instant_eft: "Instant EFT",
  card: "Card",
};

/** Shown instead of the refund button once the seller has been paid out for a payment. */
export const PAID_OUT_MESSAGE =
  "This payment has been paid out. Arrange the refund directly with your customer.";
