import type {
  CreatePaymentInput,
  CreatePaymentResult,
  CreatePayoutInput,
  CreatePayoutResult,
  PaymentStatusResult,
  VerifyBankAccountInput,
  VerifyBankAccountResult,
  WebhookEvent,
} from "./types";

/**
 * Everything Ollo needs from a payment processor. The rest of the app depends
 * on this interface only, so Stitch can be added without touching callers.
 */
export interface PaymentProvider {
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  getPaymentStatus(providerReference: string): Promise<PaymentStatusResult>;
  createPayout(input: CreatePayoutInput): Promise<CreatePayoutResult>;
  verifyBankAccount(input: VerifyBankAccountInput): Promise<VerifyBankAccountResult>;
  /** Checks the signature and parses the event. Throws InvalidWebhookError if it is not genuine. */
  verifyWebhook(
    rawBody: string,
    headers: Record<string, string | undefined>,
  ): Promise<WebhookEvent>;
}
