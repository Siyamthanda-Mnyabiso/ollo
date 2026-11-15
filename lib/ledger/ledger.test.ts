import { describe, expect, it } from "vitest";
import {
  assertBalanced,
  LedgerImbalanceError,
  paymentSettlementLines,
  payoutLines,
  refundLines,
} from "./entries";

const accounts = { stitchClearing: "clearing", sellerBalance: "seller", feeIncome: "fees" };

describe("assertBalanced", () => {
  it("accepts entries that sum to zero", () => {
    expect(() =>
      assertBalanced([
        { accountId: "a", amountCents: 500 },
        { accountId: "b", amountCents: -500 },
      ]),
    ).not.toThrow();
  });

  it("rejects entries that do not sum to zero", () => {
    expect(() =>
      assertBalanced([
        { accountId: "a", amountCents: 500 },
        { accountId: "b", amountCents: -499 },
      ]),
    ).toThrow(LedgerImbalanceError);
  });

  it("rejects fewer than two entries, zero amounts and non-integers", () => {
    expect(() => assertBalanced([{ accountId: "a", amountCents: 1 }])).toThrow();
    expect(() =>
      assertBalanced([
        { accountId: "a", amountCents: 0 },
        { accountId: "b", amountCents: 0 },
      ]),
    ).toThrow(RangeError);
    expect(() =>
      assertBalanced([
        { accountId: "a", amountCents: 1.5 },
        { accountId: "b", amountCents: -1.5 },
      ]),
    ).toThrow(RangeError);
  });
});

describe("paymentSettlementLines", () => {
  it("splits a payment into seller balance and fee income and balances", () => {
    const lines = paymentSettlementLines({
      paymentId: "p1",
      amountCents: 100_000,
      feeCents: 3000,
      accounts,
    });
    expect(() => assertBalanced(lines)).not.toThrow();
    expect(lines.find((l) => l.accountId === "seller")?.amountCents).toBe(-97_000);
    expect(lines.find((l) => l.accountId === "fees")?.amountCents).toBe(-3000);
    expect(lines.find((l) => l.accountId === "clearing")?.amountCents).toBe(100_000);
  });

  it("omits the fee line when the fee is zero", () => {
    const lines = paymentSettlementLines({
      paymentId: "p1",
      amountCents: 500,
      feeCents: 0,
      accounts,
    });
    expect(lines).toHaveLength(2);
    expect(() => assertBalanced(lines)).not.toThrow();
  });

  it("rejects a fee larger than the payment", () => {
    expect(() =>
      paymentSettlementLines({ paymentId: "p1", amountCents: 500, feeCents: 600, accounts }),
    ).toThrow(RangeError);
  });
});

describe("payoutLines", () => {
  it("balances and moves the seller balance and clearing in opposite directions", () => {
    const lines = payoutLines({ payoutId: "o1", amountCents: 97_000, accounts });
    expect(() => assertBalanced(lines)).not.toThrow();
    expect(lines[0]).toMatchObject({ accountId: "seller", amountCents: 97_000 });
    expect(lines[1]).toMatchObject({ accountId: "clearing", amountCents: -97_000 });
  });
});

describe("payment then payout", () => {
  const balanceOf = (lines: { accountId: string; amountCents: number }[], id: string) =>
    lines.filter((l) => l.accountId === id).reduce((n, l) => n + l.amountCents, 0);
  const settle = paymentSettlementLines({
    paymentId: "p",
    amountCents: 25_000,
    feeCents: 750,
    accounts,
  });
  const payout = payoutLines({
    payoutId: "o",
    paymentId: "p",
    amountCents: 25_000 - 750,
    accounts,
  });

  it("before any payout the seller is owed the net amount, which Stitch holds", () => {
    expect(balanceOf(settle, "seller")).toBe(-24_250);
    expect(balanceOf(settle, "clearing")).toBe(25_000);
  });

  it("after the payout the seller is owed nothing and only Ollo's fee stays with Stitch", () => {
    const all = [...settle, ...payout];
    expect(balanceOf(all, "seller")).toBe(0);
    expect(balanceOf(all, "clearing")).toBe(750);
    expect(balanceOf(all, "fees")).toBe(-750);
    expect(() => assertBalanced(all)).not.toThrow();
  });

  it("a payment waiting for settlement writes the same lines and no payout lines", () => {
    // "On settlement" only delays the payout. The payment itself is recorded the same way.
    expect(settle.every((l) => l.payoutId === undefined)).toBe(true);
  });
});

describe("refundLines", () => {
  const accounts = { stitchClearing: "clearing", sellerBalance: "seller", feeIncome: "fee" };
  it("exactly reverses a settlement and balances", () => {
    const settle = paymentSettlementLines({
      paymentId: "p",
      amountCents: 25_000,
      feeCents: 750,
      accounts,
    });
    const refund = refundLines({ paymentId: "p", amountCents: 25_000, feeCents: 750, accounts });
    expect(() => assertBalanced(refund)).not.toThrow();
    for (const l of settle) {
      const r = refund.find((x) => x.accountId === l.accountId)!;
      expect(r.amountCents).toBe(-l.amountCents);
    }
  });
});
