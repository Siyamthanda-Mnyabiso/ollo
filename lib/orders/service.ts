import "server-only";
import { randomBytes } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { items, orderLines, orders, sellers } from "@/lib/db/schema";
import { orderInputSchema, priceOrder } from "@/lib/orders/pricing";

export interface PlacedOrder {
  id: string;
  number: number;
  accessToken: string;
}

export type PlaceResult =
  { ok: true; order: PlacedOrder; duplicate: boolean } | { ok: false; error: string };

const findByKey = async (sellerId: string, clientKey: string): Promise<PlacedOrder | undefined> =>
  (
    await db
      .select({ id: orders.id, number: orders.number, accessToken: orders.accessToken })
      .from(orders)
      .where(and(eq(orders.sellerId, sellerId), eq(orders.clientKey, clientKey)))
      .limit(1)
  )[0] as PlacedOrder | undefined;

/**
 * Creates an order for the seller with this handle. Prices, the delivery fee and the total come from
 * the database; a repeat of the same clientKey returns the order already made.
 */
export async function placeOrder(
  handle: string,
  raw: unknown,
  now = new Date(),
): Promise<PlaceResult> {
  const parsed = orderInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check your details and try again",
    };
  }
  const input = parsed.data;

  const [seller] = await db
    .select()
    .from(sellers)
    .where(eq(sellers.handle, handle.toLowerCase()))
    .limit(1);
  if (!seller || !seller.onboardedAt || seller.status === "suspended") {
    return { ok: false, error: "This pay page could not be found" };
  }

  const again = await findByKey(seller.id, input.clientKey);
  if (again) return { ok: true, order: again, duplicate: true };

  const rows = await db
    .select({ id: items.id, name: items.name, priceCents: items.priceCents })
    .from(items)
    .where(
      and(
        eq(items.sellerId, seller.id),
        eq(items.active, true),
        inArray(items.id, [...new Set(input.lines.map((l) => l.itemId))]),
      ),
    );

  const priced = priceOrder(input, seller, rows, now);
  if (!priced.ok) return priced;
  const o = priced.order;

  try {
    const placed = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(orders)
        .values({
          sellerId: seller.id,
          accessToken: randomBytes(24).toString("base64url"),
          clientKey: o.clientKey,
          buyerName: o.buyerName,
          buyerPhone: o.buyerPhone,
          method: o.method,
          street: o.street,
          suburb: o.suburb,
          deliveryDate: o.deliveryDate,
          deliverySlot: o.deliverySlot,
          subtotalCents: o.subtotalCents,
          deliveryFeeCents: o.deliveryFeeCents,
          totalCents: o.totalCents,
        })
        .returning({ id: orders.id, number: orders.number, accessToken: orders.accessToken });
      await tx.insert(orderLines).values(
        o.lines.map((l) => ({
          orderId: row!.id,
          itemId: l.itemId,
          name: l.name,
          options: l.options,
          quantity: l.quantity,
          unitPriceCents: l.unitPriceCents,
        })),
      );
      return row as PlacedOrder;
    });
    return { ok: true, order: placed, duplicate: false };
  } catch (e) {
    // Two submits at the same moment: the second hits the unique key and gets the first order.
    const winner = await findByKey(seller.id, input.clientKey);
    if (winner) return { ok: true, order: winner, duplicate: true };
    throw e;
  }
}

/** An order for its buyer's link. Returns nothing for a wrong or made-up token. */
export async function getOrderByToken(handle: string, token: string) {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const [row] = await db
    .select({ order: orders, seller: { id: sellers.id, handle: sellers.handle } })
    .from(orders)
    .innerJoin(sellers, eq(sellers.id, orders.sellerId))
    .where(and(eq(orders.accessToken, token), eq(sellers.handle, handle.toLowerCase())))
    .limit(1);
  if (!row) return null;
  const lines = await db.select().from(orderLines).where(eq(orderLines.orderId, row.order.id));
  return { ...row.order, lines };
}
