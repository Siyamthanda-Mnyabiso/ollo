"use server";

import { getEnv } from "@/lib/env";
import { placeOrder } from "@/lib/orders/service";

export type CheckoutResult = { error: string } | { next: string };

/**
 * Makes the order on the server. The form sends item ids and quantities; prices and the delivery
 * fee are worked out here. With payments off the buyer lands on "Order request sent"; with them on
 * they go on to Choose payment.
 */
export async function submitOrder(handle: string, raw: unknown): Promise<CheckoutResult> {
  const placed = await placeOrder(handle, raw);
  if (!placed.ok) return { error: placed.error };
  const base = `/${handle.toLowerCase()}/orders/${placed.order.accessToken}`;
  return { next: getEnv().PAYMENTS_LIVE ? `${base}/pay` : `${base}/requested` };
}
