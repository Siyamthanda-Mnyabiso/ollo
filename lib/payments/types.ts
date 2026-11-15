import type { PaymentMethod } from "@/lib/fees/config";

export type { PaymentMethod };

export interface CreatePaymentInput {
  /** Same key, same payment. Providers must not create a second one. */
  idempotencyKey: string;
  amountCents: number;
  method: PaymentMethod;
  /** Our own reference, shown on bank statements where supported. */
  reference: string;
  description?: string;
  buyer: { name?: string; phone?: string };
  /** Where the provider sends the buyer after paying. */
  returnUrl: string;
}

export interface CreatePaymentResult {
  providerReference: string;
  status: "pending";
  /** Hosted checkout the buyer is sent to, when the provider has one. */
  redirectUrl?: string;
  expiresAt: Date;
}

export type ProviderPaymentStatus = "pending" | "succeeded" | "failed" | "expired";

export interface PaymentStatusResult {
  providerReference: string;
  status: ProviderPaymentStatus;
  failureReason?: string;
}

export interface RefundPaymentInput {
  /** Same key, same refund. A repeat must not refund the buyer twice. */
  idempotencyKey: string;
  providerReference: string;
  amountCents: number;
}

export interface RefundPaymentResult {
  providerReference: string;
  status: "succeeded" | "pending" | "failed";
}

export interface CreatePayoutInput {
  idempotencyKey: string;
  amountCents: number;
  reference: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface CreatePayoutResult {
  providerReference: string;
  status: "pending" | "processing" | "paid";
}

export interface VerifyBankAccountInput {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  idNumber?: string;
}

export interface VerifyBankAccountResult {
  verified: boolean;
  reason?: "name_mismatch" | "account_not_found" | "unavailable";
}

export type WebhookEventType =
  "payment.succeeded" | "payment.failed" | "payment.expired" | "payout.paid" | "payout.failed";

export interface WebhookEvent {
  /** Unique per event. Use it to ignore duplicate deliveries. */
  id: string;
  type: WebhookEventType;
  providerReference: string;
  occurredAt: Date;
}

export class ProviderTimeoutError extends Error {
  constructor(message = "The payment provider did not respond in time") {
    super(message);
    this.name = "ProviderTimeoutError";
  }
}

export class InvalidWebhookError extends Error {
  constructor(message = "Webhook could not be verified") {
    super(message);
    this.name = "InvalidWebhookError";
  }
}
