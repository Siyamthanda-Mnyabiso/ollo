import { describe, expect, it } from "vitest";
import { MockProvider, type MockScenario } from "./mock";
import { InvalidWebhookError, ProviderTimeoutError, type CreatePaymentInput } from "./types";

const make = (scenario: MockScenario) =>
  new MockProvider({ scenario, webhookSecret: "secret-secret" });
const input = (key = "key-1"): CreatePaymentInput => ({
  idempotencyKey: key,
  amountCents: 10_000,
  method: "payshap",
  reference: "OL-1",
  buyer: { name: "Nomsa" },
  returnUrl: "https://ollo.test/pay/return",
});

describe("MockProvider payments", () => {
  it("succeeds by default", async () => {
    const p = make("success");
    const created = await p.createPayment(input());
    expect(created.status).toBe("pending");
    expect((await p.getPaymentStatus(created.providerReference)).status).toBe("succeeded");
  });

  it("returns the same payment for the same idempotency key", async () => {
    const p = make("success");
    const a = await p.createPayment(input("same"));
    const b = await p.createPayment(input("same"));
    const c = await p.createPayment(input("other"));
    expect(b.providerReference).toBe(a.providerReference);
    expect(c.providerReference).not.toBe(a.providerReference);
  });

  it("declines", async () => {
    const p = make("decline");
    const created = await p.createPayment(input());
    expect(await p.getPaymentStatus(created.providerReference)).toMatchObject({
      status: "failed",
      failureReason: "declined",
    });
  });

  it("times out once, then returns the already created payment on retry, then expires", async () => {
    const p = make("timeout");
    await expect(p.createPayment(input("t"))).rejects.toBeInstanceOf(ProviderTimeoutError);
    const retry = await p.createPayment(input("t"));
    expect((await p.getPaymentStatus(retry.providerReference)).status).toBe("expired");
  });

  it("reports unknown references as failed", async () => {
    expect((await make("success").getPaymentStatus("nope")).status).toBe("failed");
  });
});

describe("MockProvider webhooks", () => {
  it("verifies a genuine webhook", async () => {
    const p = make("success");
    const [d] = p.webhookDeliveries("ref-1");
    const event = await p.verifyWebhook(d.body, d.headers);
    expect(event).toMatchObject({ type: "payment.succeeded", providerReference: "ref-1" });
  });

  it("rejects a missing or wrong signature and a tampered body", async () => {
    const p = make("success");
    const [d] = p.webhookDeliveries("ref-1");
    await expect(p.verifyWebhook(d.body, {})).rejects.toBeInstanceOf(InvalidWebhookError);
    await expect(p.verifyWebhook(d.body, { "x-mock-signature": "abc" })).rejects.toBeInstanceOf(
      InvalidWebhookError,
    );
    await expect(
      p.verifyWebhook(d.body.replace("ref-1", "ref-2"), d.headers),
    ).rejects.toBeInstanceOf(InvalidWebhookError);
  });

  it("sends the same event twice for duplicate_webhook", async () => {
    const p = make("duplicate_webhook");
    const deliveries = p.webhookDeliveries("ref-1");
    expect(deliveries).toHaveLength(2);
    const [a, b] = await Promise.all(deliveries.map((d) => p.verifyWebhook(d.body, d.headers)));
    expect(a.id).toBe(b.id);
  });

  it("delays the webhook for late_webhook", () => {
    const [d] = make("late_webhook").webhookDeliveries("ref-1");
    expect(d.delayMs).toBeGreaterThan(0);
  });

  it("sends failure and expiry events for decline and timeout", async () => {
    for (const [scenario, type] of [
      ["decline", "payment.failed"],
      ["timeout", "payment.expired"],
    ] as const) {
      const p = make(scenario);
      const [d] = p.webhookDeliveries("r");
      expect((await p.verifyWebhook(d.body, d.headers)).type).toBe(type);
    }
  });
});

describe("MockProvider payouts and bank checks", () => {
  it("is idempotent for payouts", async () => {
    const p = make("success");
    const base = {
      idempotencyKey: "po-1",
      amountCents: 5000,
      reference: "r",
      bankName: "Capitec",
      accountNumber: "1234567890",
      accountHolder: "T Ndlovu",
    };
    expect((await p.createPayout(base)).providerReference).toBe(
      (await p.createPayout(base)).providerReference,
    );
  });

  it("verifies bank accounts", async () => {
    const p = make("success");
    expect(
      await p.verifyBankAccount({
        bankName: "Capitec",
        accountNumber: "1234567891",
        accountHolder: "T Ndlovu",
      }),
    ).toEqual({ verified: true });
    expect(
      (
        await p.verifyBankAccount({
          bankName: "Capitec",
          accountNumber: "1230000",
          accountHolder: "T",
        })
      ).reason,
    ).toBe("account_not_found");
    expect(
      (
        await p.verifyBankAccount({
          bankName: "Capitec",
          accountNumber: "1234567891",
          accountHolder: "MISMATCH",
        })
      ).reason,
    ).toBe("name_mismatch");
  });
});

describe("MockProvider refunds", () => {
  it("refunds once per idempotency key", async () => {
    const p = make("success");
    const created = await p.createPayment(input());
    const a = await p.refundPayment({
      idempotencyKey: "r1",
      providerReference: created.providerReference,
      amountCents: 10_000,
    });
    const b = await p.refundPayment({
      idempotencyKey: "r1",
      providerReference: created.providerReference,
      amountCents: 10_000,
    });
    expect(a.status).toBe("succeeded");
    expect(b.providerReference).toBe(a.providerReference);
  });
});
