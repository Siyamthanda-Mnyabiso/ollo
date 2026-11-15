import { describe, expect, it } from "vitest";
import { DisabledProvider, PAYMENTS_DISABLED_MESSAGE, PaymentsDisabledError } from "./disabled";

describe("DisabledProvider", () => {
  const provider = new DisabledProvider();
  const calls: [string, () => Promise<unknown>][] = [
    ["createPayment", () => provider.createPayment()],
    ["getPaymentStatus", () => provider.getPaymentStatus()],
    ["refundPayment", () => provider.refundPayment()],
    ["createPayout", () => provider.createPayout()],
    ["verifyBankAccount", () => provider.verifyBankAccount()],
    ["verifyWebhook", () => provider.verifyWebhook()],
  ];

  it.each(calls)("%s fails with a clear message", async (_name, call) => {
    await expect(call()).rejects.toBeInstanceOf(PaymentsDisabledError);
    await expect(call()).rejects.toThrow(PAYMENTS_DISABLED_MESSAGE);
  });

  it("the message says nothing was charged", () => {
    expect(PAYMENTS_DISABLED_MESSAGE).toMatch(/Nothing was charged/);
  });
});
