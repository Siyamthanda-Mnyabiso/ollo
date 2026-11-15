import type { PaymentProvider } from "./provider";

export const PAYMENTS_DISABLED_MESSAGE =
  "Payments are not switched on yet. Nothing was charged and no money moved.";

/** Thrown by every operation of the disabled provider. */
export class PaymentsDisabledError extends Error {
  constructor() {
    super(PAYMENTS_DISABLED_MESSAGE);
    this.name = "PaymentsDisabledError";
  }
}

/**
 * The provider for a live site that is not taking payments yet (PAYMENT_PROVIDER=disabled).
 * The app starts normally, but anything that would move money fails before it does anything.
 */
export class DisabledProvider implements PaymentProvider {
  createPayment(): Promise<never> {
    return Promise.reject(new PaymentsDisabledError());
  }
  getPaymentStatus(): Promise<never> {
    return Promise.reject(new PaymentsDisabledError());
  }
  refundPayment(): Promise<never> {
    return Promise.reject(new PaymentsDisabledError());
  }
  createPayout(): Promise<never> {
    return Promise.reject(new PaymentsDisabledError());
  }
  verifyBankAccount(): Promise<never> {
    return Promise.reject(new PaymentsDisabledError());
  }
  verifyWebhook(): Promise<never> {
    return Promise.reject(new PaymentsDisabledError());
  }
}
