import { z } from "zod";
import { normaliseZaPhone } from "@/lib/auth/phone";
import { fulfilmentOptions, isOfferedDate, type DeliverySettings } from "@/lib/orders/availability";

/*
 * Turns what the checkout form sent into an order, using only the seller's own items and delivery
 * settings. The browser sends item ids and quantities, never prices or fees: any price, fee or
 * total in the request is dropped by the schema and never read.
 */

export const orderInputSchema = z.object({
  /** Made when the form opens, so pressing the button twice makes one order. */
  clientKey: z.string().min(8).max(64),
  fullName: z.string().trim().min(2, "Enter your full name").max(80),
  phone: z.string().trim(),
  method: z.enum(["delivery", "collection"]),
  street: z.string().trim().max(120).optional(),
  suburb: z.string().trim().max(120).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slot: z.string().max(40),
  lines: z
    .array(
      z.object({
        itemId: z.uuid(),
        quantity: z.number().int().min(1).max(99),
        options: z
          .array(z.object({ name: z.string().max(30), value: z.string().max(40) }))
          .max(5)
          .default([]),
      }),
    )
    .min(1, "Your cart is empty")
    .max(30),
});
export type OrderInput = z.infer<typeof orderInputSchema>;

export interface PricedItem {
  id: string;
  name: string;
  priceCents: number;
}

export interface PricedOrder {
  clientKey: string;
  buyerName: string;
  buyerPhone: string;
  method: "delivery" | "collection";
  street: string | null;
  suburb: string | null;
  deliveryDate: string;
  deliverySlot: string;
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  lines: {
    itemId: string;
    name: string;
    options: { name: string; value: string }[];
    quantity: number;
    unitPriceCents: number;
  }[];
}

export type PriceResult = { ok: true; order: PricedOrder } | { ok: false; error: string };

/** `items` are the seller's active items for the ids asked for. */
export function priceOrder(
  input: OrderInput,
  seller: DeliverySettings,
  items: PricedItem[],
  now: Date,
): PriceResult {
  const phone = normaliseZaPhone(input.phone);
  if (!phone) return { ok: false, error: "Enter a valid South African cellphone number" };

  const offered = fulfilmentOptions(seller);
  if (!offered[input.method]) {
    return {
      ok: false,
      error:
        input.method === "delivery"
          ? "This seller does not deliver"
          : "This seller does not offer collection",
    };
  }
  if (!isOfferedDate(seller, input.date, now)) {
    return { ok: false, error: "Choose one of the available days" };
  }
  if (!seller.deliverySlots.includes(input.slot)) {
    return { ok: false, error: "Choose one of the available times" };
  }
  if (input.method === "delivery" && (!input.street?.trim() || !input.suburb?.trim())) {
    return { ok: false, error: "Enter your street address, suburb and city" };
  }

  const byId = new Map(items.map((i) => [i.id, i]));
  const lines: PricedOrder["lines"] = [];
  for (const l of input.lines) {
    const item = byId.get(l.itemId);
    if (!item) return { ok: false, error: "An item in your cart is no longer available" };
    lines.push({
      itemId: item.id,
      name: item.name,
      options: l.options,
      quantity: l.quantity,
      unitPriceCents: item.priceCents,
    });
  }

  const subtotalCents = lines.reduce((n, l) => n + l.unitPriceCents * l.quantity, 0);
  const deliveryFeeCents = input.method === "delivery" ? (seller.deliveryFeeCents ?? 0) : 0;
  return {
    ok: true,
    order: {
      clientKey: input.clientKey,
      buyerName: input.fullName,
      buyerPhone: phone,
      method: input.method,
      street: input.method === "delivery" ? input.street!.trim() : null,
      suburb: input.method === "delivery" ? input.suburb!.trim() : null,
      deliveryDate: input.date,
      deliverySlot: input.slot,
      subtotalCents,
      deliveryFeeCents,
      totalCents: subtotalCents + deliveryFeeCents,
      lines,
    },
  };
}
