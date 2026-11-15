import type { PaymentMethod } from "@/lib/fees/config";

export const METHOD_LABELS: Record<PaymentMethod, string> = {
  payshap: "PayShap",
  capitec_pay: "Capitec Pay",
  instant_eft: "Instant EFT",
  card: "Card",
};
