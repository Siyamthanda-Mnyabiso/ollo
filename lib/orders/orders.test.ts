import { describe, expect, it } from "vitest";
import { fulfilmentOptions, isOfferedDate, offeredDates } from "@/lib/orders/availability";
import { orderInputSchema, priceOrder, type OrderInput } from "@/lib/orders/pricing";

// Monday 16 November 2026, midday in South Africa.
const NOW = new Date("2026-11-16T10:00:00Z");
const ITEM_A = "11111111-1111-4111-8111-111111111111";
const ITEM_B = "22222222-2222-4222-8222-222222222222";
const items = [
  { id: ITEM_A, name: "Brazilian straight", priceCents: 125000 },
  { id: ITEM_B, name: "Silk bonnet", priceCents: 12000 },
];
const seller = {
  fulfilment: "both",
  collectionAddress: "Observatory, Cape Town",
  deliveryFeeCents: 6000,
  deliveryDays: [1, 2, 6], // Monday, Tuesday, Saturday
  deliverySlots: ["10:00 to 12:00", "14:00 to 16:00"],
};
const base = {
  clientKey: "key-12345678",
  fullName: "Nomsa Dlamini",
  phone: "071 234 5678",
  method: "delivery" as const,
  street: "12 Long Street",
  suburb: "Gardens, Cape Town",
  date: "2026-11-16",
  slot: "10:00 to 12:00",
  lines: [{ itemId: ITEM_A, quantity: 1, options: [{ name: "Length", value: '14"' }] }],
};
const parse = (over: Record<string, unknown> = {}): OrderInput =>
  orderInputSchema.parse({ ...base, ...over });

describe("priceOrder", () => {
  it("prices from the seller's items and adds the flat delivery fee", () => {
    const r = priceOrder(
      parse({
        lines: [
          { itemId: ITEM_A, quantity: 2 },
          { itemId: ITEM_B, quantity: 1 },
        ],
      }),
      seller,
      items,
      NOW,
    );
    expect(r).toMatchObject({
      ok: true,
      order: {
        subtotalCents: 262000,
        deliveryFeeCents: 6000,
        totalCents: 268000,
        buyerPhone: "+27712345678",
      },
    });
  });

  it("ignores any price, fee or total the browser sends", () => {
    const tampered = parse({
      priceCents: 1,
      totalCents: 1,
      deliveryFeeCents: 0,
      lines: [{ itemId: ITEM_A, quantity: 1, priceCents: 1, unitPriceCents: 1 }],
    });
    const r = priceOrder(tampered, seller, items, NOW);
    expect(r).toMatchObject({
      ok: true,
      order: { subtotalCents: 125000, deliveryFeeCents: 6000, totalCents: 131000 },
    });
    if (r.ok) expect(r.order.lines[0]!.unitPriceCents).toBe(125000);
  });

  it("refuses an item the seller does not have or has hidden", () => {
    const r = priceOrder(
      parse({ lines: [{ itemId: "33333333-3333-4333-8333-333333333333", quantity: 1 }] }),
      seller,
      items,
      NOW,
    );
    expect(r).toEqual({ ok: false, error: "An item in your cart is no longer available" });
  });

  it("makes collection free and keeps no address", () => {
    const r = priceOrder(
      parse({ method: "collection", street: undefined, suburb: undefined }),
      seller,
      items,
      NOW,
    );
    expect(r).toMatchObject({
      ok: true,
      order: { deliveryFeeCents: 0, totalCents: 125000, street: null },
    });
  });

  it("needs an address for delivery", () => {
    expect(priceOrder(parse({ street: "" }), seller, items, NOW)).toMatchObject({ ok: false });
  });

  it("refuses a method the seller does not offer", () => {
    const collectOnly = { ...seller, fulfilment: "collection" };
    expect(priceOrder(parse(), collectOnly, items, NOW)).toEqual({
      ok: false,
      error: "This seller does not deliver",
    });
    const noFee = { ...seller, deliveryFeeCents: null };
    expect(priceOrder(parse(), noFee, items, NOW)).toMatchObject({ ok: false });
  });

  it("refuses a day the seller does not work, a day too far ahead, and an unknown time", () => {
    expect(priceOrder(parse({ date: "2026-11-18" }), seller, items, NOW)).toMatchObject({
      ok: false,
    }); // Wednesday
    expect(priceOrder(parse({ date: "2026-12-28" }), seller, items, NOW)).toMatchObject({
      ok: false,
    });
    expect(priceOrder(parse({ date: "2026-11-15" }), seller, items, NOW)).toMatchObject({
      ok: false,
    }); // yesterday
    expect(priceOrder(parse({ slot: "00:00 to 23:59" }), seller, items, NOW)).toMatchObject({
      ok: false,
    });
  });

  it("refuses a bad cellphone number", () => {
    expect(priceOrder(parse({ phone: "12345" }), seller, items, NOW)).toMatchObject({ ok: false });
  });
});

describe("the input schema", () => {
  it("refuses empty carts, zero or huge quantities and bad ids", () => {
    expect(orderInputSchema.safeParse({ ...base, lines: [] }).success).toBe(false);
    expect(
      orderInputSchema.safeParse({ ...base, lines: [{ itemId: ITEM_A, quantity: 0 }] }).success,
    ).toBe(false);
    expect(
      orderInputSchema.safeParse({ ...base, lines: [{ itemId: ITEM_A, quantity: 100 }] }).success,
    ).toBe(false);
    expect(
      orderInputSchema.safeParse({ ...base, lines: [{ itemId: "nope", quantity: 1 }] }).success,
    ).toBe(false);
  });
});

describe("what a seller offers", () => {
  it("offers nothing until the seller has set delivery and collection up", () => {
    const empty = {
      fulfilment: "both",
      collectionAddress: null,
      deliveryFeeCents: null,
      deliveryDays: [],
      deliverySlots: [],
    };
    expect(fulfilmentOptions(empty)).toEqual({ delivery: false, collection: false });
    expect(offeredDates(empty, NOW)).toEqual([]);
  });

  it("offers each method only when its details are set", () => {
    expect(fulfilmentOptions(seller)).toEqual({ delivery: true, collection: true });
    expect(fulfilmentOptions({ ...seller, fulfilment: "delivery" })).toEqual({
      delivery: true,
      collection: false,
    });
    expect(fulfilmentOptions({ ...seller, collectionAddress: " " })).toEqual({
      delivery: true,
      collection: false,
    });
    expect(fulfilmentOptions({ ...seller, deliverySlots: [] })).toEqual({
      delivery: false,
      collection: false,
    });
  });

  it("lists the next working days, starting today, labelled like the frame", () => {
    expect(offeredDates(seller, NOW)).toEqual([
      { value: "2026-11-16", label: "Mon 16 Nov" },
      { value: "2026-11-17", label: "Tue 17 Nov" },
      { value: "2026-11-21", label: "Sat 21 Nov" },
    ]);
    expect(isOfferedDate(seller, "2026-11-21", NOW)).toBe(true);
    expect(isOfferedDate(seller, "2026-11-22", NOW)).toBe(false);
  });

  it("uses the South African date near midnight", () => {
    // 22:30 UTC on Sunday is already 00:30 on Monday in South Africa.
    const lateSunday = new Date("2026-11-15T22:30:00Z");
    expect(offeredDates(seller, lateSunday)[0]!.value).toBe("2026-11-16");
  });
});
