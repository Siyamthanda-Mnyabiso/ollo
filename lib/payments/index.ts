import { getEnv } from "@/lib/env";
import { MockProvider } from "./mock";
import type { PaymentProvider } from "./provider";

export * from "./types";
export type { PaymentProvider } from "./provider";
export { MockProvider, MOCK_SCENARIOS, MOCK_SIGNATURE_HEADER, type MockScenario } from "./mock";

let provider: PaymentProvider | undefined;

/** The provider chosen by PAYMENT_PROVIDER. The Stitch implementation is not written yet. */
export function getPaymentProvider(): PaymentProvider {
  if (provider) return provider;
  const env = getEnv();
  if (env.PAYMENT_PROVIDER === "stitch") {
    throw new Error("The Stitch provider is not implemented yet. Set PAYMENT_PROVIDER=mock.");
  }
  provider = new MockProvider({
    scenario: env.MOCK_PAYMENT_SCENARIO,
    webhookSecret: env.MOCK_WEBHOOK_SECRET,
  });
  return provider;
}
