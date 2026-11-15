import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { PaymentProvider } from "./provider";
import {
  InvalidWebhookError,
  ProviderTimeoutError,
  type CreatePaymentInput,
  type CreatePaymentResult,
  type CreatePayoutInput,
  type CreatePayoutResult,
  type PaymentStatusResult,
  type VerifyBankAccountInput,
  type VerifyBankAccountResult,
  type WebhookEvent,
  type WebhookEventType,
} from "./types";

export const MOCK_SCENARIOS = [
  "success",
  "decline",
  "timeout",
  "duplicate_webhook",
  "late_webhook",
] as const;
export type MockScenario = (typeof MOCK_SCENARIOS)[number];

export const MOCK_SIGNATURE_HEADER = "x-mock-signature";

/** A webhook the mock would send, ready to POST at your webhook route. */
export interface MockWebhookDelivery {
  body: string;
  headers: Record<string, string>;
  /** How long after the payment this delivery arrives. Late webhooks arrive long after. */
  delayMs: number;
}

const LATE_WEBHOOK_DELAY_MS = 60 * 60 * 1000;

/**
 * Simulates a payment provider with no network calls and no timers.
 * Pick behaviour with MOCK_PAYMENT_SCENARIO:
 * - success            payment succeeds, one webhook
 * - decline            payment fails, one webhook
 * - timeout            createPayment throws on the first call although the payment
 *                      was created; a retry with the same key returns it. It then expires.
 * - duplicate_webhook  success, but the same event is delivered twice
 * - late_webhook       success, but the webhook arrives an hour later
 */
export class MockProvider implements PaymentProvider {
  private payments = new Map<
    string,
    { result: CreatePaymentResult; amountCents: number; timedOutOnce: boolean }
  >();
  private byReference = new Map<string, string>();
  private payouts = new Map<string, CreatePayoutResult>();

  constructor(
    private readonly options: { scenario: MockScenario; webhookSecret: string } = {
      scenario: "success",
      webhookSecret: "mock-webhook-secret",
    },
  ) {}

  get scenario(): MockScenario {
    return this.options.scenario;
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    let entry = this.payments.get(input.idempotencyKey);
    if (!entry) {
      const providerReference = `mock_pay_${randomUUID()}`;
      entry = {
        result: {
          providerReference,
          status: "pending",
          redirectUrl: `${input.returnUrl}${input.returnUrl.includes("?") ? "&" : "?"}mock_ref=${providerReference}`,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
        amountCents: input.amountCents,
        timedOutOnce: false,
      };
      this.payments.set(input.idempotencyKey, entry);
      this.byReference.set(providerReference, input.idempotencyKey);
    }
    if (this.options.scenario === "timeout" && !entry.timedOutOnce) {
      entry.timedOutOnce = true;
      throw new ProviderTimeoutError();
    }
    return entry.result;
  }

  async getPaymentStatus(providerReference: string): Promise<PaymentStatusResult> {
    // References are made by this mock, and the instance that made one is not always the one asked
    // (separate server bundles each hold their own), so a mock_pay_ reference counts as known.
    if (!this.byReference.has(providerReference) && !providerReference.startsWith("mock_pay_")) {
      return { providerReference, status: "failed", failureReason: "unknown_reference" };
    }
    switch (this.options.scenario) {
      case "decline":
        return { providerReference, status: "failed", failureReason: "declined" };
      case "timeout":
        return { providerReference, status: "expired" };
      default:
        return { providerReference, status: "succeeded" };
    }
  }

  async createPayout(input: CreatePayoutInput): Promise<CreatePayoutResult> {
    const existing = this.payouts.get(input.idempotencyKey);
    if (existing) return existing;
    const result: CreatePayoutResult = {
      providerReference: `mock_out_${randomUUID()}`,
      status: "paid",
    };
    this.payouts.set(input.idempotencyKey, result);
    return result;
  }

  /**
   * Account numbers ending 0000 are not found, ending 9999 simulate an outage, and a holder
   * containing MISMATCH fails the name check.
   */
  async verifyBankAccount(input: VerifyBankAccountInput): Promise<VerifyBankAccountResult> {
    if (input.accountNumber.endsWith("9999")) return { verified: false, reason: "unavailable" };
    if (input.accountNumber.endsWith("0000"))
      return { verified: false, reason: "account_not_found" };
    if (input.accountHolder.toUpperCase().includes("MISMATCH"))
      return { verified: false, reason: "name_mismatch" };
    return { verified: true };
  }

  async verifyWebhook(
    rawBody: string,
    headers: Record<string, string | undefined>,
  ): Promise<WebhookEvent> {
    const signature = headers[MOCK_SIGNATURE_HEADER];
    if (!signature) throw new InvalidWebhookError("Missing signature");
    const expected = this.sign(rawBody);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b))
      throw new InvalidWebhookError("Bad signature");
    const parsed = JSON.parse(rawBody) as {
      id: string;
      type: WebhookEventType;
      providerReference: string;
      occurredAt: string;
    };
    return {
      id: parsed.id,
      type: parsed.type,
      providerReference: parsed.providerReference,
      occurredAt: new Date(parsed.occurredAt),
    };
  }

  /** The webhook deliveries this scenario produces for a payment. For tests and local development. */
  webhookDeliveries(providerReference: string): MockWebhookDelivery[] {
    const type: WebhookEventType =
      this.options.scenario === "decline"
        ? "payment.failed"
        : this.options.scenario === "timeout"
          ? "payment.expired"
          : "payment.succeeded";
    const event = {
      id: `evt_${randomUUID()}`,
      type,
      providerReference,
      occurredAt: new Date().toISOString(),
    };
    const make = (delayMs: number): MockWebhookDelivery => {
      const body = JSON.stringify(event);
      return { body, headers: { [MOCK_SIGNATURE_HEADER]: this.sign(body) }, delayMs };
    };
    switch (this.options.scenario) {
      case "duplicate_webhook":
        return [make(0), make(0)];
      case "late_webhook":
        return [make(LATE_WEBHOOK_DELAY_MS)];
      default:
        return [make(0)];
    }
  }

  private sign(body: string): string {
    return createHmac("sha256", this.options.webhookSecret).update(body).digest("hex");
  }
}
