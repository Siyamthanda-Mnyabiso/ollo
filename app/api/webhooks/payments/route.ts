import { getPaymentProvider, InvalidWebhookError, PaymentsDisabledError } from "@/lib/payments";
import { settlePayment } from "@/lib/payments/service";

/**
 * Payment provider webhooks. The signature is checked before anything is read from the body, and
 * settling is idempotent, so duplicate and late deliveries are harmless.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const headers: Record<string, string | undefined> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  let event;
  try {
    event = await getPaymentProvider().verifyWebhook(rawBody, headers);
  } catch (error) {
    if (error instanceof PaymentsDisabledError)
      return new Response("Payments are not switched on", { status: 503 });
    if (error instanceof InvalidWebhookError)
      return new Response("Invalid signature", { status: 401 });
    return new Response("Bad request", { status: 400 });
  }

  const status =
    event.type === "payment.succeeded"
      ? "succeeded"
      : event.type === "payment.failed"
        ? "failed"
        : event.type === "payment.expired"
          ? "expired"
          : null;
  if (status) await settlePayment(event.providerReference, status);
  return new Response("ok", { status: 200 });
}
